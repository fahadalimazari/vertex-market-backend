import mongoose from 'mongoose';

const analyticsLogSchema = new mongoose.Schema(
  {
    event: { 
      type: String, 
      required: true,
      enum: ['CATEGORY_CLICK', 'BRAND_CLICK', 'PRODUCT_VIEW', 'SEARCH_KEYWORD', 'FILTER_USED', 'PAGE_VISIT']
    },
    target: { type: String, required: true }, // e.g., category slug, brand name, or keyword
    count: { type: Number, default: 1 },
    meta: { type: mongoose.Schema.Types.Mixed },
    date: { type: String, default: () => new Date().toISOString().slice(0, 10) } // YYYY-MM-DD
  },
  { timestamps: true }
);

const AnalyticsLog = mongoose.model('AnalyticsLog', analyticsLogSchema);
export default AnalyticsLog;
