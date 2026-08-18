import express from 'express';
import {
  getHeroBanners,
  createHeroBanner,
  updateHeroBanner,
  deleteHeroBanner,
  updateHeroBannerStatus,
  reorderHeroBanners,
} from '../controllers/heroBannerController.js';

const router = express.Router();

// Reorder endpoint must be defined before /:id routes
router.patch('/reorder', reorderHeroBanners);

router.route('/')
  .get(getHeroBanners)
  .post(createHeroBanner);

router.patch('/:id/status', updateHeroBannerStatus);

router.route('/:id')
  .put(updateHeroBanner)
  .delete(deleteHeroBanner);

export default router;
