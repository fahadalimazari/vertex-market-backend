import express from 'express';
import { 
  authUser, 
  registerUser, 
  getUserProfile,
  updateUserProfile,
  updatePreferences,
  addSearchHistory,
  clearSearchHistory,
  addRecentlyViewed,
  updateCompareItems,
  updateChatHistory,
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  updateNotificationPreferences,
  changePassword,
  setupMfa,
  verifyMfa,
  disableMfa,
  getSessions,
  revokeSession,
  revokeAllOtherSessions
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.get('/me', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// Preferences and history routes
router.put('/preferences', protect, updatePreferences);
router.route('/search-history')
  .post(protect, addSearchHistory)
  .delete(protect, clearSearchHistory);
router.post('/recently-viewed', protect, addRecentlyViewed);
router.put('/compare', protect, updateCompareItems);

// Chat & Payments
router.put('/chat', protect, updateChatHistory);
router.route('/payments')
  .get(protect, getPaymentMethods)
  .post(protect, addPaymentMethod);
router.route('/payments/:id')
  .delete(protect, deletePaymentMethod);
router.patch('/payments/:id/default', protect, setDefaultPaymentMethod);

// Notification Preferences
router.put('/notification-preferences', protect, updateNotificationPreferences);

// Security & MFA
router.put('/password', protect, changePassword);
router.post('/mfa/setup', protect, setupMfa);
router.post('/mfa/verify', protect, verifyMfa);
router.post('/mfa/disable', protect, disableMfa);

// Sessions
router.route('/sessions')
  .get(protect, getSessions)
  .delete(protect, revokeAllOtherSessions);
router.delete('/sessions/:id', protect, revokeSession);

export default router;
