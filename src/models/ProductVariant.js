import mongoose from 'mongoose';

const productVariantSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  barcode: {
    type: String,
    trim: true
  },
  variantName: {
    type: String,
    trim: true
  },
  price: {
    type: Number
  },
  salePrice: {
    type: Number
  },
  costPrice: {
    type: Number
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  availableStock: {
    type: Number,
    default: 0
  },
  reservedStock: {
    type: Number,
    default: 0
  },
  soldStock: {
    type: Number,
    default: 0
  },
  returnedStock: {
    type: Number,
    default: 0
  },
  damagedStock: {
    type: Number,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 5
  },
  weight: {
    type: Number
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Draft'],
    default: 'Active'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  images: [{
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // or 'Seller'
  }
}, { timestamps: true });

const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);

export default ProductVariant;
