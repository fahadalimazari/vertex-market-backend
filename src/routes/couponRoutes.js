import express from 'express';
import { getMyVouchers } from '../controllers/couponController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/my-vouchers', protect, getMyVouchers);

export default router;
