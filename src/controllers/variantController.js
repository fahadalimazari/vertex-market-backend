import asyncHandler from 'express-async-handler';
import ProductVariant from '../models/ProductVariant.js';
import VariantAttribute from '../models/VariantAttribute.js';
import Product from '../models/Product.js';
import Attribute from '../models/Attribute.js';
import AttributeValue from '../models/AttributeValue.js';

// @desc    Get variants by product ID
// @route   GET /api/v1/products/:productId/variants
// @access  Public
export const getProductVariants = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const variants = await ProductVariant.find({ productId }).lean();

  if (!variants || variants.length === 0) {
    return res.json({ success: true, data: [] });
  }

  // Fetch attribute mappings for each variant
  const variantIds = variants.map(v => v._id);
  const variantAttributes = await VariantAttribute.find({ variantId: { $in: variantIds } })
    .populate('attributeId', 'name code')
    .populate('attributeValueId', 'value label colorCode')
    .lean();

  // Combine variants with their attributes
  const mappedVariants = variants.map(variant => {
    const attributes = variantAttributes.filter(va => va.variantId.toString() === variant._id.toString());
    const options = {};
    attributes.forEach(attr => {
      if (attr.attributeId && attr.attributeValueId) {
        options[attr.attributeId.name] = attr.attributeValueId.label || attr.attributeValueId.value;
      }
    });
    return {
      ...variant,
      options
    };
  });

  res.json({ success: true, data: mappedVariants });
});

// @desc    Get single variant
// @route   GET /api/v1/variants/:id
// @access  Public
export const getVariantById = asyncHandler(async (req, res) => {
  const variant = await ProductVariant.findById(req.params.id).lean();
  if (!variant) {
    res.status(404);
    throw new Error('Variant not found');
  }

  const attributes = await VariantAttribute.find({ variantId: variant._id })
    .populate('attributeId', 'name code')
    .populate('attributeValueId', 'value label colorCode')
    .lean();

  res.json({ success: true, data: { ...variant, attributes } });
});

// @desc    Create a variant
// @route   POST /api/v1/variants
// @access  Private/Admin/Seller
export const createVariant = asyncHandler(async (req, res) => {
  const { attributes, ...variantData } = req.body;
  
  // Check SKU uniqueness
  const existingSku = await ProductVariant.findOne({ sku: variantData.sku });
  if (existingSku) {
    res.status(400);
    throw new Error('SKU must be unique');
  }

  const variant = await ProductVariant.create(variantData);

  // Create attribute mappings
  if (attributes && attributes.length > 0) {
    const mappings = attributes.map(attr => ({
      variantId: variant._id,
      attributeId: attr.attributeId,
      attributeValueId: attr.attributeValueId
    }));
    await VariantAttribute.insertMany(mappings);
  }

  res.status(201).json({ success: true, data: variant });
});

// @desc    Update a variant
// @route   PUT /api/v1/variants/:id
// @access  Private/Admin/Seller
export const updateVariant = asyncHandler(async (req, res) => {
  const { attributes, ...variantData } = req.body;
  const variant = await ProductVariant.findById(req.params.id);

  if (!variant) {
    res.status(404);
    throw new Error('Variant not found');
  }

  if (variantData.sku && variantData.sku !== variant.sku) {
    const existingSku = await ProductVariant.findOne({ sku: variantData.sku });
    if (existingSku) {
      res.status(400);
      throw new Error('SKU must be unique');
    }
  }

  Object.assign(variant, variantData);
  await variant.save();

  // If attributes are provided, update mappings
  if (attributes) {
    await VariantAttribute.deleteMany({ variantId: variant._id });
    if (attributes.length > 0) {
      const mappings = attributes.map(attr => ({
        variantId: variant._id,
        attributeId: attr.attributeId,
        attributeValueId: attr.attributeValueId
      }));
      await VariantAttribute.insertMany(mappings);
    }
  }

  res.json({ success: true, data: variant });
});

// @desc    Delete a variant
// @route   DELETE /api/v1/variants/:id
// @access  Private/Admin/Seller
export const deleteVariant = asyncHandler(async (req, res) => {
  const variant = await ProductVariant.findById(req.params.id);

  if (!variant) {
    res.status(404);
    throw new Error('Variant not found');
  }

  // Check if it's default
  if (variant.isDefault) {
    // Attempt to make another variant default
    const anotherVariant = await ProductVariant.findOne({ productId: variant.productId, _id: { $ne: variant._id } });
    if (anotherVariant) {
      anotherVariant.isDefault = true;
      await anotherVariant.save();
    }
  }

  await VariantAttribute.deleteMany({ variantId: variant._id });
  await variant.deleteOne();

  res.json({ success: true, message: 'Variant deleted' });
});

// @desc    Generate variants automatically
// @route   POST /api/v1/variants/generate
// @access  Private/Admin/Seller
export const generateVariants = asyncHandler(async (req, res) => {
  const { productId, attributesList, basePrice, baseSku } = req.body;
  // attributesList format: [{ attributeId: '...', values: ['valId1', 'valId2'] }, ...]

  if (!attributesList || attributesList.length === 0) {
    res.status(400);
    throw new Error('No attributes provided');
  }

  // Build Cartesian Product
  const generateCartesian = (arr) => {
    return arr.reduce((a, b) => {
      return a.map(x => b.map(y => x.concat([y]))).reduce((c, d) => c.concat(d), []);
    }, [[]]);
  };

  const arraysToCombine = attributesList.map(attr => 
    attr.values.map(valId => ({ attributeId: attr.attributeId, attributeValueId: valId }))
  );

  const combinations = generateCartesian(arraysToCombine);

  // Fetch names for SKU generation
  const allValueIds = attributesList.flatMap(attr => attr.values);
  const valuesData = await AttributeValue.find({ _id: { $in: allValueIds } }).lean();
  const valueMap = {};
  valuesData.forEach(v => { valueMap[v._id.toString()] = v.value || v.label; });

  const generated = combinations.map((combo, index) => {
    // Generate SKU suffix
    const skuSuffix = combo.map(c => {
      const val = valueMap[c.attributeValueId] || '';
      return val.substring(0, 3).toUpperCase();
    }).join('-');

    return {
      sku: `${baseSku}-${skuSuffix}-${index + 1}`,
      price: basePrice || 0,
      stock: 0,
      attributes: combo
    };
  });

  res.json({ success: true, data: generated });
});

// @desc    Update variant stock
// @route   PATCH /api/v1/variants/stock/:id
// @access  Private/Admin/Seller
export const updateVariantStock = asyncHandler(async (req, res) => {
  const { stock } = req.body;
  const variant = await ProductVariant.findById(req.params.id);
  if (!variant) {
    res.status(404);
    throw new Error('Variant not found');
  }
  variant.stock = stock;
  variant.availableStock = stock;
  await variant.save();
  res.json({ success: true, data: variant });
});

// @desc    Update variant status
// @route   PATCH /api/v1/variants/status/:id
// @access  Private/Admin/Seller
export const updateVariantStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const variant = await ProductVariant.findById(req.params.id);
  if (!variant) {
    res.status(404);
    throw new Error('Variant not found');
  }
  variant.status = status;
  await variant.save();
  res.json({ success: true, data: variant });
});

// @desc    Bulk Update Variants
// @route   PATCH /api/v1/variants/bulk-update
// @access  Private/Admin/Seller
export const bulkUpdateVariants = asyncHandler(async (req, res) => {
  const { updates } = req.body;
  // updates: [{ id: '...', price: 100, stock: 10 }]
  
  if (!updates || !Array.isArray(updates)) {
    res.status(400);
    throw new Error('Invalid updates format');
  }

  const bulkOps = updates.map(u => {
    const setQuery = {};
    if (u.price !== undefined) setQuery.price = u.price;
    if (u.stock !== undefined) {
      setQuery.stock = u.stock;
      setQuery.availableStock = u.stock;
    }
    if (u.status !== undefined) setQuery.status = u.status;
    if (u.salePrice !== undefined) setQuery.salePrice = u.salePrice;

    return {
      updateOne: {
        filter: { _id: u.id },
        update: { $set: setQuery }
      }
    };
  });

  if (bulkOps.length > 0) {
    await ProductVariant.bulkWrite(bulkOps);
  }

  res.json({ success: true, message: `Bulk updated ${bulkOps.length} variants` });
});

// @desc    Duplicate Variant
// @route   POST /api/v1/variants/duplicate
// @access  Private/Admin/Seller
export const duplicateVariant = asyncHandler(async (req, res) => {
  const { variantId, newSku } = req.body;

  const original = await ProductVariant.findById(variantId).lean();
  if (!original) {
    res.status(404);
    throw new Error('Variant not found');
  }

  delete original._id;
  delete original.createdAt;
  delete original.updatedAt;
  original.sku = newSku || `${original.sku}-COPY`;
  original.isDefault = false; // duplicated variant should not steal default

  const duplicate = await ProductVariant.create(original);

  const attributes = await VariantAttribute.find({ variantId }).lean();
  if (attributes.length > 0) {
    const newMappings = attributes.map(a => ({
      variantId: duplicate._id,
      attributeId: a.attributeId,
      attributeValueId: a.attributeValueId
    }));
    await VariantAttribute.insertMany(newMappings);
  }

  res.status(201).json({ success: true, data: duplicate });
});

// @desc    Get Variant Options (for PDP)
// @route   GET /api/v1/products/:productId/variant-options
// @access  Public
export const getVariantOptions = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // Find all active variants for the product
  const variants = await ProductVariant.find({ productId, status: 'Active' }).lean();
  if (!variants || variants.length === 0) {
    return res.json({ success: true, data: null });
  }

  const variantIds = variants.map(v => v._id);
  const variantAttributes = await VariantAttribute.find({ variantId: { $in: variantIds } })
    .populate('attributeId', 'name code')
    .populate('attributeValueId', 'value label colorCode')
    .lean();

  // Map to options format for UI: { Color: ['Black', 'Blue'], Storage: ['128GB', '256GB'] }
  const optionsMap = {};
  
  variantAttributes.forEach(attr => {
    if (attr.attributeId && attr.attributeValueId) {
      const groupName = attr.attributeId.name;
      const optionValue = attr.attributeValueId.label || attr.attributeValueId.value;
      
      if (!optionsMap[groupName]) {
        optionsMap[groupName] = new Set();
      }
      optionsMap[groupName].add(optionValue);
    }
  });

  const formattedOptions = Object.keys(optionsMap).map(key => ({
    type: key,
    options: Array.from(optionsMap[key])
  }));

  res.json({ success: true, data: formattedOptions });
});
