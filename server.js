import dotenv from 'dotenv';
import serverless from 'serverless-http';
import connectDB from './src/config/db.js';
import app from './src/app.js';

dotenv.config();

const fetchHandler = serverless(app);
let isDBConnected = false;

export default {
  async fetch(request, env, ctx) {
    if (!isDBConnected) {
      // In Cloudflare Workers, env variables are passed in the `env` object
      // We pass the URI explicitly if available, otherwise it falls back to process.env
      await connectDB(env.MONGO_URI);
      isDBConnected = true;
    }
    return fetchHandler(request, ctx);
  }
};