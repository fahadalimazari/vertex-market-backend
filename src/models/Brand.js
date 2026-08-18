import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    logo: {
      type: String
    },
    banner: {
      type: String
    },
    description: {
      type: String
    },
    brandStory: {
      type: String
    },
    officialWarranty: {
      type: String,
      default: '1 Year Official Brand Warranty & Guaranteed Genuine Product'
    },
    customerRating: {
      type: Number,
      default: 4.8
    },
    featured: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
    verified: {
      type: Boolean,
      default: false
    },
    verificationStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Suspended'],
      default: 'Pending'
    },
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    website: {
      type: String
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

const Brand = mongoose.model('Brand', brandSchema);

export default Brand;
