FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Copy package.json and install Node dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Hugging Face Spaces require the app to listen on port 7860
ENV PORT=7860
EXPOSE 7860

# Start the Node.js Express server
CMD ["npm", "start"]
