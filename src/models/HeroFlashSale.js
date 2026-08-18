import mongoose from 'mongoose';

const heroFlashSaleSchema = new mongoose.Schema(
  {
    saleName: {
      type: String,
      required: [true, 'Please provide an internal sale name'],
      trim: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Please select a linked product'],
    },
    badge: {
      type: String,
      default: 'Flash Sale',
      trim: true,
    },
    salePrice: {
      type: Number,
      required: [true, 'Please provide the flash sale price'],
      min: 0,
    },
    originalPrice: {
      type: Number,
      required: [true, 'Please provide the original price'],
      min: 0,
    },
    discountType: {
      type: String,
      enum: ['Percentage', 'Fixed Amount'],
      default: 'Percentage',
    },
    discountValue: {
      type: Number,
      default: 0,
    },
    displayPriority: {
      type: Number,
      default: 1,
    },
    buttonText: {
      type: String,
      default: 'Shop Now',
      trim: true,
    },
    buttonUrl: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    saleStartDate: {
      type: Date,
      required: [true, 'Please provide sale start date'],
    },
    saleEndDate: {
      type: Date,
      required: [true, 'Please provide sale end date'],
    },
    createdBy: {
      type: String,
      default: 'Super Admin',
    },
    updatedBy: {
      type: String,
      default: 'Super Admin',
    },
    // Analytics Metrics
    viewCount: {
      type: Number,
      default: 0,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    ctaClickCount: {
      type: Number,
      default: 0,
    },
    productClickCount: {
      type: Number,
      default: 0,
    },
    conversionCount: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
  }
);

const HeroFlashSale = mongoose.model('HeroFlashSale', heroFlashSaleSchema);
export default HeroFlashSale;
