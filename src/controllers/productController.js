import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Seller from '../models/Seller.js';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import ProductAttribute from '../models/ProductAttribute.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';
import Order from '../models/Order.js';
import { syncProductTaxonomy, syncAllTaxonomies } from '../utils/taxonomySync.js';


const attachStoreBadges = async (products) => {
  if (!products || products.length === 0) return products;
  const isArray = Array.isArray(products);
  const productList = isArray ? products : [products];
  const sellerIds = [...new Set(productList.map(p => {
    let sid = p.sellerId || (p.seller && p.seller._id);
    if (sid && sid._id) sid = sid._id;
    return sid ? sid.toString() : null;
  }).filter(Boolean))];
  if (sellerIds.length === 0) return products;
  
  const sellers = await Seller.find({ _id: { $in: sellerIds } }).lean();
  const sellerMap = {};
  
  sellers.forEach(seller => {
    const adminBadges = seller.assignedBadges ? seller.assignedBadges.filter(b => b.isActive).map(b => ({ label: b.label, icon: b.icon, source: 'admin' })) : [];
    sellerMap[seller._id.toString()] = adminBadges.slice(0, 1);
  });
  
  return isArray ? productList.map(p => {
    const pObj = typeof p.toObject === 'function' ? p.toObject() : { ...p };
    let sid = pObj.sellerId || (pObj.seller && pObj.seller._id);
    if (sid && sid._id) sid = sid._id;
    if (sid && sellerMap[sid.toString()]) { 
      if (!pObj.seller) pObj.seller = {}; 
      pObj.seller.badges = sellerMap[sid.toString()]; 
    }
    return pObj;
  }) : (() => {
    const pObj = typeof products.toObject === 'function' ? products.toObject() : { ...products };
    let sid = pObj.sellerId || (pObj.seller && pObj.seller._id);
    if (sid && sid._id) sid = sid._id;
    if (sid && sellerMap[sid.toString()]) { 
      if (!pObj.seller) pObj.seller = {}; 
      pObj.seller.badges = sellerMap[sid.toString()]; 
    }
    return pObj;
  })();
};

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getProducts = asyncHandler(async (req, res) => {
  const { category, subcategory, brand, status, inStock, search, sort, page: reqPage, limit: reqLimit } = req.query;

  const queryFilter = {};
  const andList = [];

  // Base visibility rules for public storefront
  if (req.query.visibility !== 'all') {
    queryFilter.isPublished = true;
    if (status && status.toLowerCase() === 'active') {
      queryFilter.status = { $in: ['Approved', 'Active', 'Published'] };
    } else if (status) {
      queryFilter.status = status;
    } else {
      queryFilter.status = { $in: ['Approved', 'Active', 'Published'] };
    }
  } else {
    // Admin / internal view: show all but respect explicit status filter
    if (status && status.toLowerCase() === 'active') {
      queryFilter.status = { $in: ['Approved', 'Active', 'Published'] };
    } else if (status && status !== 'all') {
      queryFilter.status = status;
    }
  }

  // Source filtering (Admin/Seller isolation)
  if (req.query.source) {
    queryFilter.source = req.query.source;
  }

  // Stock filtering
  if (inStock === 'true') {
    queryFilter.stock = { $gt: 0 };
  }

  // Category filtering
  if (category && category.trim() !== '') {
    const normCat = category.toLowerCase().replace(/-/g, ' ');
    const catDoc = await Category.findOne({ $or: [{ slug: category.toLowerCase() }, { name: { $regex: new RegExp(`^${normCat}$`, 'i') } }] });
    const catConditions = [
      { category: { $regex: new RegExp(`^${category}$`, 'i') } },
      { category: { $regex: new RegExp(normCat, 'i') } }
    ];
    if (mongoose.Types.ObjectId.isValid(category) && String(category).length === 24) {
      catConditions.push({ categoryId: category });
    }
    if (catDoc) {
      catConditions.push({ categoryId: catDoc._id }, { category: catDoc.name });
    }
    andList.push({ $or: catConditions });
  }

  // Subcategory filtering
  const sub = subcategory || req.query.subCategory;
  if (sub && sub.trim() !== '') {
    const normSub = sub.toLowerCase().replace(/-/g, ' ');
    const subDoc = await SubCategory.findOne({ $or: [{ slug: sub.toLowerCase() }, { name: { $regex: new RegExp(`^${normSub}$`, 'i') } }] });
    const subConditions = [
      { subCategory: { $regex: new RegExp(`^${sub}$`, 'i') } },
      { subCategory: { $regex: new RegExp(normSub, 'i') } }
    ];
    if (mongoose.Types.ObjectId.isValid(sub) && String(sub).length === 24) {
      subConditions.push({ subCategoryId: sub });
    }
    if (subDoc) {
      subConditions.push({ subCategoryId: subDoc._id }, { subCategory: subDoc.name });
    }
    andList.push({ $or: subConditions });
  }

  // Brand filtering
  if (brand && brand.trim() !== '') {
    const brandClean = brand.toLowerCase().replace(/-/g, ' ');
    const brandDoc = await Brand.findOne({ $or: [{ slug: brand.toLowerCase() }, { name: { $regex: new RegExp(`^${brandClean}$`, 'i') } }] });
    const brandConditions = [
      { brand: { $regex: new RegExp(`^${brand}$`, 'i') } },
      { brand: { $regex: new RegExp(brandClean, 'i') } }
    ];
    if (mongoose.Types.ObjectId.isValid(brand) && String(brand).length === 24) {
      brandConditions.push({ brandId: brand });
    }
    if (brandDoc) {
      brandConditions.push({ brandId: brandDoc._id }, { brand: brandDoc.name });
    }
    andList.push({ $or: brandConditions });
  }

  // Search query filtering
  if (search) {
    const tokens = search.split(' ').filter(t => t.trim().length > 0);
    const andConditions = tokens.map(token => {
      const searchRegex = new RegExp(token, 'i');
      return {
        $or: [
          { name: searchRegex },
          { category: searchRegex },
          { subCategory: searchRegex },
          { sku: searchRegex },
          { tags: searchRegex },
          { searchKeywords: searchRegex },
          { highlights: searchRegex }
        ]
      };
    });
    andList.push(...andConditions);
  }

  if (andList.length > 0) {
    queryFilter.$and = andList;
  }

  let query = Product.find(queryFilter).populate('brandId', 'name slug logo');

  // Sorting
  if (sort) {
    const sortBy = sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = reqPage * 1 || 1;
  const limit = reqLimit * 1 || 20;
  const skip = (page - 1) * limit;
  
  query = query.skip(skip).limit(limit);

  const products = await query;
  const total = await Product.countDocuments(queryFilter);

  res.json({ success: true, count: products.length, total, page, pages: Math.ceil(total / limit), data: await attachStoreBadges(products) });
});

// @desc    Fetch single product by slug (Optimized for PDP)
// @route   GET /api/products/:slug
// @access  Public
export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate('sellerId', 'storeName storeSlug logo storeRating followers responseTime isOfficial')
    .populate('brand', 'name slug logo')
    .lean();

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Ensure product.seller contains slug for frontend
  if (product.sellerId) {
    product.seller = {
      _id: product.sellerId._id,
      name: product.sellerId.storeName,
      logo: product.sellerId.logo,
      rating: product.sellerId.storeRating || 4.5,
      followers: product.sellerId.followers,
      responseTime: product.sellerId.responseTime,
      isOfficial: product.sellerId.isOfficial,
      slug: product.sellerId.storeSlug,
    };
  }

  // 1. Fetch Product Attributes (Specifications)
  let productSpecs = Array.isArray(product.specifications) ? [...product.specifications] : [];

  // Fallback to ProductAttribute collection if the document doesn't have specifications (legacy support)
  if (productSpecs.length === 0) {
    const productAttributes = await ProductAttribute.find({ productId: product._id })
      .populate({
        path: 'attributeId',
        select: 'name attributeGroup code visibleOnProduct usedForVariant sortOrder',
        match: { visibleOnProduct: true }
      })
      .populate('attributeValueId', 'value label colorCode')
      .lean();

    const validAttributes = productAttributes.filter(pa => pa.attributeId != null);
    
    // Group by attributeGroup
    const groupedSpecsObj = validAttributes.reduce((acc, pa) => {
      const group = pa.attributeId.attributeGroup || 'General';
      if (!acc[group]) acc[group] = [];
      acc[group].push({
        name: pa.attributeId.name,
        value: pa.attributeValueId ? pa.attributeValueId.label : pa.customValue,
        sortOrder: pa.attributeId.sortOrder || 0
      });
      return acc;
    }, {});

    Object.keys(groupedSpecsObj).forEach(group => {
      groupedSpecsObj[group].sort((a, b) => a.sortOrder - b.sortOrder);
      productSpecs.push({
        section: group,
        specs: groupedSpecsObj[group].map(s => ({ name: s.name, value: s.value }))
      });
    });
  }

  // Create highlights (first 6 attributes)
  let highlights = Array.isArray(product.highlights) && product.highlights.length > 0 
    ? product.highlights.map(h => (typeof h === 'string' ? { name: '', value: h } : h)) 
    : [];

  if (highlights.length === 0 && productSpecs.length > 0) {
    const allSpecs = productSpecs.flatMap(g => g.specs || []);
    highlights = allSpecs.slice(0, 6).map(s => ({
      name: s.name,
      value: s.value
    }));
  }

  // 2. Fetch Related Products
  let relatedProducts = [];
  if (product.subCategory) {
    relatedProducts = await Product.find({ 
      subCategory: product.subCategory,
      _id: { $ne: product._id }
    })
    .select('name slug price oldPrice discount image rating reviews stock isNewArrival')
    .limit(8)
    .lean();
  }

  // 3. Resolve Category/SubCategory names
  let categoryData = null;
  let subCategoryData = null;
  if (product.category && product.category.match(/^[0-9a-fA-F]{24}$/)) {
    categoryData = await Category.findById(product.category).select('name slug').lean();
  }
  if (product.subCategory && product.subCategory.match(/^[0-9a-fA-F]{24}$/)) {
    subCategoryData = await SubCategory.findById(product.subCategory).select('name slug').lean();
  }

  res.json({
    success: true,
    data: await attachStoreBadges({
      ...product,
      categoryData: categoryData || { name: product.category },
      subCategoryData: subCategoryData || { name: product.subCategory },
      specifications: productSpecs,
      highlights,
      relatedProducts
    })
  });
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = asyncHandler(async (req, res) => {
  // Strip out any ownership fields sent by the frontend
  delete req.body.source;
  delete req.body.sellerId;
  delete req.body.createdBy;
  delete req.body.createdByRole;
  
  let productData = { ...req.body };

  // Determine ownership based on authenticated user
  if (req.user && req.user.role === 'Seller') {
    const mongoose = (await import('mongoose')).default;
    const Seller = mongoose.model('Seller');
    const sellerProfile = await Seller.findOne({ user: req.user.id });
    
    if (!sellerProfile) {
      res.status(403);
      throw new Error('Seller profile not found. Cannot create product.');
    }
    
    productData.source = 'SELLER';
    productData.createdByRole = 'Seller';
    productData.createdBy = req.user.id;
    productData.sellerId = sellerProfile._id;
    productData.seller = {
      _id: sellerProfile._id,
      slug: sellerProfile.storeSlug,
      name: sellerProfile.storeName || sellerProfile.businessName,
      logo: sellerProfile.storeLogo,
      rating: sellerProfile.storeRating || 4.5,
      followers: sellerProfile.followers || 0,
      responseTime: "1 Hour",
      official: false
    };

    // Force strict status for Sellers - auto publish per new workflow
    productData.status = 'Published'; 
    productData.isPublished = true;
    productData.visibility = 'Visible';
  } else if (req.user && (req.user.role === 'Admin' || req.user.role === 'Super Admin')) {
    productData.source = 'ADMIN';
    productData.createdByRole = req.user.role;
    productData.createdBy = req.user.id;
    productData.sellerId = null;

    // Default status for Admins
    productData.status = req.body.status || 'Published'; // Allow admin to choose draft/published
    productData.isPublished = productData.status === 'Published' || productData.status === 'Active';
    productData.visibility = req.body.visibility || 'Visible';
  } else {
    res.status(401);
    throw new Error('Not authorized to create products');
  }

  // Prevent injection of other restricted fields (stats)
  productData.isFeatured = false;
  productData.isTrending = false;
  productData.isFlashSale = false;
  productData.isNewArrival = true;
  productData.isBestSeller = false;
  productData.isAiRecommended = false;
  productData.rating = 0;
  productData.reviews = 0;
  productData.viewCount = 0;
  productData.sold = 0;

  const product = new Product(productData);
  await syncProductTaxonomy(product);
  const createdProduct = await product.save();
  syncAllTaxonomies().catch(e => console.error(e));
  res.status(201).json({ success: true, data: createdProduct });
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    // Strip ownership fields from update to prevent manipulation
    delete req.body.source;
    delete req.body.sellerId;
    delete req.body.createdBy;
    delete req.body.createdByRole;

    if (req.user && req.user.role === 'Seller') {
      const mongoose = (await import('mongoose')).default;
      const Seller = mongoose.model('Seller');
      const sellerProfile = await Seller.findOne({ user: req.user.id });
      
      if (!sellerProfile || !product.sellerId || product.sellerId.toString() !== sellerProfile._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this product');
      }
      
      // Product updates are also auto-published
      req.body.status = 'Published';
      req.body.isPublished = true;
      // Clear rejection reason if they fixed it
      req.body.rejectionReason = '';

      // Refresh seller info in case it changed
      req.body.seller = {
        ...product.seller,
        _id: sellerProfile._id,
        slug: sellerProfile.storeSlug,
        name: sellerProfile.storeName || sellerProfile.businessName,
        logo: sellerProfile.storeLogo,
      };
    } else if (req.user && (req.user.role === 'Admin' || req.user.role === 'Super Admin')) {
      // Admins can update any product, including status and rejection reason
      if (req.body.status === 'Approved' || req.body.status === 'Published' || req.body.status === 'Active') {
         req.body.isPublished = true;
      } else if (req.body.status === 'Rejected' || req.body.status === 'Suspended') {
         req.body.isPublished = false;
      }
    } else {
      res.status(401);
      throw new Error('Not authorized to update products');
    }

    Object.assign(product, req.body);
    await syncProductTaxonomy(product);
    const updatedProduct = await product.save();
    syncAllTaxonomies().catch(e => console.error(e));
    res.json({ success: true, data: updatedProduct });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await product.deleteOne();
    res.json({ success: true, message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// Added Recommendation Controllers

export const getRelatedProducts = asyncHandler(async (req, res) => {
  const { category, subCategory, currentProductId } = req.query;
  const products = await Product.find({
    ...(subCategory ? { subCategory } : category ? { category } : {}),
    _id: { $ne: currentProductId }
  }).select('name slug price oldPrice discount image rating reviews stock isNewArrival').limit(10).lean();
  res.json({ success: true, data: await attachStoreBadges(products) });
});

export const getSimilarProducts = asyncHandler(async (req, res) => {
  // Mock logic: return products in same category for now
  const { category, currentProductId } = req.query;
  const products = await Product.find({ category, _id: { $ne: currentProductId } })
    .select('name slug price oldPrice discount image rating reviews stock isNewArrival seller sellerId').limit(10).lean();
  res.json({ success: true, data: await attachStoreBadges(products) });
});

export const getTrendingProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: { $in: ['Approved', 'Active', 'Published'] }, isPublished: true, stock: { $gt: 0 } })
    .sort('-viewCount -sold')
    .select('name slug price oldPrice discount image rating reviews stock freeShipping isNewArrival brand estimatedDelivery sold isOfficialStore seller sellerId').limit(10).lean();
  res.json({ success: true, data: await attachStoreBadges(products) });
});

export const getBestSellers = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: { $in: ['Approved', 'Active', 'Published'] }, isPublished: true, stock: { $gt: 0 } })
    .sort('-sold')
    .select('name slug price oldPrice discount image rating reviews stock freeShipping isNewArrival brand estimatedDelivery sold isOfficialStore seller sellerId').limit(10).lean();
  res.json({ success: true, data: await attachStoreBadges(products) });
});

export const getNewArrivals = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: { $in: ['Approved', 'Active', 'Published'] }, isPublished: true, stock: { $gt: 0 } })
    .sort('-createdAt')
    .select('name slug price oldPrice discount image rating reviews stock freeShipping isNewArrival brand estimatedDelivery sold isOfficialStore seller sellerId').limit(10).lean();
  res.json({ success: true, data: await attachStoreBadges(products) });
});

export const getFlashSaleProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFlashSale: true, status: { $in: ['Approved', 'Active', 'Published'] }, isPublished: true, stock: { $gt: 0 } })
    .select('name slug price oldPrice discount image rating reviews stock isNewArrival freeShipping brand estimatedDelivery sold isOfficialStore seller sellerId').limit(10).lean();
  res.json({ success: true, data: await attachStoreBadges(products) });
});

export const getRecentlyViewed = asyncHandler(async (req, res) => {
  // Needs user session/context ideally, mock for now
  const products = await Product.find({ status: { $in: ['Approved', 'Active', 'Published'] }, isPublished: true, stock: { $gt: 0 } }).sort('-updatedAt').limit(10)
    .select('name slug price oldPrice discount image rating reviews stock isNewArrival freeShipping brand estimatedDelivery sold isOfficialStore seller sellerId').lean();
  res.json({ success: true, data: await attachStoreBadges(products) });
});

export const getFrequentlyBought = asyncHandler(async (req, res) => {
  // Mock implementation
  const products = await Product.find({ status: { $in: ['Approved', 'Active', 'Published'] }, isPublished: true, stock: { $gt: 0 } }).limit(5)
    .select('name slug price oldPrice discount image rating reviews stock isNewArrival freeShipping brand estimatedDelivery sold isOfficialStore seller sellerId').lean();
  res.json({ success: true, data: await attachStoreBadges(products) });
});

export const getProductsBySeller = asyncHandler(async (req, res) => {
  const products = await Product.find({ sellerId: req.params.sellerId, _id: { $ne: req.query.currentProductId } })
    .select('name slug price oldPrice discount image rating reviews stock isNewArrival freeShipping brand estimatedDelivery sold isOfficialStore seller sellerId').limit(10).lean();
  res.json({ success: true, data: await attachStoreBadges(products) });
});

export const getAiRecommended = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const { viewedIds } = req.query; // Expecting comma-separated IDs

  // Basic filters for valid products
  const productFilter = {
    status: { $in: ['Approved', 'Active', 'Published'] },
    isPublished: true,
    stock: { $gt: 0 }
  };

  const productScores = {};
  const categoriesToFetch = new Set();
  
  // Helper to process products for categories and scores
  const processInteractions = async (productIds, scoreBoost) => {
    if (!productIds || productIds.length === 0) return;
    const products = await Product.find({ _id: { $in: productIds } }).select('category subCategory').lean();
    products.forEach(p => {
      if (p.category) categoriesToFetch.add(p.category);
      // We don't score the exact items here, we score the categories they belong to
    });
    return products;
  };

  let userInteractedCategories = {}; // { categoryName: score }

  const addCategoryScore = (category, score) => {
    if (!category) return;
    userInteractedCategories[category] = (userInteractedCategories[category] || 0) + score;
  };

  // 1. Browsing History (from frontend)
  if (viewedIds) {
    const idsArray = viewedIds.split(',').filter(id => mongoose.Types.ObjectId.isValid(id));
    const viewedProducts = await Product.find({ _id: { $in: idsArray } }).select('category _id').lean();
    viewedProducts.forEach(p => {
      addCategoryScore(p.category, 40); // Priority 1
      categoriesToFetch.add(p.category);
    });
  }

  // If logged in, fetch DB history
  if (userId) {
    // 2. Wishlist
    const wishlisted = await Wishlist.find({ userId }).select('productId').lean();
    const wishProductIds = wishlisted.map(w => w.productId);
    const wishProducts = await Product.find({ _id: { $in: wishProductIds } }).select('category').lean();
    wishProducts.forEach(p => {
      addCategoryScore(p.category, 25);
      categoriesToFetch.add(p.category);
    });

    // 3. Cart
    const cart = await Cart.findOne({ userId }).select('products.productId').lean();
    if (cart && cart.products) {
      const cartProductIds = cart.products.map(p => p.productId);
      const cartProducts = await Product.find({ _id: { $in: cartProductIds } }).select('category').lean();
      cartProducts.forEach(p => {
        addCategoryScore(p.category, 20);
        categoriesToFetch.add(p.category);
      });
    }

    // 4. Orders
    const orders = await Order.find({ user: userId }).select('orderItems.product').lean();
    const orderProductIds = [];
    orders.forEach(o => {
      if (o.orderItems) {
        o.orderItems.forEach(item => orderProductIds.push(item.product));
      }
    });
    if (orderProductIds.length > 0) {
      const orderedProducts = await Product.find({ _id: { $in: orderProductIds } }).select('category').lean();
      orderedProducts.forEach(p => {
        addCategoryScore(p.category, 15);
        categoriesToFetch.add(p.category);
      });
    }
  }

  let finalProducts = [];

  // If we have some user history, fetch products from those categories
  if (categoriesToFetch.size > 0) {
    const candidateProducts = await Product.find({
      ...productFilter,
      category: { $in: Array.from(categoriesToFetch) }
    }).select('name slug price oldPrice discount image rating reviews stock freeShipping isNewArrival brand estimatedDelivery sold isOfficialStore seller sellerId category subCategory createdAt viewCount').lean();

    // Score them
    const scoredCandidates = candidateProducts.map(p => {
      let score = 0;
      
      // Category match
      if (p.category && userInteractedCategories[p.category]) {
        score += userInteractedCategories[p.category];
      }

      // High sales
      if (p.sold && p.sold > 50) score += 10;
      
      // High rating
      if (p.rating && p.rating >= 4.5) score += 10;
      
      // Recently added (within last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (p.createdAt && new Date(p.createdAt) > thirtyDaysAgo) {
        score += 5;
      }

      return { product: p, score };
    });

    // Sort by score
    scoredCandidates.sort((a, b) => b.score - a.score);
    finalProducts = await attachStoreBadges(scoredCandidates.map(c => c.product).slice(0, 10));
  }

  // 5. Fallback if not enough products (or guest user with no viewed history)
  if (finalProducts.length < 10) {
    const existingIds = finalProducts.map(p => p._id.toString());
    const fallbackProducts = await Product.find({
      ...productFilter,
      _id: { $nin: existingIds }
    })
      .sort('-sold -rating') // Popularity sorting
      .select('name slug price oldPrice discount image rating reviews stock freeShipping isNewArrival brand estimatedDelivery sold isOfficialStore seller sellerId category subCategory createdAt viewCount')
      .limit(10 - finalProducts.length)
      .lean();

    finalProducts = await attachStoreBadges([...finalProducts, ...fallbackProducts]);
  }

  res.json({ success: true, count: finalProducts.length, data: finalProducts });
});

export const getTodaysDeals = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: { $in: ['Approved', 'Active', 'Published'] }, isPublished: true, isDeal: true, stock: { $gt: 0 } })
    .select('name slug price oldPrice discount image rating reviews stock freeShipping isNewArrival brand estimatedDelivery sold isOfficialStore seller sellerId').limit(10).lean();
  res.json({ success: true, data: await attachStoreBadges(products) });
});

export const getYouMayLike = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: { $in: ['Approved', 'Active', 'Published'] }, isPublished: true, stock: { $gt: 0 } }).skip(Math.floor(Math.random() * 5)).limit(10)
    .select('name slug price oldPrice discount image rating reviews stock isNewArrival freeShipping brand estimatedDelivery sold isOfficialStore seller sellerId').lean();
  res.json({ success: true, data: await attachStoreBadges(products) });
});

export const getCustomersAlsoBought = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: { $in: ['Approved', 'Active', 'Published'] }, isPublished: true, stock: { $gt: 0 } }).skip(Math.floor(Math.random() * 5)).limit(10)
    .select('name slug price oldPrice discount image rating reviews stock isNewArrival freeShipping brand estimatedDelivery sold isOfficialStore seller sellerId').lean();
  res.json({ success: true, data: await attachStoreBadges(products) });
});

export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true, status: { $in: ['Approved', 'Active', 'Published'] }, isPublished: true, stock: { $gt: 0 } })
    .select('name slug price oldPrice discount image rating reviews stock isFeatured isNewArrival freeShipping brand estimatedDelivery sold isOfficialStore seller sellerId').limit(15).lean();
  res.json({ success: true, count: products.length, data: await attachStoreBadges(products) });
});


