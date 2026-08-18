import mongoose from 'mongoose';

const fixBrands = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/vertexmarket');
    console.log('Connected to DB');

    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    const brandsCollection = db.collection('brands');

    // Find products where brand is a string
    const products = await productsCollection.find({ brand: { $type: "string" } }).toArray();
    console.log(`Found ${products.length} products with string brands`);

    for (let p of products) {
      if (p.brand) {
        // Try to find a matching brand in brands collection
        let brandDoc = await brandsCollection.findOne({ name: p.brand });
        if (!brandDoc) {
          // Create the brand
          const res = await brandsCollection.insertOne({
            name: p.brand,
            slug: p.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            createdAt: new Date(),
            updatedAt: new Date()
          });
          brandDoc = { _id: res.insertedId };
          console.log(`Created new brand: ${p.brand}`);
        }
        
        // Update product with ObjectId
        await productsCollection.updateOne(
          { _id: p._id },
          { $set: { brand: brandDoc._id } }
        );
        console.log(`Updated product ${p.name} with brand ObjectId`);
      } else {
        // Unset if empty string
        await productsCollection.updateOne(
          { _id: p._id },
          { $unset: { brand: "" } }
        );
      }
    }

    console.log('Done fixing brands');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixBrands();
