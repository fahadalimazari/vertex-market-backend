import express from 'express';
import {
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getSubCategories,
  getSubCategoryById,
  getActiveSubCategories,
  getSubCategoriesByCategory
} from '../controllers/subCategoryController.js';
import { getAttributesBySubCategory } from '../controllers/attributeController.js';

const router = express.Router();

router.route('/active').get(getActiveSubCategories);
router.route('/category/:categoryId').get(getSubCategoriesByCategory);
router.route('/:subCategoryId/attributes').get(getAttributesBySubCategory);
router.route('/').get(getSubCategories).post(createSubCategory);
router.route('/:id').get(getSubCategoryById).put(updateSubCategory).delete(deleteSubCategory);

export default router;
