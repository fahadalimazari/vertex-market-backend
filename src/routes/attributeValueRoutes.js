import express from 'express';
import {
  createAttributeValue,
  updateAttributeValue,
  deleteAttributeValue,
  getAttributeValues,
  getActiveAttributeValues,
  getAttributeValuesByAttribute,
  getAttributeValueById
} from '../controllers/attributeValueController.js';

const router = express.Router();

router.route('/active').get(getActiveAttributeValues);
router.route('/attribute/:attributeId').get(getAttributeValuesByAttribute);
router.route('/').get(getAttributeValues).post(createAttributeValue);
router.route('/:id').get(getAttributeValueById).put(updateAttributeValue).delete(deleteAttributeValue);

export default router;
