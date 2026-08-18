import mongoose from 'mongoose';

const specificationSchema = new mongoose.Schema({
  section: { type: String, required: true },
  specs: [
    {
      name: { type: String, required: true },
      value: { type: String, required: true },
    }
  ]
});

const variantSchema = new mongoose.Schema({
  sku: { type: String },
  price: { type: Number },
  stock: { type: Number, default: 0 },
  images: [{ type: String }], // Array of image URLs
  attributes: { type: Map, of: String } // e.g. { "Color": "Red", "Size": "XL" }
}, { strict: false });

const productSchema = new mongoose.Schema(
  {
    // 1. Basic Information
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    productType: { type: String, enum: ['Simple', 'Variable'], default: 'Simple' },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    brand: { type: mongoose.Schema.Types.Mixed },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    category: { type: String, required: true },
    subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' },
    subCategory: { type: String },
    
    sku: { type: String },
    barcode: { type: String },
    modelNumber: { type: String },
    condition: { type: String, enum: ['New', 'Refurbished', 'Used'], default: 'New' },
    manufacturer: { type: String },
    countryOfOrigin: { type: String },
    warranty: { type: String },
    
    shortDescription: { type: String, required: true },
    longDescription: { type: String },
    highlights: [{ type: String }],
    tags: [{ type: String }],
    searchKeywords: [{ type: String }],
    internalNotes: { type: String },

    // 2. Pricing
    costPrice: { type: Number },
    price: { type: Number, required: true },
    oldPrice: { type: Number }, // added for strike-through price
    comparePrice: { type: Number },
    discountType: { type: String, enum: ['Percentage', 'Fixed', 'None'], default: 'None' },
    discountValue: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxClass: { type: String },

    // 3. Inventory
    stock: { type: Number, required: true, default: 0 },
    lowStockAlert: { type: Number, default: 5 },
    reservedStock: { type: Number, default: 0 },
    trackInventory: { type: Boolean, default: true },
    allowBackorders: { type: Boolean, default: false },
    minOrderQty: { type: Number, default: 1 },
    maxOrderQty: { type: Number },

    // 4. Shipping & Delivery
    weight: { type: Number },
    length: { type: Number },
    width: { type: Number },
    height: { type: Number },
    shippingClass: { type: String },
    estimatedDelivery: { type: String },
    shippingFee: { type: Number, default: 0 },
    freeShipping: { type: Boolean, default: false },
    codAvailable: { type: Boolean, default: true },

    // 5. Product Media
    image: { type: String, required: true }, // Featured Image
    gallery: [{ type: String }],
    videos: [{ type: String }],
    manuals: [{ type: String }], // PDFs or docs
    view360: [{ type: String }], // Array of 360 degree images
    
    images: [{
      imageUrl: { type: String, required: true },
      publicId: { type: String },
      filename: { type: String },
      size: { type: Number },
      mimeType: { type: String },
      isPrimary: { type: Boolean, default: false },
      sortOrder: { type: Number, default: 0 },
      uploadedAt: { type: Date, default: Date.now }
    }],
    
    // 6. Variants & Attributes
    variants: [variantSchema],
    specifications: [specificationSchema],
    
    // 7. Status & Visibility
    status: { type: String, enum: ['Draft', 'Pending', 'Approved', 'Rejected', 'Published', 'Active', 'Archived', 'Inactive'], default: 'Pending' },
    isPublished: { type: Boolean, default: false },
    visibility: { type: String, enum: ['Visible', 'Hidden', 'Catalog'], default: 'Visible' },
    
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isFlashSale: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isAiRecommended: { type: Boolean, default: false },
    isDeal: { type: Boolean, default: false },
    
    // 8. Seller / Ownership Information
    source: { type: String, enum: ['ADMIN', 'SELLER'], default: 'ADMIN' },
    createdByRole: { type: String, enum: ['Admin', 'Super Admin', 'Seller'], default: 'Admin' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
    seller: {
      name: String,
      logo: String,
      rating: Number,
      followers: Number,
      responseTime: String,
      official: Boolean
    },
    isOfficialStore: { type: Boolean, default: false },
    rejectionReason: { type: String },
    
    // 9. Extra features
    returnPolicy: { type: String },
    emiAvailable: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    
    coupons: [
      {
        code: String,
        discount: String,
        type: { type: String, enum: ['Seller', 'Marketplace'] }
      }
    ],
    
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String]
    }
  },
  {
    timestamps: true
  }
);

// Update Category product count
productSchema.statics.calculateProductCount = async function(categoryId) {
  if (!categoryId) return;
  const count = await this.countDocuments({ categoryId, status: { $in: ['Published', 'Active'] } });
  await mongoose.model('Category').findByIdAndUpdate(categoryId, { productCount: count });
};

productSchema.post('save', async function(doc) {
  if (doc.categoryId) {
    await doc.constructor.calculateProductCount(doc.categoryId);
  }
});

productSchema.post('findOneAndDelete', async function(doc) {
  if (doc && doc.categoryId) {
    await doc.constructor.calculateProductCount(doc.categoryId);
  }
});

productSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && doc.categoryId) {
    await doc.constructor.calculateProductCount(doc.categoryId);
  }
});

const Product = mongoose.model('Product', productSchema);

export default Product;
