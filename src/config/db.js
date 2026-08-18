import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (envMongoUri = null) => {
  try {
    const uri = envMongoUri || process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    const conn = await mongoose.connect(uri, {
      bufferCommands: false,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Do not use process.exit(1) in Cloudflare Workers or serverless environments
    throw error;
  }
};

export default connectDB;
