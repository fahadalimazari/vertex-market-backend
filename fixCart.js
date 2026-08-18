import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/vertexmarket';

async function fixCartIndex() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Drop the problematic index
    await db.collection('carts').dropIndex('user_1');
    console.log('Successfully dropped index: user_1 from carts collection');
    
    process.exit(0);
  } catch (error) {
    if (error.codeName === 'IndexNotFound') {
      console.log('Index user_1 already dropped or not found.');
      process.exit(0);
    }
    console.error('Error dropping index:', error);
    process.exit(1);
  }
}

fixCartIndex();
