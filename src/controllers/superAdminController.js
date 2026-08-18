import mongoose from 'mongoose';
import Seller from '../models/Seller.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import StoreFollower from '../models/StoreFollower.js';
import { sendResponse } from '../utils/responseFormatter.js';

// Helper to calculate badges based on real stats
const calculateBadges = (followers, rating, products, orders, isVerified, status, reviewCount, createdAt) => {
  const badges = [];
  if (status !== 'Approved') return badges;
  
  if (isVerified) badges.push('Verified Seller');
  
  // High tier badges
  if (followers >= 10000 && rating >= 4.5 && products >= 20 && orders >= 100) {
    badges.push('Elite Store');
  } else if (followers >= 5000 && rating >= 4.3 && products >= 10 && orders >= 50) {
    badges.push('Top Store');
  } else if (followers >= 1000) {
    badges.push('Trusted Store');
  } else if (followers >= 500) {
    badges.push('Popular Store');
  } else if (followers >= 100) {
    badges.push('Rising Store');
  }
  
  if (rating >= 4.7 && reviewCount >= 20) badges.push('Top Rated');
  if (orders >= 200) badges.push('Best Seller');
  
  // New Store (Created in last 30 days)
  const daysSinceCreation = (Date.now() - new Date(createdAt).getTime()) / (1000 * 3600 * 24);
  if (daysSinceCreation < 30) badges.push('New Store');

  return badges.slice(0, 2); // Max 2 badges
};

/**
 * @desc    Get top level stats for Admin Dashboard
 * @route   GET /api/superadmin/sellers/stats
 * @access  Private/Super Admin
 */
export const getSellerStats = async (req, res, next) => {
  try {
    const stats = await Seller.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const formattedStats = {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      suspended: 0,
      inactive: 0,
      resubmissionRequired: 0
    };

    stats.forEach(s => {
      formattedStats.total += s.count;
      if (s._id === 'Approved') formattedStats.approved = s.count;
      else if (s._id === 'Pending') formattedStats.pending = s.count;
      else if (s._id === 'Rejected') formattedStats.rejected = s.count;
      else if (s._id === 'Suspended') formattedStats.suspended = s.count;
      else if (s._id === 'Resubmission Required') formattedStats.resubmissionRequired = s.count;
      else if (s._id === 'Inactive') formattedStats.inactive = s.count;
    });

    sendResponse(res, 200, 'Seller stats fetched successfully', formattedStats);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all seller applications with real data aggregation
 * @route   GET /api/superadmin/sellers
 * @access  Private/Super Admin
 */
export const getSellers = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // Base match query
    let matchQuery = {};
    if (status && status !== 'all') {
      matchQuery.status = status;
    }
    
    if (search) {
      matchQuery.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { storeSlug: { $regex: search, $options: 'i' } },
        { contactEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const pipeline = [
      { $match: matchQuery },
      // Lookup User to match owner/email if not in seller
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
      
      // Match search on user name/email if provided
      ...(search ? [{
        $match: {
          $or: [
            ...matchQuery.$or,
            { 'userInfo.name': { $regex: search, $options: 'i' } },
            { 'userInfo.email': { $regex: search, $options: 'i' } }
          ]
        }
      }] : []),
      
      // Lookup Products
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'sellerId',
          as: 'productsData'
        }
      },
      // Lookup Orders (Matching user ID for orders, since orderItems.sellerId refs User)
      {
        $lookup: {
          from: 'orders',
          localField: 'user',
          foreignField: 'orderItems.sellerId',
          as: 'ordersData'
        }
      },
      // Lookup Followers
      {
        $lookup: {
          from: 'storefollowers',
          localField: '_id',
          foreignField: 'store',
          as: 'followersData'
        }
      },
      // Calculate Stats
      {
        $addFields: {
          productsCount: { $size: '$productsData' },
          followersCount: { $size: { $ifNull: ['$followersData', []] } },
          ordersCount: { $size: { $ifNull: ['$ordersData', []] } },
          completedOrdersCount: {
            $size: {
              $filter: {
                input: { $ifNull: ['$ordersData', []] },
                as: 'order',
                cond: { $eq: ['$$order.status', 'Delivered'] }
              }
            }
          },
          revenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: { $ifNull: ['$ordersData', []] },
                    as: 'order',
                    cond: { $eq: ['$$order.status', 'Delivered'] }
                  }
                },
                as: 'completedOrder',
                in: '$$completedOrder.totalPrice'
              }
            }
          }
        }
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: Number(limit) }
          ]
        }
      }
    ];

    const result = await Seller.aggregate(pipeline);
    const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;
    
    // Map data to calculate badges and format output
    const formattedSellers = result[0].data.map(seller => {
      // Get admin assigned active badges
      const adminBadges = seller.assignedBadges ? seller.assignedBadges.filter(b => b.isActive).map(b => ({
        _id: b._id,
        label: b.label,
        icon: b.icon,
        source: 'admin',
        assignedBy: b.assignedBy,
        assignedAt: b.assignedAt,
        reason: b.reason
      })) : [];

      const automaticBadges = [];
      
      // Real calculations based on followers and products
      const followers = seller.followersCount || 0;
      const rating = seller.storeRating || 0;
      
      if (followers >= 10000 && rating >= 4.5) {
        automaticBadges.push({ label: 'Elite Store', icon: 'FaCrown', source: 'automatic' });
      } else if (followers >= 5000 && rating >= 4.0) {
        automaticBadges.push({ label: 'Top Store', icon: 'FaTrophy', source: 'automatic' });
      } else if (rating >= 4.7) {
        automaticBadges.push({ label: 'Top Rated', icon: 'FaStar', source: 'automatic' });
      } else if (followers >= 1000) {
        automaticBadges.push({ label: 'Popular Store', icon: 'FaUsers', source: 'automatic' });
      }
      
      if (seller.isVerified) {
        automaticBadges.push({ label: 'Verified Seller', icon: 'FaCheckCircle', source: 'automatic' });
      }
      
      // Calculate age of store
      const ageInDays = (new Date() - new Date(seller.createdAt)) / (1000 * 60 * 60 * 24);
      if (ageInDays < 30) {
        automaticBadges.push({ label: 'New Store', icon: 'FaStore', source: 'automatic' });
      }

      const allBadges = [...adminBadges, ...automaticBadges];

      return {
        ...seller,
        ownerName: seller.userInfo ? seller.userInfo.name : (seller.bankDetails?.accountName || 'N/A'),
        ownerEmail: seller.contactEmail || (seller.userInfo ? seller.userInfo.email : 'N/A'),
        ownerAvatar: seller.userInfo ? seller.userInfo.avatar : null,
        badges: allBadges // unified badge array
      };
    });

    sendResponse(res, 200, 'Sellers fetched successfully', formattedSellers, {
      page: Number(page),
      limit: Number(limit),
      total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get seller details by ID with complete real data
 * @route   GET /api/superadmin/sellers/:id
 * @access  Private/Super Admin
 */
export const getSellerById = async (req, res, next) => {
  try {
    const seller = await Seller.findById(req.params.id).populate('user', 'name email phone avatar');
    if (!seller) {
      res.status(404);
      throw new Error('Seller not found');
    }

    // Get real counts dynamically
    const productsCount = await Product.countDocuments({ sellerId: seller._id });
    const followersCount = await StoreFollower.countDocuments({ storeId: seller._id }); // Assuming storeId
    
    // Calculate orders & revenue
    const orders = await Order.find({ 'orderItems.sellerId': seller.user._id });
    const completedOrders = orders.filter(o => o.status === 'Delivered');
    const cancelledOrders = orders.filter(o => o.status === 'Cancelled' || o.status === 'Returned');
    
    const revenue = completedOrders.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
    const completedOrdersCount = completedOrders.length;
    
    const rating = seller.storeRating || 0; // Ideally calculate from Reviews
    const reviewCount = 0;
    
    // Calculate Badges for Single Seller
    const adminBadges = seller.assignedBadges ? seller.assignedBadges.map(b => ({ // keep all for history
      _id: b._id,
      label: b.label,
      icon: b.icon,
      source: 'admin',
      assignedBy: b.assignedBy,
      assignedAt: b.assignedAt,
      reason: b.reason,
      isActive: b.isActive
    })) : [];

    const activeAdminBadges = adminBadges.filter(b => b.isActive);
    const automaticBadges = [];
    
    // Approximating counts since aggregation isn't run here. We can rely on metrics in seller doc
    const followers = seller.followers || 0;
    
    if (followers >= 10000 && rating >= 4.5) {
      automaticBadges.push({ label: 'Elite Store', icon: 'FaCrown', source: 'automatic' });
    } else if (followers >= 5000 && rating >= 4.0) {
      automaticBadges.push({ label: 'Top Store', icon: 'FaTrophy', source: 'automatic' });
    } else if (rating >= 4.7) {
      automaticBadges.push({ label: 'Top Rated', icon: 'FaStar', source: 'automatic' });
    } else if (followers >= 1000) {
      automaticBadges.push({ label: 'Popular Store', icon: 'FaUsers', source: 'automatic' });
    }
    
    if (seller.isVerified) {
      automaticBadges.push({ label: 'Verified Seller', icon: 'FaCheckCircle', source: 'automatic' });
    }
    
    const ageInDays = (new Date() - new Date(seller.createdAt)) / (1000 * 60 * 60 * 24);
    if (ageInDays < 30) {
      automaticBadges.push({ label: 'New Store', icon: 'FaStore', source: 'automatic' });
    }

    const sellerData = seller.toObject();
    sellerData.badges = [...activeAdminBadges, ...automaticBadges];
    sellerData.badgeHistory = adminBadges; // Full history
    
    sellerData.stats = {
        products: productsCount,
        followers: followersCount,
        orders: orders.length,
        completedOrders: completedOrdersCount,
        cancelledOrders: cancelledOrders.length,
        revenue: revenue,
        rating: rating,
        reviewCount: reviewCount
    };

    sendResponse(res, 200, 'Seller details fetched successfully', sellerData);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get store products
 * @route   GET /api/superadmin/sellers/:id/products
 */
export const getSellerProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { sellerId: req.params.id };
    
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .select('name sku price discount stock status createdAt image rating reviews sold')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    sendResponse(res, 200, 'Products fetched successfully', products, {
      page,
      limit,
      total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get store orders
 * @route   GET /api/superadmin/sellers/:id/orders
 */
export const getSellerOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const seller = await Seller.findById(req.params.id);
    if (!seller) throw new Error('Seller not found');
    
    const query = { 'orderItems.sellerId': seller.user };
    
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .select('orderNumber user totalPrice isPaid status createdAt paymentMethod orderItems')
      .populate('user', 'name email avatar')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Filter orderItems to only those belonging to this seller for accurate order representation
    const sellerOrders = orders.map(order => {
      const orderObj = order.toObject();
      orderObj.orderItems = orderObj.orderItems.filter(item => item.sellerId.toString() === seller.user.toString());
      return orderObj;
    });
    
    sendResponse(res, 200, 'Orders fetched successfully', sellerOrders, {
      page,
      limit,
      total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get store followers
 * @route   GET /api/superadmin/sellers/:id/followers
 */
export const getSellerFollowers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { storeId: req.params.id };

    const total = await StoreFollower.countDocuments(query);
    const followers = await StoreFollower.find(query)
      .populate('userId', 'name email avatar')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    sendResponse(res, 200, 'Followers fetched successfully', followers, {
      page,
      limit,
      total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get store reviews
 * @route   GET /api/superadmin/sellers/:id/reviews
 */
export const getSellerReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const seller = await Seller.findById(req.params.id);
    if (!seller) throw new Error('Seller not found');

    // Reviews can be associated with sellerId or the seller's user ID depending on schema usage
    // For Vertex Market, Reviews have a sellerId field, OR they're tied to products owned by the seller
    
    // Approach: Find reviews for products owned by this seller
    const sellerProducts = await Product.find({ sellerId: req.params.id }).select('_id');
    const productIds = sellerProducts.map(p => p._id);
    
    const query = { productId: { $in: productIds } };

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('userId', 'name email avatar')
      .populate('productId', 'name image')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    sendResponse(res, 200, 'Reviews fetched successfully', reviews, {
      page,
      limit,
      total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update seller status (Approve, Reject, Suspend, Resubmit)
 * @route   PUT /api/superadmin/sellers/:id/status
 * @access  Private/Super Admin
 */
export const updateSellerStatus = async (req, res, next) => {
  try {
    const { status, reason, comments } = req.body;
    
    const seller = await Seller.findById(req.params.id);

    if (!seller) {
      res.status(404);
      throw new Error('Seller not found');
    }

    const previousStatus = seller.status;
    seller.status = status;
    seller.approvedBy = req.user._id;

    if (status === 'Approved') {
      seller.approvalDate = Date.now();
    } else if (status === 'Rejected') {
      seller.rejectionDate = Date.now();
      seller.rejectionReason = reason;
    } else if (status === 'Resubmission Required') {
      seller.resubmissionComments = comments;
    }

    // Append to history
    seller.approvalHistory.push({
      previousStatus,
      newStatus: status,
      changedBy: req.user._id,
      adminComments: reason || comments || `Status updated to ${status}`
    });

    await seller.save();

    sendResponse(res, 200, `Seller status updated to ${status}`, seller);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign badge to store
 * @route   POST /api/superadmin/sellers/:id/badges
 * @access  Private/Super Admin
 */
export const assignStoreBadge = async (req, res, next) => {
  try {
    const { label, icon, reason } = req.body;
    
    if (!label || !icon) {
      res.status(400);
      throw new Error('Badge label and icon are required');
    }

    const seller = await Seller.findById(req.params.id);
    if (!seller) {
      res.status(404);
      throw new Error('Seller not found');
    }

    seller.assignedBadges.push({
      label,
      icon,
      source: 'admin',
      assignedBy: req.user._id,
      reason,
      isActive: true
    });

    await seller.save();

    sendResponse(res, 201, 'Badge assigned successfully', seller);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove (deactivate) badge from store
 * @route   PATCH /api/superadmin/sellers/:id/badges/:badgeId
 * @access  Private/Super Admin
 */
export const removeStoreBadge = async (req, res, next) => {
  try {
    const seller = await Seller.findById(req.params.id);
    if (!seller) {
      res.status(404);
      throw new Error('Seller not found');
    }

    const badge = seller.assignedBadges.id(req.params.badgeId);
    if (!badge) {
      res.status(404);
      throw new Error('Badge not found');
    }

    badge.isActive = false;
    await seller.save();

    sendResponse(res, 200, 'Badge removed successfully', seller);
  } catch (error) {
    next(error);
  }
};
