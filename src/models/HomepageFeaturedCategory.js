import mongoose from 'mongoose';

const homepageFeaturedCategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    customImage: { type: String },
    displayOrder: { type: Number, default: 0 },
    featured: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
    startDate: { type: Date },
    endDate: { type: Date }
  },
  {
    timestamps: true
  }
);

const HomepageFeaturedCategory = mongoose.model(
  'HomepageFeaturedCategory',
  homepageFeaturedCategorySchema
);

export default HomepageFeaturedCategory;
