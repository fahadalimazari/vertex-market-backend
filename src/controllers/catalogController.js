import asyncHandler from 'express-async-handler';
import catalogService from '../services/catalogService.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';

// @desc    Get products based on dynamic catalog filters
// @route   GET /api/v1/catalog/products
// @access  Public
export const getCatalogProducts = asyncHandler(async (req, res) => {
  const result = await catalogService.getProducts(req.query);
  res.json({ success: true, data: result });
});

// @desc    Get dynamic filters for faceted navigation
// @route   GET /api/v1/catalog/filters
// @access  Public
export const getCatalogFilters = asyncHandler(async (req, res) => {
  const filters = await catalogService.getFilters(req.query);
  res.json({ success: true, data: filters });
});

// @desc    Get search suggestions
// @route   GET /api/v1/catalog/suggestions
// @access  Public
export const getSearchSuggestions = asyncHandler(async (req, res) => {
  const suggestions = await catalogService.getSuggestions(req.query.q);
  res.json({ success: true, data: suggestions });
});

// @desc    Get category details for SEO/Routing
// @route   GET /api/v1/catalog/categories/:slug
// @access  Public
export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug }).lean();
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.json({ success: true, data: category });
});

// @desc    Get subcategory details for SEO/Routing
// @route   GET /api/v1/catalog/subcategories/:slug
// @access  Public
export const getSubCategoryBySlug = asyncHandler(async (req, res) => {
  const subcategory = await SubCategory.findOne({ slug: req.params.slug }).lean();
  if (!subcategory) {
    res.status(404);
    throw new Error('SubCategory not found');
  }
  res.json({ success: true, data: subcategory });
});
