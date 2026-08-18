import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    targetCategory: { type: String },
    targetBrands: [{ type: String }],
    discountType: { type: String, enum: ['Percentage', 'Fixed', 'BOGO'], default: 'Percentage' },
    discountValue: { type: Number, default: 10 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Campaign = mongoose.model('Campaign', campaignSchema);
export default Campaign;
