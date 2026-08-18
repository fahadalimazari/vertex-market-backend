import express from 'express';
import { 
  subscribe, 
  unsubscribe, 
  getSubscribersAdmin 
} from '../controllers/newsletterController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

router.get('/admin', protect, authorizeRoles('Admin', 'Super Admin'), getSubscribersAdmin);

export default router;
