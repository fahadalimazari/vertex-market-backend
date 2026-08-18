import asyncHandler from 'express-async-handler';
import axios from 'axios';
import Product from '../models/Product.js';

// @desc    Get AI product recommendations
// @route   POST /api/v1/ai/recommendations
// @access  Public
export const getAIRecommendations = asyncHandler(async (req, res) => {
  const { query } = req.body;

  if (!query) {
    res.status(400);
    throw new Error('Please provide a query for the AI');
  }

  try {
    const q = query.toLowerCase();
    const aiData = {
      intent: 'recommendation',
      category: '',
      budget: null,
      brand: null,
      keywords: []
    };

    if (q.includes('laptop') || q.includes('macbook')) {
      aiData.category = 'laptops';
      if (q.includes('gaming')) aiData.keywords.push('gaming');
    } else if (q.includes('phone') || q.includes('smartphone') || q.includes('iphone')) {
      aiData.category = 'smartphones';
    } else if (q.includes('shoe') || q.includes('sneaker')) {
      aiData.category = 'shoes';
    }

    const words = q.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (words[i] === 'under' && i + 1 < words.length) {
        const amount = parseFloat(words[i + 1].replace('$', ''));
        if (!isNaN(amount)) {
          aiData.budget = amount;
        }
      }
    }

    // Build MongoDB query based on AI extraction
    const mongoQuery = { status: { $in: ['Active', 'Published'] } };

    if (aiData.category) {
      mongoQuery.category = { $regex: new RegExp(aiData.category, 'i') };
    }

    if (aiData.budget) {
      mongoQuery.price = { $lte: aiData.budget };
    }

    if (aiData.brand) {
      mongoQuery.brand = { $regex: new RegExp(aiData.brand, 'i') };
    }

    // Fetch matching products
    const products = await Product.find(mongoQuery).limit(5);

    res.json({
      success: true,
      intent: aiData,
      products
    });
  } catch (error) {
    console.error('AI Service Error:', error.message);
    res.status(500);
    throw new Error('Failed to process AI recommendation');
  }
});

// @desc    Process AI Chat Messages & Orchestrate Responses
// @route   POST /api/v1/ai/chat
// @access  Public (optional auth)
export const processAIChat = asyncHandler(async (req, res) => {
  const { message, context } = req.body;
  const user = req.user; // from optionalAuth middleware

  if (!message) {
    res.status(400);
    throw new Error('Message is required');
  }

  const msg = message.toLowerCase();

  // 1. ORDER TRACKING INTENT
  if (msg.includes('order') && (msg.includes('track') || msg.includes('where') || msg.includes('latest'))) {
    if (!user) {
      return res.json({
        success: true,
        text: 'Please log in to track your orders.',
        action: null
      });
    }
    const Order = (await import('../models/Order.js')).default;
    const latestOrder = await Order.findOne({ user: user._id }).sort('-createdAt');
    if (!latestOrder) {
      return res.json({ success: true, text: "You don't have any recent orders." });
    }
    return res.json({
      success: true,
      text: `Your latest order (ID: ${latestOrder._id.toString().substring(0,8)}) is currently **${latestOrder.status}**.`,
      action: { type: 'SHOW_ORDER', data: latestOrder }
    });
  }

  // 2. PRODUCT SEARCH & COMPARISON INTENT
  if (msg.includes('find') || msg.includes('show') || msg.includes('search') || msg.includes('compare') || msg.includes('recommend')) {
    const Product = (await import('../models/Product.js')).default;
    let query = { status: { $in: ['Active', 'Published'] } };
    
    // Naive budget extraction
    const numbers = msg.match(/\d+(?:,\d+)?/g);
    if (msg.includes('under') && numbers) {
      const budget = parseInt(numbers[0].replace(/,/g, ''), 10);
      query.price = { $lte: budget };
    }

    const products = await Product.find(query).limit(4);
    if (products.length === 0) {
      return res.json({
        success: true,
        text: "Sorry, I couldn't find a product matching those requirements.",
        action: null
      });
    }

    if (msg.includes('compare')) {
      return res.json({
        success: true,
        text: "Here is the comparison based on the specifications of these products:",
        action: { type: 'COMPARE_PRODUCTS', data: products.slice(0,2) }
      });
    }

    return res.json({
      success: true,
      text: `I found these products for you:`,
      action: { type: 'SHOW_PRODUCTS', data: products }
    });
  }

  // 3. DEALS INTENT
  if (msg.includes('deal') || msg.includes('sale') || msg.includes('discount')) {
    const Product = (await import('../models/Product.js')).default;
    const deals = await Product.find({ discount: { $gt: 0 }, status: { $in: ['Active', 'Published'] } }).sort('-discount').limit(4);
    return res.json({
      success: true,
      text: "Here are some of the best deals today!",
      action: { type: 'SHOW_PRODUCTS', data: deals }
    });
  }

  // 4. STORES INTENT
  if (msg.includes('store') || msg.includes('seller') || msg.includes('brand')) {
    const Seller = (await import('../models/Seller.js')).default;
    const stores = await Seller.find({ status: 'Approved' }).limit(2);
    return res.json({
      success: true,
      text: "Here are some of our top-rated enterprise sellers:",
      action: { type: 'SHOW_STORES', data: stores }
    });
  }

  // 5. SUPPORT & LEGAL INTENT
  if (msg.includes('return') || msg.includes('refund')) {
    return res.json({
      success: true,
      text: "Our standard return window is 14 days from delivery for eligible items. You can request a return directly from your Orders page.",
      action: { type: 'SUPPORT_LINK', data: { label: 'Request Return', url: '/returns' } }
    });
  }
  if (msg.includes('support') || msg.includes('help') || msg.includes('contact')) {
    return res.json({
      success: true,
      text: "You can create a support ticket or view our FAQ in the Help Center.",
      action: { type: 'SUPPORT_LINK', data: { label: 'Contact Support', url: '/support' } }
    });
  }

  // FALLBACK
  return res.json({
    success: true,
    text: "I am Vertex AI, your enterprise shopping assistant. I can help you find products, track orders, compare specs, or discover top stores. What would you like to do?",
    action: null
  });
});
