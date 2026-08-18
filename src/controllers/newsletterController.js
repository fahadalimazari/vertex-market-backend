import asyncHandler from 'express-async-handler';
import NewsletterSubscriber from '../models/NewsletterSubscriber.js';

// @desc    Subscribe to newsletter
// @route   POST /api/v1/newsletter/subscribe
// @access  Public
export const subscribe = asyncHandler(async (req, res) => {
  const { email, source } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide an email');
  }

  let subscriber = await NewsletterSubscriber.findOne({ email });

  if (subscriber) {
    if (subscriber.status === 'Unsubscribed') {
      subscriber.status = 'Subscribed';
      await subscriber.save();
      return res.status(200).json({ success: true, message: 'Resubscribed successfully', data: subscriber });
    } else {
      return res.status(200).json({ success: true, message: 'Already subscribed', data: subscriber });
    }
  }

  subscriber = await NewsletterSubscriber.create({
    email,
    source: source || 'Website'
  });

  res.status(201).json({ success: true, message: 'Subscribed successfully', data: subscriber });
});

// @desc    Unsubscribe from newsletter
// @route   POST /api/v1/newsletter/unsubscribe
// @access  Public
export const unsubscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide an email');
  }

  const subscriber = await NewsletterSubscriber.findOne({ email });

  if (!subscriber) {
    res.status(404);
    throw new Error('Subscriber not found');
  }

  subscriber.status = 'Unsubscribed';
  await subscriber.save();

  res.status(200).json({ success: true, message: 'Unsubscribed successfully' });
});

// @desc    Get all subscribers
// @route   GET /api/v1/newsletter/admin
// @access  Private/Admin
export const getSubscribersAdmin = asyncHandler(async (req, res) => {
  const subscribers = await NewsletterSubscriber.find({}).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: subscribers.length, data: subscribers });
});
