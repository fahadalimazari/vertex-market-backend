import mongoose from 'mongoose';

const shippingProviderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g., 'TCS Express', 'DHL Global', 'Leopards Courier', 'FedEx'
    code: { type: String, required: true },
    trackingUrlTemplate: { type: String }, // e.g., 'https://www.tcsexpress.com/tracking?no={tracking_number}'
    contactPhone: { type: String },
    estimatedDeliveryDays: { type: String, default: '2 - 4 Business Days' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

const ShippingProvider = mongoose.model('ShippingProvider', shippingProviderSchema);
export default ShippingProvider;
