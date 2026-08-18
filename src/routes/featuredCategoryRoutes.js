import express from 'express';
import {
  getHomeFeaturedCategories,
  getAllFeaturedCategories,
  createFeaturedCategory,
  updateFeaturedCategory,
  deleteFeaturedCategory,
  reorderFeaturedCategories,
  toggleFeaturedCategoryStatus
} from '../controllers/homepageFeaturedCategoryController.js';

const router = express.Router();

// Public route for home page display
router.get('/', getHomeFeaturedCategories);

// Admin routes
router.get('/all', getAllFeaturedCategories);
router.post('/', createFeaturedCategory);
router.put('/:id', updateFeaturedCategory);
router.delete('/:id', deleteFeaturedCategory);
router.patch('/reorder', reorderFeaturedCategories);
router.patch('/status', toggleFeaturedCategoryStatus);

export default router;
