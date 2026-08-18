import mongoose from 'mongoose';

const variantAttributeSchema = new mongoose.Schema({
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
    required: true,
    index: true
  },
  attributeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attribute',
    required: true
  },
  attributeValueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AttributeValue',
    required: true
  }
}, { timestamps: true });

// Prevent duplicate attribute values for the same variant
variantAttributeSchema.index({ variantId: 1, attributeId: 1 }, { unique: true });

const VariantAttribute = mongoose.model('VariantAttribute', variantAttributeSchema);

export default VariantAttribute;
