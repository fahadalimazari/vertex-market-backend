import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  getSellers,
  getSellerById,
  createSeller,
  quickCreateSeller,
  updateSellerStatus,
  resetSellerPassword,
  updateSeller,
  deleteSeller
} from '../controllers/adminSellerController.js';

const router = express.Router();

// All routes require Admin privileges
router.use(protect);
router.use(authorizeRoles('Super Admin', 'Admin'));

router.route('/')
  .get(getSellers)
  .post(createSeller);

router.post('/quick-create', quickCreateSeller);

router.route('/:id')
  .get(getSellerById)
  .put(updateSeller)
  .delete(deleteSeller);

router.patch('/:id/status', updateSellerStatus);
router.post('/:id/reset-password', resetSellerPassword);

export default router;
