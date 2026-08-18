import mongoose from 'mongoose';

const attributeValueSchema = new mongoose.Schema(
  {
    attributeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attribute',
      required: true
    },
    value: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    colorCode: { type: String }, // e.g. #FFFFFF for Color picker
    image: { type: String }, // e.g. thumbnail for variant
    
    sortOrder: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Archived'],
      default: 'Active'
    },
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

const AttributeValue = mongoose.model('AttributeValue', attributeValueSchema);

export default AttributeValue;
