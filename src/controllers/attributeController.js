import asyncHandler from 'express-async-handler';
import Attribute from '../models/Attribute.js';
import SubCategory from '../models/SubCategory.js';

// @desc    Create a new attribute
// @route   POST /api/v1/attributes
export const createAttribute = asyncHandler(async (req, res) => {
  const { subCategoryId, name, code } = req.body;

  // Validate Sub Category
  const subCategory = await SubCategory.findById(subCategoryId);
  if (!subCategory || subCategory.isDeleted) {
    res.status(404);
    throw new Error('Valid Sub Category not found');
  }

  // Prevent duplicate names under same subcategory
  const duplicateName = await Attribute.findOne({ subCategoryId, name, isDeleted: false });
  if (duplicateName) {
    res.status(400);
    throw new Error('Attribute name already exists under this Sub Category');
  }

  // Ensure code uniqueness globally
  const codeExists = await Attribute.findOne({ code });
  if (codeExists) {
    res.status(400);
    throw new Error('Attribute code already exists in the marketplace');
  }

  const attribute = await Attribute.create({
    ...req.body,
    createdBy: req.user ? req.user._id : null
  });

  res.status(201).json(attribute);
});

// @desc    Update an attribute
// @route   PUT /api/v1/attributes/:id
export const updateAttribute = asyncHandler(async (req, res) => {
  const attribute = await Attribute.findById(req.params.id);

  if (!attribute) {
    res.status(404);
    throw new Error('Attribute not found');
  }

  if (req.body.name && req.body.name !== attribute.name) {
      const duplicateName = await Attribute.findOne({ subCategoryId: attribute.subCategoryId, name: req.body.name, isDeleted: false });
      if (duplicateName && String(duplicateName._id) !== String(attribute._id)) {
        res.status(400);
        throw new Error('Attribute name already exists under this Sub Category');
      }
      attribute.name = req.body.name;
  }

  // Update allowed fields (Code cannot be updated)
  const allowedUpdates = [
    'description', 'attributeGroup', 'dataType', 'inputType', 
    'required', 'searchable', 'filterable', 'comparable', 
    'visibleOnProduct', 'sellerEditable', 'adminOnly', 'showOnCard',
    'placeholder', 'helpText', 'defaultValue', 'validation', 
    'sortOrder', 'status'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      attribute[field] = req.body[field];
    }
  });

  const updatedAttribute = await attribute.save();
  res.json(updatedAttribute);
});

// @desc    Delete attribute (Soft)
// @route   DELETE /api/v1/attributes/:id
export const deleteAttribute = asyncHandler(async (req, res) => {
  const attribute = await Attribute.findById(req.params.id);

  if (!attribute) {
    res.status(404);
    throw new Error('Attribute not found');
  }

  attribute.isDeleted = true;
  await attribute.save();

  res.json({ message: 'Attribute removed (soft delete)' });
});

// @desc    Get all attributes
// @route   GET /api/v1/attributes
export const getAttributes = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSize) || 10;
  const page = Number(req.query.pageNumber) || 1;
  const keyword = req.query.keyword
    ? { name: { $regex: req.query.keyword, $options: 'i' } }
    : {};

  const query = { ...keyword, isDeleted: false };
  
  if (req.query.subCategoryId) {
      query.subCategoryId = req.query.subCategoryId;
  }

  const count = await Attribute.countDocuments(query);
  const attributes = await Attribute.find(query)
    .populate({
        path: 'subCategoryId',
        select: 'name categoryId',
        populate: {
            path: 'categoryId',
            select: 'name'
        }
    })
    .sort({ subCategoryId: 1, sortOrder: 1, createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ attributes, page, pages: Math.ceil(count / pageSize), count });
});

// @desc    Get active attributes
// @route   GET /api/v1/attributes/active
export const getActiveAttributes = asyncHandler(async (req, res) => {
  const attributes = await Attribute.find({ status: 'Active', isDeleted: false })
    .populate('subCategoryId', 'name')
    .sort({ sortOrder: 1 });
  
  res.json(attributes);
});

// @desc    Get active attributes by Sub Category ID (Optimized with values)
// @route   GET /api/v1/attributes/subcategory/:subCategoryId
import mongoose from 'mongoose';
export const getAttributesBySubCategory = asyncHandler(async (req, res) => {
  const attributes = await Attribute.aggregate([
    { 
      $match: { 
        subCategoryId: new mongoose.Types.ObjectId(req.params.subCategoryId), 
        status: 'Active', 
        isDeleted: false 
      } 
    },
    { $sort: { sortOrder: 1 } },
    {
      $lookup: {
        from: 'attributevalues', // MongoDB collection name
        localField: '_id',
        foreignField: 'attributeId',
        pipeline: [
          { $match: { status: 'Active', isDeleted: false } },
          { $sort: { sortOrder: 1 } }
        ],
        as: 'values'
      }
    }
  ]);
  
  res.json(attributes);
});

// @desc    Get attribute by ID
// @route   GET /api/v1/attributes/:id
export const getAttributeById = asyncHandler(async (req, res) => {
  const attribute = await Attribute.findOne({ _id: req.params.id, isDeleted: false })
    .populate('subCategoryId', 'name');

  if (attribute) {
    res.json(attribute);
  } else {
    res.status(404);
    throw new Error('Attribute not found');
  }
});
