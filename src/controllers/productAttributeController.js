import asyncHandler from 'express-async-handler';
import ProductAttribute from '../models/ProductAttribute.js';
import Product from '../models/Product.js';

// @desc    Save Product Attributes
// @route   POST /api/v1/product-attributes/bulk
export const saveProductAttributes = asyncHandler(async (req, res) => {
  const { productId, attributes } = req.body;
  
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  // Clear existing to overwrite
  await ProductAttribute.deleteMany({ productId });
  
  const formattedAttributes = attributes.map(attr => ({
    productId,
    attributeId: attr.attributeId,
    attributeValueId: attr.attributeValueId || null,
    customValue: attr.customValue || null
  }));
  
  const result = await ProductAttribute.insertMany(formattedAttributes);
  
  res.status(201).json(result);
});
