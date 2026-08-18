import mongoose from 'mongoose';

const bundleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    description: {
      type: String
    },
    image: {
      type: String
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Scheduled', 'Expired', 'Paused'],
      default: 'Draft'
    },
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    }],
    discountPercentage: {
      type: Number,
      default: 0
    },
    fixedPrice: {
      type: Number
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const Bundle = mongoose.model('Bundle', bundleSchema);

export default Bundle;
