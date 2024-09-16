from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoTokenizer, AutoModelForSequenceClassification, BitsAndBytesConfig
from peft import PeftModel
from pydantic import BaseModel
import torch
import requests

API_URL = "https://plfyfec190nchov2.us-east-1.aws.endpoints.huggingface.cloud"

headers = {
	"Accept" : "application/json",
	"Authorization": "Bearer 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",
	"Content-Type": "application/json"
}

tokenizer = None
peft_model = None
model_setup = False

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Change this to the URL of your React app
    allow_credentials=True,
    allow_methods=["*"],  # Allow POST method only
    allow_headers=["*"],  # Allow all headers
)
 
class TextInput(BaseModel):
    text: str

def local_predictions(text):
    global model_setup, tokenizer, peft_model
    
    if not model_setup:
        model_name = "meta-llama/Meta-Llama-3-8B"
        model_path = "./fine-tuned-llama3"

        tokenizer = AutoTokenizer.from_pretrained(model_path)

        model = AutoModelForSequenceClassification.from_pretrained(
            model_name,
            num_labels=2
        )

        peft_model = PeftModel.from_pretrained(model, model_path)

        model_setup = True

    input = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)

    with torch.no_grad():
        output = peft_model(**input)

    logits = output.logits

    probs = torch.nn.functional.softmax(logits, dim=-1)

    predicted_class = torch.argmax(probs, dim=1).item()

    return predicted_class

def cloud_predictions(text):
    input = {
            "inputs": text,
            "parameters": {}
        }
    
    response = requests.post(API_URL, headers=headers, json=input)
    return response.json()

@app.post("/predict")
def fraud_prediction(message: TextInput):
    try:
        input = message.text

        output = cloud_predictions(input)

        # If the response is a list use cloud predictor, else use local predictor (which took longer process time)
        if isinstance(output, list):
            predicted_class = output[0]['predicted_class']
        else:
            predicted_class = local_predictions(input)

        return {"prediction": predicted_class}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while making the prediction: {str(e)}")

@app.get("/test")
async def test():
    return {"message": "Fraud Detection API is running!"}