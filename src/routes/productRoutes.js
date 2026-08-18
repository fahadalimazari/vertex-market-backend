import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getRelatedProducts,
  getSimilarProducts,
  getTrendingProducts,
  getBestSellers,
  getNewArrivals,
  getFlashSaleProducts,
  getFeaturedProducts,
  getRecentlyViewed,
  getFrequentlyBought,
  getProductsBySeller,
  getAiRecommended,
  getTodaysDeals,
  getYouMayLike,
  getCustomersAlsoBought
} from '../controllers/productController.js';
import { getProductVariants, getVariantOptions } from '../controllers/variantController.js';

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(protect, authorizeRoles('Seller', 'Admin', 'Super Admin'), createProduct);

// Explicit shorthand routes required by enterprise specification
router.get('/featured', getFeaturedProducts);
router.get('/trending', getTrendingProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);
router.get('/todays-deals', getTodaysDeals);

// Recommendation endpoints (MUST be before /:slug)
router.get('/recommendations/related', getRelatedProducts);
router.get('/recommendations/similar', getSimilarProducts);
router.get('/recommendations/trending', getTrendingProducts);
router.get('/recommendations/best-sellers', getBestSellers);
router.get('/recommendations/new-arrivals', getNewArrivals);
router.get('/recommendations/flash-sale', getFlashSaleProducts);
router.get('/recommendations/recently-viewed', getRecentlyViewed);
router.get('/recommendations/frequently-bought', getFrequentlyBought);
router.get('/recommendations/seller/:sellerId', getProductsBySeller);
router.get('/recommendations/ai-recommended', getAiRecommended);
router.get('/recommendations/you-may-like', getYouMayLike);
router.get('/recommendations/customers-also-bought', getCustomersAlsoBought);

router.route('/:productId/variants')
  .get(getProductVariants);

router.route('/:productId/variant-options')
  .get(getVariantOptions);

router.route('/:slug')
  .get(getProductBySlug);

router.route('/:id')
  .put(updateProduct)
  .delete(deleteProduct);

export default router;
