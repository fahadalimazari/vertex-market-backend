import mongoose from 'mongoose';
import Product from './src/models/Product.js';
import Brand from './src/models/Brand.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/vertexmarket';

async function test() {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB Connected');
  
  const products = await Product.find({ name: /Samsung/i }).populate('brand');
  console.log('Found Samsung Products:', products.length);
  products.forEach(p => console.log(`- ${p.name} (Brand: ${p.brand ? p.brand.name : 'None'})`));
  
  const allProducts = await Product.countDocuments();
  console.log('Total Products in DB:', allProducts);
  
  mongoose.disconnect();
}

test().catch(console.error);
