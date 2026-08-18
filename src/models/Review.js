import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    productSlug: {
      type: String,
      required: true,
      index: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    userAvatar: {
      type: String
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    images: {
      type: [String],
      default: []
    },
    video: {
      type: Object,
      default: null
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    recommendProduct: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'deleted', 'reported'],
      default: 'approved'
    },
    helpfulVotes: {
      type: Number,
      default: 0
    },
    unhelpfulVotes: {
      type: Number,
      default: 0
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller'
    },
    sellerReply: {
      id: String,
      sellerName: String,
      text: String,
      createdAt: Date
    },
    orderId: {
      type: String // Frontend seems to send orderId sometimes
    }
  },
  {
    timestamps: true
  }
);

reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
