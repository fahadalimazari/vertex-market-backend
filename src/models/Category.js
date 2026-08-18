import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    shortDescription: { type: String },
    image: { type: String },
    bannerImage: { type: String },
    mobileBanner: { type: String },
    icon: { type: String, default: 'FiGrid' },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Archived'],
      default: 'Active'
    },
    isActive: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },
    productCount: { type: Number, default: 0 },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    level: { type: Number, default: 0 },
    path: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Mega Menu specific embedded lists & promotional banner
    subCategories: [{ type: mongoose.Schema.Types.Mixed }],
    brands: [{ type: mongoose.Schema.Types.Mixed }],
    featuredProducts: [{ type: mongoose.Schema.Types.Mixed }],
    banner: {
      title: { type: String },
      link: { type: String },
      image: { type: String }
    },
    // SEO Metadata
    seoTitle: { type: String },
    seoDescription: { type: String },
    seoKeywords: [{ type: String }]
  },
  {
    timestamps: true
  }
);

const Category = mongoose.model('Category', categorySchema);

export default Category;
