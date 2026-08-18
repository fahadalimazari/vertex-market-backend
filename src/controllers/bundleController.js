import asyncHandler from 'express-async-handler';
import Bundle from '../models/Bundle.js';
import Product from '../models/Product.js';

// @desc    Get all active bundles
// @route   GET /api/v1/bundles
// @access  Public
export const getBundles = asyncHandler(async (req, res) => {
  const bundles = await Bundle.find({ status: 'Active' })
    .populate({
      path: 'products',
      select: 'name slug price oldPrice images stock isBestSeller isTrending isNewArrival discount'
    });

  res.status(200).json({ success: true, count: bundles.length, data: bundles });
});

// @desc    Get single bundle by slug or ID
// @route   GET /api/v1/bundles/:id
// @access  Public
export const getBundle = asyncHandler(async (req, res) => {
  const param = req.params.id;
  
  let query = { slug: param, status: 'Active' };
  if (param.match(/^[0-9a-fA-F]{24}$/)) {
    query = { _id: param, status: 'Active' };
  }

  const bundle = await Bundle.findOne(query).populate('products');

  if (!bundle) {
    res.status(404);
    throw new Error('Bundle not found');
  }

  // Check inventory for the bundle
  const minStock = Math.min(...bundle.products.map(p => p.stock || 0));
  const available = minStock > 0;

  const bundleObj = bundle.toObject();
  bundleObj.availableStock = minStock;
  bundleObj.isAvailable = available;

  res.status(200).json({ success: true, data: bundleObj });
});

// @desc    Get all bundles (Admin)
// @route   GET /api/v1/bundles/admin
// @access  Private/Admin
export const getBundlesAdmin = asyncHandler(async (req, res) => {
  const bundles = await Bundle.find({}).populate('products', 'name price');
  res.status(200).json({ success: true, count: bundles.length, data: bundles });
});

// @desc    Create bundle
// @route   POST /api/v1/bundles
// @access  Private/Admin
export const createBundle = asyncHandler(async (req, res) => {
  const { name, slug, description, image, status, products, discountPercentage, fixedPrice, startDate, endDate } = req.body;

  const bundleExists = await Bundle.findOne({ $or: [{ name }, { slug }] });

  if (bundleExists) {
    res.status(400);
    throw new Error('Bundle with this name or slug already exists');
  }

  const bundle = await Bundle.create({
    name,
    slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    description,
    image,
    status,
    products,
    discountPercentage,
    fixedPrice,
    startDate,
    endDate
  });

  res.status(201).json({ success: true, data: bundle });
});

// @desc    Update bundle
// @route   PUT /api/v1/bundles/:id
// @access  Private/Admin
export const updateBundle = asyncHandler(async (req, res) => {
  const bundle = await Bundle.findById(req.params.id);

  if (!bundle) {
    res.status(404);
    throw new Error('Bundle not found');
  }

  const updatedBundle = await Bundle.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: updatedBundle });
});

// @desc    Delete bundle
// @route   DELETE /api/v1/bundles/:id
// @access  Private/Admin
export const deleteBundle = asyncHandler(async (req, res) => {
  const bundle = await Bundle.findById(req.params.id);

  if (!bundle) {
    res.status(404);
    throw new Error('Bundle not found');
  }

  await bundle.deleteOne();
  res.status(200).json({ success: true, data: {} });
});
