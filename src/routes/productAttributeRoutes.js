import express from 'express';
import { saveProductAttributes } from '../controllers/productAttributeController.js';

const router = express.Router();

router.route('/bulk').post(saveProductAttributes);

export default router;
