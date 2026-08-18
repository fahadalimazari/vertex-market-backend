import mongoose from 'mongoose';
import Product from './src/models/Product.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/vertexmarket';

async function test() {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB Connected');
  
  const products = await Product.find({ name: /macbook/i });
  console.log('Found Macbook Products:', products.length);
  products.forEach(p => console.log(`- ${p.name} (Slug: ${p.slug})`));
  
  mongoose.disconnect();
}

test().catch(console.error);
