const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/vertex-market';

const ProductSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
const SellerSchema = new mongoose.Schema({}, { strict: false, collection: 'sellers' });

const Product = mongoose.model('Product', ProductSchema);
const Seller = mongoose.model('Seller', SellerSchema);

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const products = await Product.find({ source: 'SELLER', sellerId: { $ne: null } });
    console.log(`Found ${products.length} SELLER products.`);

    let updatedCount = 0;

    for (const product of products) {
      const seller = await Seller.findById(product.get('sellerId'));
      
      if (seller) {
        const productSeller = product.get('seller') || {};
        const update = {
          $set: {
            'seller._id': seller._id,
            'seller.slug': seller.get('storeSlug'),
            'seller.name': seller.get('storeName') || seller.get('businessName'),
            'seller.logo': seller.get('storeLogo') || productSeller.logo
          }
        };
        
        await Product.updateOne({ _id: product._id }, update);
        updatedCount++;
        console.log(`Updated product ${product._id} with seller slug ${seller.get('storeSlug')}`);
      }
    }

    console.log(`Migration completed. Updated ${updatedCount} products.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
