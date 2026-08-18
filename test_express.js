import express from 'express';
import catalogRoutes from './src/routes/catalogRoutes.js';
import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/vertexmarket';

async function test() {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB Connected');
  
  const app = express();
  app.use('/api/v1/catalog', catalogRoutes);
  
  const server = app.listen(5001, () => {
    console.log('Server running on 5001');
  });
}

test().catch(console.error);
