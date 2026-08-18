import express from 'express';
import { getAIRecommendations, processAIChat } from '../controllers/aiController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/recommendations', getAIRecommendations);

// AI Shopping Assistant Chat Endpoint
// Uses optionalAuth to know if the user is logged in (for order/cart tracking)
router.post('/chat', optionalAuth, processAIChat);

export default router;
