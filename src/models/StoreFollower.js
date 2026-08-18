import mongoose from 'mongoose';

const storeFollowerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only follow a store once
storeFollowerSchema.index({ user: 1, store: 1 }, { unique: true });

const StoreFollower = mongoose.model('StoreFollower', storeFollowerSchema);

export default StoreFollower;
