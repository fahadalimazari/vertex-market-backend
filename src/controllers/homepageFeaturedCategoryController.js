import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import HomepageFeaturedCategory from '../models/HomepageFeaturedCategory.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Seller from '../models/Seller.js';

// Helper to count active products of approved sellers for a category
const getActiveProductCount = async (categoryId) => {
  try {
    const approvedSellers = await Seller.find({ status: 'Approved' }).select('_id');
    const approvedSellerIds = approvedSellers.map(s => s._id);

    return await Product.countDocuments({
      categoryId,
      status: 'Active',
      visibility: 'Visible',
      $or: [
        { sellerId: { $exists: false } },
        { sellerId: null },
        { sellerId: { $in: approvedSellerIds } }
      ]
    });
  } catch (err) {
    console.error('Error counting products:', err);
    return 0;
  }
};

// @route   GET /api/home/featured-categories
// @access  Public
export const getHomeFeaturedCategories = asyncHandler(async (req, res) => {
  const now = new Date();
  
  const featuredList = await HomepageFeaturedCategory.find({
    status: 'Active',
    $and: [
      { $or: [{ startDate: { $exists: false } }, { startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: now } }] }
    ]
  })
    .sort({ displayOrder: 1, createdAt: 1 })
    .populate({
      path: 'categoryId',
      select: 'name slug image bannerImage icon status'
    });

  // Filter out any where categoryId is not populated or Category is inactive
  const validFeatured = featuredList.filter(f => f.categoryId && f.categoryId.status === 'Active');

  // Map and calculate productCount dynamically
  const data = await Promise.all(
    validFeatured.map(async (f) => {
      const cat = f.categoryId;
      const count = await getActiveProductCount(cat._id);
      return {
        _id: f._id,
        categoryId: cat._id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon || 'FiGrid',
        image: f.customImage || cat.image || cat.bannerImage || 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80',
        productCount: count,
        displayOrder: f.displayOrder,
        url: `/categories/${cat.slug}`,
        status: f.status,
        startDate: f.startDate,
        endDate: f.endDate
      };
    })
  );

  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
});

// @route   GET /api/v1/home/featured-categories/all (Admin view)
// @access  Private/Admin
export const getAllFeaturedCategories = asyncHandler(async (req, res) => {
  const list = await HomepageFeaturedCategory.find()
    .sort({ displayOrder: 1, createdAt: -1 })
    .populate('categoryId', 'name slug image bannerImage icon status');

  res.status(200).json({
    success: true,
    count: list.length,
    data: list
  });
});

// @route   POST /api/home/featured-categories
// @access  Private/Admin
export const createFeaturedCategory = asyncHandler(async (req, res) => {
  const { categoryId, customImage, displayOrder, status, startDate, endDate } = req.body;

  if (!categoryId) {
    res.status(400);
    throw new Error('Please select a category to feature.');
  }

  // Check if category exists
  const categoryExists = await Category.findById(categoryId);
  if (!categoryExists) {
    res.status(404);
    throw new Error('Selected Category does not exist.');
  }

  // Prevent duplicates
  const alreadyFeatured = await HomepageFeaturedCategory.findOne({ categoryId });
  if (alreadyFeatured) {
    res.status(400);
    throw new Error('This category is already featured on the homepage.');
  }

  const featuredCategory = await HomepageFeaturedCategory.create({
    categoryId,
    customImage,
    displayOrder: displayOrder || 0,
    status: status || 'Active',
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined
  });

  const populated = await HomepageFeaturedCategory.findById(featuredCategory._id).populate(
    'categoryId',
    'name slug image bannerImage icon status'
  );

  res.status(201).json({
    success: true,
    message: 'Featured category added successfully.',
    data: populated
  });
});

// @route   PUT /api/home/featured-categories/:id
// @access  Private/Admin
export const updateFeaturedCategory = asyncHandler(async (req, res) => {
  const featured = await HomepageFeaturedCategory.findById(req.params.id);

  if (!featured) {
    res.status(404);
    throw new Error('Featured category not found.');
  }

  const { customImage, displayOrder, status, startDate, endDate } = req.body;

  featured.customImage = customImage !== undefined ? customImage : featured.customImage;
  featured.displayOrder = displayOrder !== undefined ? displayOrder : featured.displayOrder;
  featured.status = status !== undefined ? status : featured.status;
  featured.startDate = startDate !== undefined ? (startDate ? new Date(startDate) : null) : featured.startDate;
  featured.endDate = endDate !== undefined ? (endDate ? new Date(endDate) : null) : featured.endDate;

  await featured.save();

  const populated = await HomepageFeaturedCategory.findById(featured._id).populate(
    'categoryId',
    'name slug image bannerImage icon status'
  );

  res.status(200).json({
    success: true,
    message: 'Featured category updated successfully.',
    data: populated
  });
});

// @route   DELETE /api/home/featured-categories/:id
// @access  Private/Admin
export const deleteFeaturedCategory = asyncHandler(async (req, res) => {
  const featured = await HomepageFeaturedCategory.findById(req.params.id);

  if (!featured) {
    res.status(404);
    throw new Error('Featured category not found.');
  }

  await featured.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Featured category removed successfully.',
    id: req.params.id
  });
});

// @route   PATCH /api/home/featured-categories/reorder
// @access  Private/Admin
export const reorderFeaturedCategories = asyncHandler(async (req, res) => {
  const { orders } = req.body; // Array of { id, displayOrder }

  if (!Array.isArray(orders)) {
    res.status(400);
    throw new Error('Invalid reorder list.');
  }

  const bulkOps = orders.map((o) => ({
    updateOne: {
      filter: { _id: o.id },
      update: { $set: { displayOrder: o.displayOrder } }
    }
  }));

  if (bulkOps.length > 0) {
    await HomepageFeaturedCategory.bulkWrite(bulkOps);
  }

  res.status(200).json({
    success: true,
    message: 'Featured categories reordered successfully.'
  });
});

// @route   PATCH /api/home/featured-categories/status
// @access  Private/Admin
export const toggleFeaturedCategoryStatus = asyncHandler(async (req, res) => {
  const { id, status } = req.body;

  const featured = await HomepageFeaturedCategory.findById(id);
  if (!featured) {
    res.status(404);
    throw new Error('Featured category not found.');
  }

  featured.status = status || (featured.status === 'Active' ? 'Inactive' : 'Active');
  await featured.save();

  res.status(200).json({
    success: true,
    message: `Featured category status updated to ${featured.status}.`,
    data: featured
  });
});
