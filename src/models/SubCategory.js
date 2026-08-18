import mongoose from 'mongoose';

const subCategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    image: { type: String },
    icon: { type: String },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Archived'],
      default: 'Active'
    },
    displayOrder: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

const SubCategory = mongoose.model('SubCategory', subCategorySchema);

export default SubCategory;
