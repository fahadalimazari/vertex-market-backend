import express from 'express';
import {
  getAllFlashSales,
  getFlashSaleById,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
  updateFlashSaleStatus,
  trackFlashSaleEvent,
} from '../controllers/heroFlashSaleController.js';

const router = express.Router();

router.route('/')
  .get(getAllFlashSales)
  .post(createFlashSale);

router.patch('/:id/status', updateFlashSaleStatus);
router.post('/:id/track', trackFlashSaleEvent);

router.route('/:id')
  .get(getFlashSaleById)
  .put(updateFlashSale)
  .delete(deleteFlashSale);

export default router;
