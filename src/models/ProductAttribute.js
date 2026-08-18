import mongoose from 'mongoose';

const productAttributeSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
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
      ref: 'AttributeValue'
    },
    customValue: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

const ProductAttribute = mongoose.model('ProductAttribute', productAttributeSchema);

export default ProductAttribute;
