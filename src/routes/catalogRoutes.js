import express from 'express';
import {
  getCatalogProducts,
  getCatalogFilters,
  getSearchSuggestions,
  getCategoryBySlug,
  getSubCategoryBySlug
} from '../controllers/catalogController.js';

const router = express.Router();

router.get('/products', getCatalogProducts);
router.get('/search', getCatalogProducts); // Search uses the same products endpoint logic
router.get('/filters', getCatalogFilters);
router.get('/suggestions', getSearchSuggestions);
router.get('/categories/:slug', getCategoryBySlug);
router.get('/subcategories/:slug', getSubCategoryBySlug);

export default router;
