import express from 'express';
import { 
  getSellers, 
  getSellerById, 
  updateSellerStatus,
  getSellerStats,
  getSellerProducts,
  getSellerOrders,
  getSellerFollowers,
  getSellerReviews,
  assignStoreBadge,
  removeStoreBadge
} from '../controllers/superAdminController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes below
router.use(protect);
router.use(authorizeRoles('Super Admin', 'Admin')); // Assume Admin also has access, or strictly 'Super Admin'

router.route('/sellers/stats')
  .get(getSellerStats);

router.route('/sellers')
  .get(getSellers);

router.route('/sellers/:id')
  .get(getSellerById);

router.route('/sellers/:id/status')
  .put(updateSellerStatus);

router.route('/sellers/:id/products')
  .get(getSellerProducts);

router.route('/sellers/:id/orders')
  .get(getSellerOrders);

router.route('/sellers/:id/followers')
  .get(getSellerFollowers);

router.route('/sellers/:id/reviews')
  .get(getSellerReviews);

router.route('/sellers/:id/badges')
  .post(assignStoreBadge);

router.route('/sellers/:id/badges/:badgeId')
  .patch(removeStoreBadge);

export default router;
