import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
    default: null
  },
  notes: {
    type: String,
    default: '' // Future use
  },
  priority: {
    type: Number,
    default: 0 // Future use
  }
}, {
  timestamps: true
});

// Ensure a user can only wishlist a specific product/variant combination once
wishlistSchema.index({ userId: 1, productId: 1, variantId: 1 }, { unique: true });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
export default Wishlist;
