import mongoose from 'mongoose';

const cmsPageSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: { type: String, required: true },
    category: { type: String, default: 'Legal' },
    content: { type: String, required: true },
    seoTitle: { type: String },
    metaDescription: { type: String },
    lastUpdatedBy: { type: String, default: 'Super Admin' },
    status: {
      type: String,
      enum: ['Published', 'Draft', 'Archived'],
      default: 'Published',
    },
  },
  { timestamps: true }
);

const CMSPage = mongoose.model('CMSPage', cmsPageSchema);
export default CMSPage;
