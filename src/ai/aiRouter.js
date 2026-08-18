import express from 'express';
import { mockGenerateText, mockGenerateRecommendations } from './providers/mockProvider.js';

const router = express.Router();

// POST /api/ai/chat
router.post('/chat', async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    
    const reply = await mockGenerateText(prompt);
    res.json({ success: true, reply });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/recommend
router.post('/recommend', async (req, res, next) => {
  try {
    const { userId } = req.body;
    const recommendations = await mockGenerateRecommendations(userId);
    res.json({ success: true, recommendations });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/search
router.post('/search', async (req, res, next) => {
  try {
    const { query } = req.body;
    const semanticResults = await mockGenerateText(`Semantic search for: ${query}`);
    res.json({ success: true, results: semanticResults });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/review-summary
router.post('/review-summary', async (req, res, next) => {
  try {
    const { productId } = req.body;
    const summary = await mockGenerateText(`Summarizing reviews for product ${productId}`);
    res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
});

export default router;
