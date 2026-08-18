import mongoose from 'mongoose';

const heroBannerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide an internal banner name'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    badge: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    primaryButtonText: {
      type: String,
      default: 'Shop Now',
      trim: true,
    },
    primaryButtonUrl: {
      type: String,
      default: '/products',
      trim: true,
    },
    secondaryButtonText: {
      type: String,
      default: 'Explore Deals',
      trim: true,
    },
    secondaryButtonUrl: {
      type: String,
      default: '/products?filter=flash-sale',
      trim: true,
    },
    desktopImage: {
      type: String,
      required: [true, 'Please provide a desktop image URL'],
    },
    mobileImage: {
      type: String,
      default: '',
    },
    tabletImage: {
      type: String,
      default: '',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    autoRotate: {
      type: Boolean,
      default: true,
    },
    openInNewTab: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    altText: {
      type: String,
      default: '',
    },
    imageTitle: {
      type: String,
      default: '',
    },
    createdBy: {
      type: String,
      default: 'Admin',
    },
    updatedBy: {
      type: String,
      default: 'Admin',
    },
  },
  {
    timestamps: true,
    collection: 'HeroBanners',
  }
);

const HeroBanner = mongoose.model('HeroBanner', heroBannerSchema);

export default HeroBanner;
