FROM node:18-bullseye

# Install Python and pip
RUN apt-get update && apt-get install -y python3 python3-pip

# Set working directory
WORKDIR /app

# Copy package.json and install Node dependencies
COPY package*.json ./
RUN npm install

# Install Python dependencies (FastAPI, Uvicorn, Pydantic)
RUN pip3 install fastapi uvicorn pydantic

# Copy the rest of the application code
COPY . .

# Expose Hugging Face Space port
EXPOSE 7860

# Add execution permission to start script
RUN chmod +x start.sh

# Start both Node.js and Python servers
CMD ["./start.sh"]
