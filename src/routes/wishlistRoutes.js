import express from 'express';
import {
  getWishlist,
  getWishlistCount,
  addToWishlist,
  removeFromWishlist,
  moveToCart
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getWishlist)
  .post(addToWishlist);

router.get('/count', getWishlistCount);

router.route('/:id')
  .delete(removeFromWishlist);

router.post('/move-to-cart/:id', moveToCart);

export default router;
