import express from 'express';
import { getCheckoutSummary } from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All checkout routes are protected

router.get('/summary', getCheckoutSummary);

export default router;
