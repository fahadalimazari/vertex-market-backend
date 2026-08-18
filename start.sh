#!/bin/bash

# Start the Python AI microservice in the background
python3 ai_service.py &

# Start the Node.js Express server on port 7860 (Hugging Face standard)
export PORT=7860
npm start
