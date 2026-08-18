import express from 'express';
import {
  createAttribute,
  updateAttribute,
  deleteAttribute,
  getAttributes,
  getActiveAttributes,
  getAttributesBySubCategory,
  getAttributeById
} from '../controllers/attributeController.js';

const router = express.Router();

router.route('/active').get(getActiveAttributes);
router.route('/subcategory/:subCategoryId').get(getAttributesBySubCategory);
router.route('/').get(getAttributes).post(createAttribute);
router.route('/:id').get(getAttributeById).put(updateAttribute).delete(deleteAttribute);

export default router;
