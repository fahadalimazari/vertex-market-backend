import express from 'express';
import {
  getProductVariants,
  getVariantById,
  createVariant,
  updateVariant,
  deleteVariant,
  generateVariants,
  updateVariantStock,
  updateVariantStatus,
  bulkUpdateVariants,
  duplicateVariant,
  getVariantOptions
} from '../controllers/variantController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes starting with /api/v1/variants
router.route('/generate').post(protect, generateVariants);
router.route('/bulk-update').patch(protect, bulkUpdateVariants);
router.route('/duplicate').post(protect, duplicateVariant);

router.route('/')
  .post(protect, createVariant);

router.route('/:id')
  .get(getVariantById)
  .put(protect, updateVariant)
  .delete(protect, deleteVariant);

router.route('/stock/:id').patch(protect, updateVariantStock);
router.route('/status/:id').patch(protect, updateVariantStatus);

// Note: /api/v1/products/:productId/variants is mounted in productRoutes.js or handled here?
// The prompt specifies:
// GET /api/v1/products/:productId/variants
// I will export these and let them be mounted accordingly.
export default router;
