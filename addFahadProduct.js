import mongoose from 'mongoose';
import Product from './src/models/Product.js';
import Seller from './src/models/Seller.js';
import Category from './src/models/Category.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/vertexmarket';

async function addTestProduct() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // We will just bypass seller check
    const mockSellerId = new mongoose.Types.ObjectId();

    // Bypass category check
    const mockCategoryId = new mongoose.Types.ObjectId();
    const mockCategoryName = 'Electronics';

    // Create a product
    const productData = {
      name: 'Fahad Super Watch',
      slug: `fahad-super-watch-${Date.now()}`,
      productType: 'Simple',
      categoryId: mockCategoryId,
      category: mockCategoryName,
      shortDescription: 'This is a premium test product named Fahad to check how the card looks on the frontend.',
      price: 2500,
      oldPrice: 3000,
      discount: 16,
      stock: 50,
      lowStockAlert: 5,
      freeShipping: true,
      isNewArrival: true,
      status: 'Approved',
      isPublished: true,
      image: 'https://images.unsplash.com/photo-1542496658-e33a6fa465b8?q=80&w=600&auto=format&fit=crop', // nice watch
      sellerId: mockSellerId,
      seller: {
        name: 'Fahad Electronics',
        logo: '',
      }
    };

    const newProduct = await Product.create(productData);
    console.log('Successfully created test product:', newProduct.name);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating product:', error);
    process.exit(1);
  }
}

addTestProduct();
