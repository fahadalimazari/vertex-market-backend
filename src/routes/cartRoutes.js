import express from 'express';
import {
  getCart,
  getCartCount,
  addToCart,
  updateCartItem,
  updateItemStatus,
  removeFromCart,
  clearCart,
  mergeCart,
  validateCart,
  applyCoupon,
  removeCoupon,
  updateShipping,
  moveToWishlist,
  addBundleToCart
} from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All cart routes are protected

router.route('/')
  .get(getCart)
  .post(addToCart)
  .delete(clearCart);

router.post('/bundle', addBundleToCart);

router.get('/count', getCartCount);

router.post('/items', addToCart);

router.route('/items/:id')
  .put(updateCartItem)
  .delete(removeFromCart);

router.route('/:id')
  .put(updateCartItem)
  .delete(removeFromCart);

router.patch('/items/status/:id', updateItemStatus);

router.post('/items/wishlist/:id', moveToWishlist);

router.delete('/clear', clearCart);

router.post('/merge', mergeCart);

router.post('/validate', validateCart);

router.route('/coupon')
  .post(applyCoupon)
  .delete(removeCoupon);

router.post('/shipping', updateShipping);


export default router;

