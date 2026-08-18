import asyncHandler from 'express-async-handler';
import SubCategory from '../models/SubCategory.js';
import Category from '../models/Category.js';

// @desc    Create a new sub category
// @route   POST /api/v1/subcategories
export const createSubCategory = asyncHandler(async (req, res) => {
  const { categoryId, name, slug, description, image, icon, status, displayOrder, isFeatured } = req.body;

  // Validate Parent Category
  const parentCategory = await Category.findById(categoryId);
  if (!parentCategory) {
    res.status(404);
    throw new Error('Parent Category not found');
  }
  if (parentCategory.isDeleted) {
    res.status(400);
    throw new Error('Parent Category is deleted');
  }
  if (parentCategory.status !== 'Active') {
    res.status(400);
    throw new Error('Parent Category must be Active');
  }

  // Prevent duplicate names under same parent
  const duplicateName = await SubCategory.findOne({ categoryId, name, isDeleted: false });
  if (duplicateName) {
    res.status(400);
    throw new Error('Sub Category name already exists under this Parent Category');
  }

  // Ensure slug uniqueness
  const slugExists = await SubCategory.findOne({ slug });
  if (slugExists) {
    res.status(400);
    throw new Error('Sub Category slug already exists in the marketplace');
  }

  const subCategory = await SubCategory.create({
    categoryId,
    name,
    slug,
    description,
    image,
    icon,
    status: status || 'Active',
    displayOrder: displayOrder || 0,
    isFeatured: isFeatured || false,
    createdBy: req.user ? req.user._id : null
  });

  res.status(201).json(subCategory);
});

// @desc    Update a sub category
// @route   PUT /api/v1/subcategories/:id
export const updateSubCategory = asyncHandler(async (req, res) => {
  const subCategory = await SubCategory.findById(req.params.id);

  if (!subCategory) {
    res.status(404);
    throw new Error('Sub Category not found');
  }

  if (req.body.name && req.body.name !== subCategory.name) {
      // check for duplicate under same parent
      const duplicateName = await SubCategory.findOne({ categoryId: subCategory.categoryId, name: req.body.name, isDeleted: false });
      if (duplicateName && String(duplicateName._id) !== String(subCategory._id)) {
        res.status(400);
        throw new Error('Sub Category name already exists under this Parent Category');
      }
      subCategory.name = req.body.name;
  }

  subCategory.description = req.body.description !== undefined ? req.body.description : subCategory.description;
  subCategory.image = req.body.image !== undefined ? req.body.image : subCategory.image;
  subCategory.icon = req.body.icon !== undefined ? req.body.icon : subCategory.icon;
  subCategory.status = req.body.status || subCategory.status;
  subCategory.displayOrder = req.body.displayOrder !== undefined ? req.body.displayOrder : subCategory.displayOrder;
  subCategory.isFeatured = req.body.isFeatured !== undefined ? req.body.isFeatured : subCategory.isFeatured;

  const updatedSubCategory = await subCategory.save();
  res.json(updatedSubCategory);
});

// @desc    Delete sub category (Soft)
// @route   DELETE /api/v1/subcategories/:id
export const deleteSubCategory = asyncHandler(async (req, res) => {
  const subCategory = await SubCategory.findById(req.params.id);

  if (!subCategory) {
    res.status(404);
    throw new Error('Sub Category not found');
  }

  subCategory.isDeleted = true;
  await subCategory.save();

  res.json({ message: 'Sub Category removed (soft delete)' });
});

// @desc    Get all sub categories
// @route   GET /api/v1/subcategories
export const getSubCategories = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSize) || 10;
  const page = Number(req.query.pageNumber) || 1;
  const keyword = req.query.keyword
    ? { name: { $regex: req.query.keyword, $options: 'i' } }
    : {};

  const query = { ...keyword, isDeleted: false };
  
  const count = await SubCategory.countDocuments(query);
  const subCategories = await SubCategory.find(query)
    .populate('categoryId', 'name')
    .sort({ displayOrder: 1, createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ subCategories, page, pages: Math.ceil(count / pageSize), count });
});

// @desc    Get active sub categories
// @route   GET /api/v1/subcategories/active
export const getActiveSubCategories = asyncHandler(async (req, res) => {
  const subCategories = await SubCategory.find({ status: 'Active', isDeleted: false })
    .populate('categoryId', 'name')
    .sort({ displayOrder: 1 });
  
  res.json(subCategories);
});

// @desc    Get active sub categories by Category ID
// @route   GET /api/v1/subcategories/category/:categoryId
export const getSubCategoriesByCategory = asyncHandler(async (req, res) => {
  const subCategories = await SubCategory.find({ 
    categoryId: req.params.categoryId, 
    status: 'Active', 
    isDeleted: false 
  }).sort({ displayOrder: 1 });
  
  res.json(subCategories);
});

// @desc    Get sub category by ID
// @route   GET /api/v1/subcategories/:id
export const getSubCategoryById = asyncHandler(async (req, res) => {
  const subCategory = await SubCategory.findOne({ _id: req.params.id, isDeleted: false })
    .populate('categoryId', 'name');

  if (subCategory) {
    res.json(subCategory);
  } else {
    res.status(404);
    throw new Error('Sub Category not found');
  }
});
