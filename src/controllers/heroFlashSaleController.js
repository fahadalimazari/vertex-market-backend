import asyncHandler from 'express-async-handler';
import HeroFlashSale from '../models/HeroFlashSale.js';
import Product from '../models/Product.js';

// @route   GET /api/v1/home/flash-sale or /api/home/flash-sale
// @access  Public
export const getHomeFlashSale = asyncHandler(async (req, res) => {
  const now = new Date();
  
  const flashSale = await HeroFlashSale.findOne({
    status: 'Active',
    saleStartDate: { $lte: now },
    saleEndDate: { $gte: now },
  })
    .sort({ displayPriority: -1, createdAt: -1 })
    .populate('productId', 'name slug image brand price sku discount');

  if (flashSale) {
    // Increment view analytics without triggering full schema validation checks
    flashSale.viewCount += 1;
    await flashSale.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      data: flashSale,
    });
  } else {
    res.status(200).json({
      success: true,
      data: null,
      message: 'No active hero flash sale available at this moment.',
    });
  }
});

// @route   GET /api/v1/flash-sales or /api/flash-sales
// @access  Private/Admin
export const getAllFlashSales = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const query = {};

  if (status && status !== 'All') {
    query.status = status;
  }

  if (search) {
    query.saleName = { $regex: search, $options: 'i' };
  }

  const flashSales = await HeroFlashSale.find(query)
    .sort({ displayPriority: -1, createdAt: -1 })
    .populate('productId', 'name slug image brand price sku');

  res.status(200).json({
    success: true,
    count: flashSales.length,
    data: flashSales,
  });
});

// @route   GET /api/v1/flash-sales/:id
// @access  Private/Admin
export const getFlashSaleById = asyncHandler(async (req, res) => {
  const flashSale = await HeroFlashSale.findById(req.params.id)
    .populate('productId', 'name slug image brand price sku');

  if (!flashSale) {
    res.status(404);
    throw new Error('Flash sale campaign not found');
  }

  res.status(200).json({
    success: true,
    data: flashSale,
  });
});

// @route   POST /api/v1/flash-sales
// @access  Private/Admin
export const createFlashSale = asyncHandler(async (req, res) => {
  const {
    saleName,
    productId,
    badge,
    salePrice,
    originalPrice,
    discountType,
    discountValue,
    displayPriority,
    buttonText,
    buttonUrl,
    status,
    saleStartDate,
    saleEndDate,
  } = req.body;

  if (!saleName || !productId || salePrice === undefined || originalPrice === undefined || !saleStartDate || !saleEndDate) {
    res.status(400);
    throw new Error('Please provide all required flash sale configuration fields.');
  }

  const productExists = await Product.findById(productId);
  if (!productExists) {
    res.status(404);
    throw new Error('Selected linked product does not exist in inventory.');
  }

  // Calculate discount percentage or value if not passed
  let calcDiscountValue = discountValue;
  if (!calcDiscountValue && originalPrice > salePrice) {
    if (discountType === 'Fixed Amount') {
      calcDiscountValue = originalPrice - salePrice;
    } else {
      calcDiscountValue = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
    }
  }

  const flashSale = await HeroFlashSale.create({
    saleName,
    productId,
    badge: badge || 'Flash Sale',
    salePrice,
    originalPrice,
    discountType: discountType || 'Percentage',
    discountValue: calcDiscountValue || 0,
    displayPriority: displayPriority || 1,
    buttonText: buttonText || 'Shop Now',
    buttonUrl: buttonUrl || `/product/${productExists.slug}`,
    status: status || 'Active',
    saleStartDate: new Date(saleStartDate),
    saleEndDate: new Date(saleEndDate),
  });

  const populatedSale = await HeroFlashSale.findById(flashSale._id).populate('productId', 'name slug image brand price sku');

  res.status(201).json({
    success: true,
    message: 'Hero Flash Sale created successfully.',
    data: populatedSale,
  });
});

// @route   PUT /api/v1/flash-sales/:id
// @access  Private/Admin
export const updateFlashSale = asyncHandler(async (req, res) => {
  let flashSale = await HeroFlashSale.findById(req.params.id);

  if (!flashSale) {
    res.status(404);
    throw new Error('Flash sale campaign not found');
  }

  const updatedSale = await HeroFlashSale.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).populate('productId', 'name slug image brand price sku');

  res.status(200).json({
    success: true,
    message: 'Hero Flash Sale updated successfully.',
    data: updatedSale,
  });
});

// @route   DELETE /api/v1/flash-sales/:id
// @access  Private/Admin
export const deleteFlashSale = asyncHandler(async (req, res) => {
  const flashSale = await HeroFlashSale.findById(req.params.id);

  if (!flashSale) {
    res.status(404);
    throw new Error('Flash sale campaign not found');
  }

  await flashSale.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Hero Flash Sale removed successfully.',
    id: req.params.id,
  });
});

// @route   PATCH /api/v1/flash-sales/:id/status
// @access  Private/Admin
export const updateFlashSaleStatus = asyncHandler(async (req, res) => {
  const flashSale = await HeroFlashSale.findById(req.params.id);

  if (!flashSale) {
    res.status(404);
    throw new Error('Flash sale campaign not found');
  }

  flashSale.status = req.body.status || (flashSale.status === 'Active' ? 'Inactive' : 'Active');
  await flashSale.save();

  res.status(200).json({
    success: true,
    message: `Hero Flash Sale status updated to ${flashSale.status}.`,
    data: flashSale,
  });
});

// @route   POST /api/v1/flash-sales/:id/track
// @access  Public
export const trackFlashSaleEvent = asyncHandler(async (req, res) => {
  const { event } = req.body;
  const flashSale = await HeroFlashSale.findById(req.params.id);

  if (!flashSale) {
    res.status(404);
    throw new Error('Flash sale campaign not found');
  }

  if (event === 'click' || event === 'card_click') {
    flashSale.clickCount += 1;
  } else if (event === 'cta_click') {
    flashSale.ctaClickCount += 1;
  } else if (event === 'product_click') {
    flashSale.productClickCount += 1;
  } else if (event === 'conversion') {
    flashSale.conversionCount += 1;
  } else if (event === 'view') {
    flashSale.viewCount += 1;
  }

  await flashSale.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: `Event '${event}' logged for flash sale analytics.`,
  });
});
