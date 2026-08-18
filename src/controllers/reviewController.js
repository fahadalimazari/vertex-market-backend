import asyncHandler from 'express-async-handler';
import Review from '../models/Review.js';
import Product from '../models/Product.js';

// @desc    Fetch reviews for a product by slug
// @route   GET /api/v1/reviews/product/:slug
// @access  Public
export const getProductReviews = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const reviews = await Review.find({ productSlug: slug, status: 'approved' }).sort('-createdAt');
  res.json({ success: true, count: reviews.length, data: reviews });
});

// @desc    Create new review
// @route   POST /api/v1/reviews
// @access  Private
export const createReview = asyncHandler(async (req, res) => {
  const { productSlug, rating, title, description, recommendProduct, orderId, images, video, isAnonymous } = req.body;

  const product = await Product.findOne({ slug: productSlug });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  const productId = product._id;

  const alreadyReviewed = await Review.findOne({
    productId,
    userId: req.user._id
  });

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already submitted a review for this product.');
  }

  const userName = req.user.firstName 
    ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() 
    : req.user.name || 'Anonymous User';

  const review = new Review({
    productSlug,
    productId,
    userId: req.user._id,
    userName,
    userAvatar: req.user.avatar || req.user.profileImage || '',
    rating: Number(rating),
    title,
    description,
    images: images || [],
    video: video || null,
    isAnonymous: Boolean(isAnonymous),
    recommendProduct,
    orderId,
    sellerId: product.sellerId,
    status: 'approved'
  });

  const createdReview = await review.save();

  // Update product rating and reviews count
  const reviews = await Review.find({ productId, status: 'approved' });
  product.reviews = reviews.length;
  product.rating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
  
  // Save without triggering validation on other fields that might be strict
  await product.save({ validateBeforeSave: false });

  res.status(201).json({ success: true, data: createdReview });
});
