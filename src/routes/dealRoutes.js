import express from 'express';
import { getDeals, getFlashSales, createDeal } from '../controllers/dealController.js';

const router = express.Router();

router.route('/')
  .get(getDeals)
  .post(createDeal);

router.get('/flash-sales', getFlashSales);

export default router;
