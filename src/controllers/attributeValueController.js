import asyncHandler from 'express-async-handler';
import AttributeValue from '../models/AttributeValue.js';
import Attribute from '../models/Attribute.js';

// @desc    Create a new attribute value
// @route   POST /api/v1/attribute-values
export const createAttributeValue = asyncHandler(async (req, res) => {
  const { attributeId, value, label } = req.body;

  // Validate Attribute
  const attribute = await Attribute.findById(attributeId);
  if (!attribute || attribute.isDeleted) {
    res.status(404);
    throw new Error('Valid Attribute not found');
  }

  // Prevent duplicate values under same attribute
  const duplicateValue = await AttributeValue.findOne({ attributeId, value, isDeleted: false });
  if (duplicateValue) {
    res.status(400);
    throw new Error('This value already exists for this Attribute');
  }

  const attributeValue = await AttributeValue.create({
    ...req.body,
    createdBy: req.user ? req.user._id : null
  });

  res.status(201).json(attributeValue);
});

// @desc    Update an attribute value
// @route   PUT /api/v1/attribute-values/:id
export const updateAttributeValue = asyncHandler(async (req, res) => {
  const attributeValue = await AttributeValue.findById(req.params.id);

  if (!attributeValue) {
    res.status(404);
    throw new Error('Attribute Value not found');
  }

  if (req.body.value && req.body.value !== attributeValue.value) {
      const duplicateValue = await AttributeValue.findOne({ attributeId: attributeValue.attributeId, value: req.body.value, isDeleted: false });
      if (duplicateValue && String(duplicateValue._id) !== String(attributeValue._id)) {
        res.status(400);
        throw new Error('This value already exists for this Attribute');
      }
      attributeValue.value = req.body.value;
  }

  const allowedUpdates = [
    'label', 'colorCode', 'image', 'sortOrder', 'isDefault', 'status'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      attributeValue[field] = req.body[field];
    }
  });

  const updatedValue = await attributeValue.save();
  res.json(updatedValue);
});

// @desc    Delete attribute value (Soft)
// @route   DELETE /api/v1/attribute-values/:id
export const deleteAttributeValue = asyncHandler(async (req, res) => {
  const attributeValue = await AttributeValue.findById(req.params.id);

  if (!attributeValue) {
    res.status(404);
    throw new Error('Attribute Value not found');
  }

  attributeValue.isDeleted = true;
  await attributeValue.save();

  res.json({ message: 'Attribute Value removed (soft delete)' });
});

// @desc    Get all attribute values
// @route   GET /api/v1/attribute-values
export const getAttributeValues = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSize) || 10;
  const page = Number(req.query.pageNumber) || 1;
  const keyword = req.query.keyword
    ? { label: { $regex: req.query.keyword, $options: 'i' } }
    : {};

  const query = { ...keyword, isDeleted: false };
  
  if (req.query.attributeId) {
      query.attributeId = req.query.attributeId;
  }

  const count = await AttributeValue.countDocuments(query);
  const attributeValues = await AttributeValue.find(query)
    .populate('attributeId', 'name code')
    .sort({ attributeId: 1, sortOrder: 1, createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ attributeValues, page, pages: Math.ceil(count / pageSize), count });
});

// @desc    Get active attribute values
// @route   GET /api/v1/attribute-values/active
export const getActiveAttributeValues = asyncHandler(async (req, res) => {
  const query = { status: 'Active', isDeleted: false };
  if (req.query.attributeId) {
      query.attributeId = req.query.attributeId;
  }
  
  const attributeValues = await AttributeValue.find(query)
    .sort({ sortOrder: 1 });
  
  res.json(attributeValues);
});

// @desc    Get active attribute values by Attribute ID
// @route   GET /api/v1/attribute-values/attribute/:attributeId
export const getAttributeValuesByAttribute = asyncHandler(async (req, res) => {
  const attributeValues = await AttributeValue.find({ 
    attributeId: req.params.attributeId, 
    status: 'Active', 
    isDeleted: false 
  }).sort({ sortOrder: 1 });
  
  res.json(attributeValues);
});

// @desc    Get attribute value by ID
// @route   GET /api/v1/attribute-values/:id
export const getAttributeValueById = asyncHandler(async (req, res) => {
  const attributeValue = await AttributeValue.findOne({ _id: req.params.id, isDeleted: false })
    .populate('attributeId', 'name code');

  if (attributeValue) {
    res.json(attributeValue);
  } else {
    res.status(404);
    throw new Error('Attribute Value not found');
  }
});
