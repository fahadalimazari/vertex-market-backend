import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: {
      type: String,
      enum: ['General', 'Shipping', 'Payments', 'Returns & Refunds', 'Seller Onboarding', 'Warranty'],
      default: 'General',
    },
    displayOrder: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Active', 'Draft', 'Disabled'],
      default: 'Active',
    },
    helpfulVotes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const FAQ = mongoose.model('FAQ', faqSchema);
export default FAQ;
