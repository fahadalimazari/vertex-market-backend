import express from 'express';
import { getAppSettings, updateAppSettings } from '../controllers/appSettingController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getAppSettings)
  .put(protect, authorizeRoles('Super Admin', 'Admin'), updateAppSettings);

export default router;
