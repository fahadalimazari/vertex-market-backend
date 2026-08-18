import express from 'express';
import { 
  getBrands, getBrandBySlugOrId, getBrandsAdmin, 
  createBrand, updateBrand, deleteBrand,
  followBrand, unfollowBrand, updateBrandVerification
} from '../controllers/brandController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getBrands)
  .post(protect, authorizeRoles('Admin', 'Super Admin'), createBrand);

router.route('/admin')
  .get(protect, authorizeRoles('Admin', 'Super Admin'), getBrandsAdmin);

router.route('/:id/follow')
  .post(protect, followBrand);

router.route('/:id/unfollow')
  .post(protect, unfollowBrand);

router.route('/:id/verification')
  .put(protect, authorizeRoles('Admin', 'Super Admin'), updateBrandVerification);

router.route('/:id')
  .get(getBrandBySlugOrId)
  .put(protect, authorizeRoles('Admin', 'Super Admin'), updateBrand)
  .delete(protect, authorizeRoles('Admin', 'Super Admin'), deleteBrand);

export default router;
