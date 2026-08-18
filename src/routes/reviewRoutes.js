import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createReview, getProductReviews } from '../controllers/reviewController.js';

const router = express.Router();

router.route('/')
  .post(protect, createReview);

router.route('/product/:slug')
  .get(getProductReviews);

export default router;
