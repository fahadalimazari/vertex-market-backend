import express from 'express';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  getActiveCategories,
  getProductsByCategorySlug,
  getSubCategoryBySlug,
  getBrandProductsByCategory,
  toggleFeatured,
  toggleStatus
} from '../controllers/categoryController.js';
import { getSubCategoriesByCategory } from '../controllers/subCategoryController.js';

const router = express.Router();

router.route('/active').get(getActiveCategories);
router.route('/:id/featured').patch(toggleFeatured);
router.route('/:id/status').patch(toggleStatus);
router.route('/:slug/products').get(getProductsByCategorySlug);
router.route('/:slug/subcategories/:subSlug').get(getSubCategoryBySlug);
router.route('/:slug/brands/:brandSlug').get(getBrandProductsByCategory);
router.route('/:categoryId/subcategories').get(getSubCategoriesByCategory);
router.route('/').get(getCategories).post(createCategory);
router.route('/:id').get(getCategoryById).put(updateCategory).delete(deleteCategory);

export default router;
