import express from 'express';
import { protect, requireActiveSeller } from '../middleware/authMiddleware.js';
import {
  getSellerDashboardStats,
  getSellerProducts,
  getSellerOrders,
  getSellerProfile,
  updateSellerInventory,
  getSellerCoupons,
  createSellerCoupon,
  deleteSellerCoupon,
  getSellerStaff,
  createSellerStaff,
  deleteSellerStaff,
  updateSellerTheme,
  updateSellerPolicies,
  updateSellerSEO,
  updateSellerSettings,
  getPublicSellerProfile,
  getPublicSellerProducts,
  getPublicStores
} from '../controllers/sellerController.js';

const router = express.Router();

// Public routes (must be before protect middleware)
router.get('/stores', getPublicStores);
router.get('/store/:slug', getPublicSellerProfile);
router.get('/store/:slug/products', getPublicSellerProducts);

// User store following (needs user auth, not seller auth, so we'll just use a generic protect)
// Wait, 'protect' middleware currently requires a User. 
// We will export a new controller method 'toggleFollowStore'
import { toggleFollowStore, updateSellerOrderStatus } from '../controllers/sellerController.js';
router.post('/store/:id/follow', protect, toggleFollowStore);
router.use(protect);
router.use(requireActiveSeller); // All routes below require approved seller

router.get('/dashboard', getSellerDashboardStats);
router.get('/products', getSellerProducts);
router.get('/orders', getSellerOrders);
router.get('/profile', getSellerProfile);

// Stub routes for the new seller modules
router.get('/analytics', getSellerDashboardStats); // Reusing dashboard stats for now
router.put('/orders/:id/status', updateSellerOrderStatus);

router.get('/returns', (req, res) => res.json({ success: true, data: [] }));
router.put('/returns/:id/status', (req, res) => res.json({ success: true }));

router.get('/finance', (req, res) => res.json({ success: true, data: { available: 0, pending: 0, total: 0 } }));
router.post('/finance/withdraw', (req, res) => res.json({ success: true }));

router.get('/inventory', getSellerProducts); // Reusing get products for inventory
router.put('/inventory/:id', updateSellerInventory);

router.get('/staff', getSellerStaff);
router.post('/staff', createSellerStaff);
router.delete('/staff/:id', deleteSellerStaff);

router.get('/coupons', getSellerCoupons);
router.post('/coupons', createSellerCoupon);
router.delete('/coupons/:id', deleteSellerCoupon);

// Store customization
router.get('/theme', getSellerProfile); // Settings are in profile
router.put('/theme', updateSellerTheme);

router.get('/policies', getSellerProfile);
router.put('/policies', updateSellerPolicies);

router.get('/seo', getSellerProfile);
router.put('/seo', updateSellerSEO);

router.get('/messages', (req, res) => res.json({ success: true, data: [] }));
router.post('/messages', (req, res) => res.json({ success: true }));

router.get('/support', (req, res) => res.json({ success: true, data: [] }));
router.post('/support', (req, res) => res.json({ success: true }));

router.get('/settings', getSellerProfile);
router.put('/settings', updateSellerSettings);

export default router;
