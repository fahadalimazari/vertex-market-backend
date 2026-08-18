import mongoose from 'mongoose';

const attributeSchema = new mongoose.Schema(
  {
    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
      required: true
    },
    attributeGroup: { type: String, default: 'General' },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    
    // Future Conditional Logic Architecture
    parentAttributeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attribute' },
    conditionValue: { type: String },
    
    // Future Variant Compatibility
    usedForVariant: { type: Boolean, default: false },

    dataType: {
      type: String,
      enum: ['Text', 'Textarea', 'Number', 'Decimal', 'Boolean', 'Date', 'Color', 'URL', 'Email', 'JSON'],
      default: 'Text'
    },
    inputType: {
      type: String,
      enum: ['Text Field', 'Textarea', 'Dropdown', 'Radio', 'Checkbox', 'Toggle', 'Number Input', 'Color Picker', 'Date Picker', 'Multi Select'],
      default: 'Text Field'
    },
    
    // Flags
    required: { type: Boolean, default: false },
    searchable: { type: Boolean, default: false },
    filterable: { type: Boolean, default: false },
    comparable: { type: Boolean, default: false },
    visibleOnProduct: { type: Boolean, default: true },
    sellerEditable: { type: Boolean, default: true },
    adminOnly: { type: Boolean, default: false },
    showOnCard: { type: Boolean, default: false },
    
    // Display metadata
    placeholder: { type: String },
    helpText: { type: String },
    defaultValue: { type: mongoose.Schema.Types.Mixed },
    
    // Validation Object
    validation: {
      minLength: { type: Number },
      maxLength: { type: Number },
      minValue: { type: Number },
      maxValue: { type: Number },
      regex: { type: String }
    },

    sortOrder: { type: Number, default: 0 },
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

const Attribute = mongoose.model('Attribute', attributeSchema);

export default Attribute;
