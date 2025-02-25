# Chat Web Application with Fraud Message Detection

This project is a **fraud detection messaging web application** integrated with a **fine-tuned Llama3 model** to detect fraudulent messages in real-time. The application allows users to communicate seamlessly while providing a layer of security by identifying and flagging potentially harmful or fraudulent content.

## Features

- Real-time chat functionality with multiple users.
- Integration of a fine-tuned Llama3 model to detect fraud messages.
- Alerts or blocks suspicious messages to protect users from fraud.
- Clean and user-friendly interface.
- Deployed backend using FastAPI (or your backend framework) for model inference.

## Table of Contents

- [Installation](#Installation)
  * [Prerequisites](#Prerequisites)
  * [Frontend](#Frontend)
  * [Backend](#Backend)
  * [Setup](#Setup)

## Installation

To run this project locally, follow these steps:

### Prerequisites

- Python 3.8 or later
- Node.js and npm
- Virtual environment (optional but recommended)
- Git
- (Optional) Conda for environment management
- MongoDB

### Frontend [Tailwind CSS, React.js]
### Backend [Python, Node.js, Express.js, MongoDB]

### Setup
#### For ML_MODEL Directory
1. cd ml_model
2. source .env/bin/activate
3. pip install -r requirements.txt
4. uvicorn main:app --reload --port 5000

#### For CLIENT Directory
1. cd client
2. npm run dev

#### For API Directory
1. cd api
2. nodemon index.js

**P/S: Remember to update the MongoDB and JWT_SECRET in "api/.env"

#### Start using the system by clicking the link below
- http://localhost:5173/

However, the fraud message detector model has been deployed in two ways.
1. Local Deployment
   - The prediction will be done using local resource, thus slower in performance
2. Cloud Deployment
   - The model has been deployed in the HuggingFace Inference API site. Thus, the prediction will be faster.
   - In order to use this method, feel free to contact me for running the model (It is expensive to keep it running all the time 😢)
