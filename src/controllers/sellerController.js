import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Coupon from '../models/Coupon.js';
import Staff from '../models/Staff.js';
import Seller from '../models/Seller.js';
import StoreFollower from '../models/StoreFollower.js';
import Notification from '../models/Notification.js';
import { calculateStoreBadges } from '../services/storeBadgeService.js';

/**
 * @desc    Get seller dashboard statistics
 * @route   GET /api/v1/seller/dashboard
 * @access  Private/Seller
 */
export const getSellerDashboardStats = async (req, res, next) => {
  try {
    const sellerId = req.seller._id; // Set by requireActiveSeller middleware

    // Get all products for this seller
    const products = await Product.find({ 'sellerId': sellerId });
    const productIds = products.map(p => p._id);

    // Get all orders containing items that belong to this seller
    const orders = await Order.find({ 'orderItems.sellerId': sellerId });

    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.stock > 0).length;
    
    // Calculate total revenue and order stats based on seller's portion
    let totalRevenue = 0;
    let totalOrders = orders.length;
    let pendingOrders = 0;
    let completedOrders = 0;
    
    orders.forEach(order => {
      let isSellerOrderPending = false;
      let isSellerOrderCompleted = false;

      order.orderItems.forEach(item => {
        if (item.sellerId && item.sellerId.equals(sellerId)) {
          totalRevenue += (item.price * item.quantity);
          if (order.status === 'Pending' || order.status === 'Processing') isSellerOrderPending = true;
          if (order.status === 'Delivered') isSellerOrderCompleted = true;
        }
      });

      if (isSellerOrderPending) pendingOrders++;
      if (isSellerOrderCompleted) completedOrders++;
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalProducts,
        activeProducts,
        // Mock data for graphs if needed
        salesData: [
          { name: 'Mon', sales: 4000 },
          { name: 'Tue', sales: 3000 },
          { name: 'Wed', sales: 2000 },
          { name: 'Thu', sales: 2780 },
          { name: 'Fri', sales: 1890 },
          { name: 'Sat', sales: 2390 },
          { name: 'Sun', sales: 3490 },
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all products for the authenticated seller
 * @route   GET /api/v1/seller/products
 * @access  Private/Seller
 */
export const getSellerProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ 'sellerId': req.seller._id }).sort('-createdAt');
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all orders for the authenticated seller
 * @route   GET /api/v1/seller/orders
 * @access  Private/Seller
 */
export const getSellerOrders = async (req, res, next) => {
  try {
    const sellerId = req.seller._id;

    // Find orders containing items that belong to this seller
    const orders = await Order.find({ 'orderItems.sellerId': sellerId })
      .populate('user', 'name email')
      .sort('-createdAt');

    // Filter orderItems to only include this seller's items
    const sellerOrders = orders.map(order => {
      const filteredItems = order.orderItems.filter(item => 
        item.sellerId && item.sellerId.equals(sellerId)
      );
      
      const sellerTotal = filteredItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      
      return {
        _id: order._id,
        user: order.user,
        items: filteredItems,
        sellerTotal,
        status: order.status,
        paymentMethod: order.paymentMethod,
        isPaid: order.isPaid,
        createdAt: order.createdAt
      };
    });

    res.json({
      success: true,
      count: sellerOrders.length,
      data: sellerOrders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get seller profile details
 * @route   GET /api/v1/seller/profile
 * @access  Private/Seller
 */
export const getSellerProfile = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: req.seller
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Product Inventory/Stock
 * @route   PUT /api/v1/seller/inventory/:id
 * @access  Private/Seller
 */
export const updateSellerInventory = async (req, res, next) => {
  try {
    const { stock, lowStockAlert } = req.body;
    
    // STRICT ISOLATION: Ensure product belongs to seller
    const product = await Product.findOne({ _id: req.params.id, sellerId: req.seller._id });
    
    if (!product) {
      res.status(404);
      throw new Error('Product not found or unauthorized');
    }

    if (stock !== undefined) product.stock = stock;
    if (lowStockAlert !== undefined) product.lowStockAlert = lowStockAlert;
    
    await product.save();
    
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Seller Coupons
 * @route   GET /api/v1/seller/coupons
 * @access  Private/Seller
 */
export const getSellerCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({ sellerId: req.seller._id }).sort('-createdAt');
    res.json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create Seller Coupon
 * @route   POST /api/v1/seller/coupons
 * @access  Private/Seller
 */
export const createSellerCoupon = async (req, res, next) => {
  try {
    const couponData = { ...req.body, sellerId: req.seller._id };
    const coupon = await Coupon.create(couponData);
    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Seller Coupon
 * @route   DELETE /api/v1/seller/coupons/:id
 * @access  Private/Seller
 */
export const deleteSellerCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findOneAndDelete({ _id: req.params.id, sellerId: req.seller._id });
    if (!coupon) {
      res.status(404);
      throw new Error('Coupon not found or unauthorized');
    }
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Seller Staff
 * @route   GET /api/v1/seller/staff
 * @access  Private/Seller
 */
export const getSellerStaff = async (req, res, next) => {
  try {
    const staff = await Staff.find({ sellerId: req.seller._id }).sort('-createdAt');
    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create Seller Staff
 * @route   POST /api/v1/seller/staff
 * @access  Private/Seller
 */
export const createSellerStaff = async (req, res, next) => {
  try {
    const staffData = { ...req.body, sellerId: req.seller._id };
    const staff = await Staff.create(staffData);
    res.status(201).json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Seller Staff
 * @route   DELETE /api/v1/seller/staff/:id
 * @access  Private/Seller
 */
export const deleteSellerStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findOneAndDelete({ _id: req.params.id, sellerId: req.seller._id });
    if (!staff) {
      res.status(404);
      throw new Error('Staff not found or unauthorized');
    }
    res.json({ success: true, message: 'Staff removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Seller Theme & Banner
// @route   PUT /api/v1/seller/theme
// @access  Private/Seller
export const updateSellerTheme = async (req, res, next) => {
  try {
    const seller = await Seller.findById(req.seller._id);
    if (!seller) {
      res.status(404);
      throw new Error('Seller profile not found');
    }

    const { storeBanner, storeLogo, brandColor } = req.body;
    let logoChanged = false;

    if (storeBanner !== undefined) seller.storeBanner = storeBanner;
    if (storeLogo !== undefined && storeLogo !== seller.storeLogo) {
      seller.storeLogo = storeLogo;
      logoChanged = true;
    }
    if (brandColor !== undefined) seller.brandColor = brandColor;

    const updatedSeller = await seller.save();

    if (logoChanged) {
      const Product = mongoose.model('Product');
      await Product.updateMany(
        { sellerId: seller._id },
        { $set: { 'seller.logo': storeLogo } }
      );
    }

    res.json({ success: true, data: updatedSeller });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Seller Policies
// @route   PUT /api/v1/seller/policies
// @access  Private/Seller
export const updateSellerPolicies = async (req, res, next) => {
  try {
    const seller = await Seller.findById(req.seller._id);
    if (!seller) {
      res.status(404);
      throw new Error('Seller profile not found');
    }

    const { returnPolicy, shippingPolicy, refundPolicy, termsConditions } = req.body;
    
    if (returnPolicy !== undefined) seller.returnPolicy = returnPolicy;
    if (shippingPolicy !== undefined) seller.shippingPolicy = shippingPolicy;
    if (refundPolicy !== undefined) seller.refundPolicy = refundPolicy;
    if (termsConditions !== undefined) seller.termsConditions = termsConditions;

    const updatedSeller = await seller.save();
    res.json({ success: true, data: updatedSeller });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Seller SEO
// @route   PUT /api/v1/seller/seo
// @access  Private/Seller
export const updateSellerSEO = async (req, res, next) => {
  try {
    const seller = await Seller.findById(req.seller._id);
    if (!seller) {
      res.status(404);
      throw new Error('Seller profile not found');
    }

    const { storeSeoTitle, metaDescription, metaKeywords, openGraphImage } = req.body;

    if (storeSeoTitle !== undefined) seller.storeSeoTitle = storeSeoTitle;
    if (metaDescription !== undefined) seller.metaDescription = metaDescription;
    if (metaKeywords !== undefined) seller.metaKeywords = metaKeywords;
    if (openGraphImage !== undefined) seller.openGraphImage = openGraphImage;

    const updatedSeller = await seller.save();
    res.json({ success: true, data: updatedSeller });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Seller Settings (Profile Info)
// @route   PUT /api/v1/seller/settings
// @access  Private/Seller
export const updateSellerSettings = async (req, res, next) => {
  try {
    const seller = await Seller.findById(req.seller._id);
    if (!seller) {
      res.status(404);
      throw new Error('Seller profile not found');
    }

    const { storeName, storeDescription, contactEmail, contactPhone } = req.body;
    let nameChanged = false;

    if (storeName !== undefined && storeName !== seller.storeName) {
      seller.storeName = storeName;
      nameChanged = true;
    }
    if (storeDescription !== undefined) seller.storeDescription = storeDescription;
    if (contactEmail !== undefined) seller.contactEmail = contactEmail;
    if (contactPhone !== undefined) seller.contactPhone = contactPhone;

    const updatedSeller = await seller.save();

    // If store name changed, update it across all products of this seller
    if (nameChanged) {
      const Product = mongoose.model('Product');
      await Product.updateMany(
        { sellerId: seller._id },
        { $set: { 'seller.name': storeName } }
      );
    }

    res.json({ success: true, data: updatedSeller });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public seller profile by slug
 * @route   GET /api/v1/seller/store/:slug
 * @access  Public
 */
export const getPublicSellerProfile = async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const query = {
      $or: [
        { storeSlug: slug },
        { storeName: slug },
        { businessName: slug }
      ]
    };
    if (isObjectId) {
      query.$or.push({ _id: slug });
    }
    
    const seller = await Seller.findOne(query);
    if (!seller || seller.status !== 'Approved') {
      return res.status(404).json({ success: false, message: 'Seller not found or not active' });
    }
    
    // Check if current user is following (if authenticated)
    let isFollowing = false;
    // We check req.user if the route is optionally protected, but getPublicSellerProfile is public.
    // If the client passes an Authorization header, our middleware might set req.user.
    // Let's just check if req.user exists. Wait, 'getPublicSellerProfile' is completely public, no protect middleware.
    // We will just calculate badges.
    const activeProducts = await Product.countDocuments({ sellerId: seller._id, status: { $in: ['Approved', 'Published', 'Active'] }, isPublished: true, stock: { $gt: 0 } });
    
    // Get admin assigned active badges
    const adminBadges = seller.assignedBadges ? seller.assignedBadges.filter(b => b.isActive).map(b => ({
      _id: b._id,
      label: b.label,
      icon: b.icon,
      source: 'admin'
    })) : [];

    const automaticBadges = [];
    
    if (seller.followers >= 10000 && seller.storeRating >= 4.5 && activeProducts >= 20 && seller.totalSales >= 100) {
      automaticBadges.push({ label: 'Elite Store', icon: 'FaCrown', source: 'automatic' });
    } else if (seller.followers >= 5000 && seller.storeRating >= 4.3 && activeProducts >= 10 && seller.totalSales >= 50) {
      automaticBadges.push({ label: 'Top Store', icon: 'FaTrophy', source: 'automatic' });
    } else if (seller.followers >= 1000) {
      automaticBadges.push({ label: 'Trusted Store', icon: 'FaShieldAlt', source: 'automatic' });
    } else if (seller.followers >= 500) {
      automaticBadges.push({ label: 'Popular Store', icon: 'FaUsers', source: 'automatic' });
    } else if (seller.followers >= 100) {
      automaticBadges.push({ label: 'Rising Store', icon: 'FaSeedling', source: 'automatic' });
    }
    
    if (seller.storeRating >= 4.7) automaticBadges.push({ label: 'Top Rated', icon: 'FaStar', source: 'automatic' });
    if (seller.totalSales >= 200) automaticBadges.push({ label: 'Best Seller', icon: 'FaFire', source: 'automatic' });
    if (seller.isVerified) automaticBadges.push({ label: 'Verified Seller', icon: 'FaCheckCircle', source: 'automatic' });
    
    const daysSinceCreation = (Date.now() - new Date(seller.createdAt).getTime()) / (1000 * 3600 * 24);
    if (daysSinceCreation < 30) automaticBadges.push({ label: 'New Store', icon: 'FaStore', source: 'automatic' });

    const allBadges = [...adminBadges, ...automaticBadges];

    res.json({
      success: true,
      data: {
        _id: seller._id,
        name: seller.storeName || seller.businessName,
        slug: seller.storeSlug,
        logo: seller.storeLogo,
        banner: seller.storeBanner,
        description: seller.storeDescription,
        rating: seller.storeRating || 4.5,
        followers: seller.followers || 0,
        totalSales: seller.totalSales || 0,
        joinedAt: seller.createdAt,
        isOfficial: seller.isOfficial || false,
        badges: allBadges
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all public approved stores/sellers
 * @route   GET /api/v1/seller/stores
 * @access  Public
 */
export const getPublicStores = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const stores = await Seller.aggregate([
      { $match: { status: 'Approved' } },
      
      // Lookup active products
      {
        $lookup: {
          from: 'products',
          let: { sellerId: '$_id' },
          pipeline: [
            { 
              $match: { 
                $expr: { $eq: ['$sellerId', '$$sellerId'] },
                status: { $in: ['Approved', 'Published', 'Active'] },
                isPublished: true
              } 
            },
            { $project: { _id: 1, reviews: 1 } }
          ],
          as: 'activeProducts'
        }
      },
      // Lookup Followers
      {
        $lookup: {
          from: 'storefollowers',
          localField: '_id',
          foreignField: 'storeId',
          as: 'followersData'
        }
      },
      // Lookup Orders (Matching user ID for orders)
      {
        $lookup: {
          from: 'orders',
          localField: 'user',
          foreignField: 'orderItems.sellerId',
          as: 'ordersData'
        }
      },
      
      // Calculate stats dynamically
      {
        $addFields: {
          productCount: { $size: '$activeProducts' },
          totalReviews: { $sum: '$activeProducts.reviews' },
          followersCount: { $size: { $ifNull: ['$followersData', []] } },
          completedOrdersCount: {
            $size: {
              $filter: {
                input: { $ifNull: ['$ordersData', []] },
                as: 'order',
                cond: { $eq: ['$$order.status', 'Delivered'] }
              }
            }
          }
        }
      },
      
      // Calculate ranking score based on real data
      // Weighting: Rating (0-5 * 20 = 100 max base), Reviews (x2), Followers (x1), Products (x5), CompletedOrders (x1)
      {
        $addFields: {
          rankingScore: {
            $add: [
              { $multiply: [{ $ifNull: ['$storeRating', 0] }, 20] },
              { $multiply: ['$totalReviews', 2] },
              { $multiply: ['$followersCount', 1] },
              { $multiply: ['$productCount', 5] },
              { $multiply: ['$completedOrdersCount', 1] }
            ]
          }
        }
      },
      
      // Sort by the calculated score descending
      { $sort: { rankingScore: -1 } },
      
      // Limit to top stores
      { $limit: limit },
      
      // Project required fields
      {
        $project: {
          storeName: 1,
          storeSlug: 1,
          storeLogo: 1,
          storeDescription: 1,
          storeRating: 1,
          followers: '$followersCount', // Output dynamic count as followers
          totalSales: '$completedOrdersCount', // Output dynamic count as totalSales for public
          createdAt: 1,
          status: 1,
          isVerified: 1,
          productCount: 1,
          rankingScore: 1,
          assignedBadges: 1 // Include admin assigned badges
        }
      }
    ]);

    // Calculate Badges on the fly for the response
    const storesWithBadges = stores.map(store => {
      // Get admin assigned active badges
      const adminBadges = store.assignedBadges ? store.assignedBadges.filter(b => b.isActive).map(b => ({
        _id: b._id,
        label: b.label,
        icon: b.icon,
        source: 'admin'
      })) : [];

      const automaticBadges = [];
      
      if (store.followers >= 10000 && store.storeRating >= 4.5 && store.productCount >= 20 && store.totalSales >= 100) {
        automaticBadges.push({ label: 'Elite Store', icon: 'FaCrown', source: 'automatic' });
      } else if (store.followers >= 5000 && store.storeRating >= 4.3 && store.productCount >= 10 && store.totalSales >= 50) {
        automaticBadges.push({ label: 'Top Store', icon: 'FaTrophy', source: 'automatic' });
      } else if (store.followers >= 1000) {
        automaticBadges.push({ label: 'Trusted Store', icon: 'FaShieldAlt', source: 'automatic' });
      } else if (store.followers >= 500) {
        automaticBadges.push({ label: 'Popular Store', icon: 'FaUsers', source: 'automatic' });
      } else if (store.followers >= 100) {
        automaticBadges.push({ label: 'Rising Store', icon: 'FaSeedling', source: 'automatic' });
      }
      
      if (store.storeRating >= 4.7) automaticBadges.push({ label: 'Top Rated', icon: 'FaStar', source: 'automatic' });
      if (store.totalSales >= 200) automaticBadges.push({ label: 'Best Seller', icon: 'FaFire', source: 'automatic' });
      if (store.isVerified) automaticBadges.push({ label: 'Verified Seller', icon: 'FaCheckCircle', source: 'automatic' });
      
      const daysSinceCreation = (Date.now() - new Date(store.createdAt).getTime()) / (1000 * 3600 * 24);
      if (daysSinceCreation < 30) automaticBadges.push({ label: 'New Store', icon: 'FaStore', source: 'automatic' });

      // Priority: Admin Badges > Automatic Badges
      const allBadges = [...adminBadges, ...automaticBadges];

      return {
        _id: store._id,
        storeName: store.storeName,
        storeSlug: store.storeSlug,
        storeLogo: store.storeLogo,
        description: store.storeDescription,
        rating: store.storeRating || 4.5,
        followers: store.followers || 0,
        totalSales: store.totalSales || 0,
        productCount: store.productCount || 0,
        joinedAt: store.createdAt,
        badges: allBadges
      };
    });

    res.json({
      success: true,
      count: storesWithBadges.length,
      data: storesWithBadges
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public seller products by slug
 * @route   GET /api/v1/seller/store/:slug/products
 * @access  Public
 */
export const getPublicSellerProducts = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const query = {
      $or: [
        { storeSlug: slug },
        { storeName: slug },
        { businessName: slug }
      ],
      status: 'Approved'
    };
    if (isObjectId) {
      query.$or.push({ _id: slug });
    }

    const seller = await Seller.findOne(query);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found or not active' });
    }

    // Pagination defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {
      sellerId: seller._id,
      source: 'SELLER',
      status: { $in: ['Approved', 'Published', 'Active'] },
      isPublished: true,
    };

    // Optional filters
    if (req.query.category) filter.category = req.query.category;
    if (req.query.subCategory) filter.subCategory = req.query.subCategory;
    if (req.query.minPrice) filter.price = { ...filter.price, $gte: Number(req.query.minPrice) };
    if (req.query.maxPrice) filter.price = { ...filter.price, $lte: Number(req.query.maxPrice) };
    if (req.query.rating) filter.rating = { $gte: Number(req.query.rating) };
    if (req.query.availability === 'inStock') filter.stock = { $gt: 0 };

    // Sorting
    let sort = '-createdAt';
    if (req.query.sort) {
      const sortMap = {
        newest: '-createdAt',
        priceLow: 'price',
        priceHigh: '-price',
        topRated: '-rating',
        bestSelling: '-sold',
      };
      sort = sortMap[req.query.sort] || sort;
    }

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('name slug price oldPrice discount image rating reviews stock isNewArrival freeShipping brand estimatedDelivery sold isOfficialStore seller')
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit);
    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle Follow Store
 * @route   POST /api/v1/seller/store/:id/follow
 * @access  Private
 */
export const toggleFollowStore = async (req, res, next) => {
  try {
    const storeId = req.params.id;
    const userId = req.user._id;

    const seller = await Seller.findById(storeId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const existingFollow = await StoreFollower.findOne({ user: userId, store: storeId });

    if (existingFollow) {
      // Unfollow
      await StoreFollower.findByIdAndDelete(existingFollow._id);
      seller.followers = Math.max(0, (seller.followers || 1) - 1);
      await seller.save();
      
      return res.json({ success: true, message: 'Store unfollowed successfully', following: false, followers: seller.followers });
    } else {
      // Follow
      await StoreFollower.create({ user: userId, store: storeId });
      seller.followers = (seller.followers || 0) + 1;
      await seller.save();
      
      return res.json({ success: true, message: 'Store followed successfully', following: true, followers: seller.followers });
    }
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error, assume already followed
      return res.status(400).json({ success: false, message: 'You are already following this store' });
    }
    next(error);
  }
};

/**
 * @desc    Update order status by seller
 * @route   PUT /api/v1/seller/orders/:id/status
 * @access  Private/Seller
 */
export const updateSellerOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const sellerId = req.seller._id;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify this order belongs to this seller (at least one item)
    const belongsToSeller = order.orderItems.some(
      item => item.sellerId && item.sellerId.toString() === sellerId.toString()
    );

    if (!belongsToSeller) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
    }

    order.status = status;
    order.trackingInfo.push({
      status: status,
      description: `Order marked as ${status} by seller`,
      date: new Date()
    });

    await order.save();

    // Generate Notification for the customer if order is Approved
    if (status === 'Approved') {
      const estimatedDelivery = order.estimatedDeliveryDate 
        ? new Date(order.estimatedDeliveryDate).toLocaleDateString() 
        : '3-5 days';
        
      await Notification.create({
        userId: order.user,
        title: 'Order Approved',
        message: `Your order #${order.orderNumber || order._id.toString().substring(0, 8)} has been approved by the seller. Your order is now being processed and is expected to arrive in ${estimatedDelivery}.`,
        category: 'orders',
        type: 'orders',
        priority: 'high',
        link: '/account/orders'
      });
    }

    res.json({ success: true, message: `Order updated to ${status}`, data: order });
  } catch (error) {
    next(error);
  }
};
