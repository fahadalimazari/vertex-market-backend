import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  country: { type: String, required: true },
  countryCode: { type: String, default: '' },
  province: { type: String, required: true }, // State/Province
  stateCode: { type: String, default: '' },
  city: { type: String, required: true },
  cityCode: { type: String, default: '' },
  postalCode: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: '' },
  landmark: { type: String, default: '' },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  addressType: { 
    type: String, 
    enum: ['Home', 'Office', 'Other'],
    default: 'Home' 
  },
  deliveryInstructions: { type: String, default: '' },
  isDefault: { type: Boolean, default: false }
}, {
  timestamps: true
});

const Address = mongoose.model('Address', addressSchema);
export default Address;
