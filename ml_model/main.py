from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from peft import PeftModel
from pydantic import BaseModel
import torch
import requests
from dotenv import load_dotenv
import os
load_dotenv()

API_URL = "https://plfyfec190nchov2.us-east-1.aws.endpoints.huggingface.cloud"

HF_TOKEN=os.getenv("HF_TOKEN")

headers = {
	"Accept" : "application/json",
	"Authorization": HF_TOKEN,
	"Content-Type": "application/json"
}

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # URL of the React app
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# For text string format
class TextInput(BaseModel):
    text: str

# For local model setup
tokenizer = None
peft_model = None
model_setup = False

# Local Prediction Function
def local_predictions(text):
    global model_setup, tokenizer, peft_model
    
    # Setup model once
    if not model_setup:
        model_name = "meta-llama/Meta-Llama-3-8B"
        model_path = "./fine-tuned-llama3"

        # Get tokenizer
        tokenizer = AutoTokenizer.from_pretrained(model_path)

        # Get LLaMA3 Model
        model = AutoModelForSequenceClassification.from_pretrained(
            model_name,
            num_labels=2
        )

        # Load PEFT Configuration
        peft_model = PeftModel.from_pretrained(model, model_path)

        # Set model setup to True
        model_setup = True

    # Tokenization
    input = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)

    # Model prediction
    with torch.no_grad():
        output = peft_model(**input)

    # Get model output logits
    logits = output.logits

    # Get probabilities from logits
    probs = torch.nn.functional.softmax(logits, dim=-1)

    # Get the predicted class index
    predicted_class = torch.argmax(probs, dim=1).item()

    return predicted_class


# For cloud model setup
def cloud_predictions(text):
    input = {
            "inputs": text,
            "parameters": {}
        }
    
    # Make prediction request to the API
    response = requests.post(API_URL, headers=headers, json=input)
    return response.json()

# Model Predict API for system
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