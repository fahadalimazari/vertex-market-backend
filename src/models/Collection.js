import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String },
    banner: { type: String },
    description: { type: String },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    featured: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Archived'],
      default: 'Active'
    },
    sortOrder: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

const Collection = mongoose.model('Collection', collectionSchema);

export default Collection;
