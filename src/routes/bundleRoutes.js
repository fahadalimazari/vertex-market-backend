import express from 'express';
import { 
  getBundles, getBundle, getBundlesAdmin, 
  createBundle, updateBundle, deleteBundle
} from '../controllers/bundleController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getBundles)
  .post(protect, authorizeRoles('Admin', 'Super Admin'), createBundle);

router.route('/admin')
  .get(protect, authorizeRoles('Admin', 'Super Admin'), getBundlesAdmin);

router.route('/:id')
  .get(getBundle)
  .put(protect, authorizeRoles('Admin', 'Super Admin'), updateBundle)
  .delete(protect, authorizeRoles('Admin', 'Super Admin'), deleteBundle);

export default router;
