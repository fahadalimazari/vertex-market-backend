import mongoose from 'mongoose';

const currencySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true }, // e.g. 'USD', 'PKR', 'EUR'
    name: { type: String, required: true }, // e.g. 'US Dollar', 'Pakistani Rupee'
    symbol: { type: String, required: true }, // e.g. '$', '₨', '€'
    exchangeRate: { type: Number, required: true, default: 1.0 }, // Rate relative to USD (1 USD = X Currency)
    isDefault: { type: Boolean, default: false },
    isEnabled: { type: Boolean, default: true },
    roundingRule: { type: Number, default: 2 }, // Decimal digits (0 for PKR/JPY, 2 for USD/EUR)
    autoFetchRates: { type: Boolean, default: true },
    manualOverrideRate: { type: Number, default: null },
    symbolPosition: { type: String, enum: ['before', 'after'], default: 'before' },
  },
  { timestamps: true }
);

const Currency = mongoose.model('Currency', currencySchema);
export default Currency;
