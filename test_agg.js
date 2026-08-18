import mongoose from 'mongoose';
import catalogRepository from './src/repositories/catalogRepository.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/vertexmarket';

async function test() {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB Connected');
  
  try {
    const filters = { search: 'Samsung' };
    console.log('Executing getProducts with search:', filters.search);
    const products = await catalogRepository.getProducts(filters, null, 1, 10);
    console.log('Found Products count:', products.length);
    products.forEach(p => console.log(`- ${p.name}`));
  } catch (error) {
    console.error('Aggregation Error:', error);
  }
  
  mongoose.disconnect();
}

test().catch(console.error);
