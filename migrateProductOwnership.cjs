const mongoose = require('mongoose');
const mongoURI = 'mongodb://127.0.0.1:27017/vertexmarket';

const productSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
  source: { type: String },
  createdByRole: { type: String },
}, { strict: false });

const Product = mongoose.model('Product', productSchema);

(async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to DB. Starting migration...');

    const products = await Product.find({});
    
    let adminCount = 0;
    let sellerCount = 0;

    for (const p of products) {
      let updated = false;
      if (p.sellerId) {
        if (p.source !== 'SELLER') {
          p.source = 'SELLER';
          p.createdByRole = 'Seller';
          updated = true;
          sellerCount++;
        }
      } else {
        if (p.source !== 'ADMIN') {
          p.source = 'ADMIN';
          p.createdByRole = 'Admin';
          updated = true;
          adminCount++;
        }
      }
      
      if (updated) {
        await p.save();
      }
    }
    
    console.log(`Migration completed successfully! Updated ${adminCount} Admin products and ${sellerCount} Seller products.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
