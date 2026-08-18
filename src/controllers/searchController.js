import asyncHandler from 'express-async-handler';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import AnalyticsLog from '../models/AnalyticsLog.js';

// @desc    Global search across Categories, Brands, and Products
// @route   GET /api/v1/search
// @access  Public
export const getGlobalSearch = asyncHandler(async (req, res) => {
  const query = req.query.q || req.query.keyword || req.query.search || '';

  if (!query || query.trim() === '') {
    return res.json({
      success: true,
      keyword: '',
      categories: [],
      brands: [],
      products: [],
      suggestions: [],
      totalMatches: 0
    });
  }

  const cleanQuery = query.trim().toLowerCase();

  // Log analytics tracking event for search keyword
  AnalyticsLog.create({
    event: 'SEARCH_KEYWORD',
    target: cleanQuery
  }).catch(err => console.error('Search analytics log error:', err));

  const regex = new RegExp(cleanQuery, 'i');

  // Query across multiple collections simultaneously
  const [categories, brands, products] = await Promise.all([
    Category.find({ name: regex, isDeleted: false, status: 'Active' }).select('name slug icon image description').limit(5).lean(),
    Brand.find({ name: regex, status: 'Active' }).select('name slug logo description').limit(5).lean(),
    Product.find({
      status: { $in: ['Active', 'Published'] },
      $or: [
        { name: regex },
        { shortDescription: regex },
        { tags: regex },
        { searchKeywords: regex },
        { category: regex },
        { subCategory: regex },
        { brand: regex }
      ]
    }).select('name slug price oldPrice discount image rating reviews stock isFeatured brand category subCategory').limit(20).lean()
  ]);

  // Generate related product suggestions or accessory items
  const suggestions = products.slice(0, 5).map(p => p.name);

  res.json({
    success: true,
    keyword: cleanQuery,
    categories,
    brands,
    products,
    suggestions,
    totalMatches: categories.length + brands.length + products.length
  });
});
