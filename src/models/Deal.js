import mongoose from 'mongoose';

const dealSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    banner: { type: String },
    discountBadge: { type: String, default: 'Up to 50% OFF' },
    limitedStock: { type: Number, default: 50 },
    couponCode: { type: String, default: 'VERTEX50' },
    freeShipping: { type: Boolean, default: true },
    isFlashSale: { type: Boolean, default: false },
    countdownEndTime: { type: Date, default: () => new Date(Date.now() + 72 * 3600 * 1000) }, // 3 days ahead by default
    dealProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    status: { type: String, enum: ['Active', 'Scheduled', 'Expired'], default: 'Active' }
  },
  { timestamps: true }
);

const Deal = mongoose.model('Deal', dealSchema);
export default Deal;
