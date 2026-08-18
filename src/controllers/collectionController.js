import asyncHandler from 'express-async-handler';
import Collection from '../models/Collection.js';
import mongoose from 'mongoose';

// @desc    Create a new collection
// @route   POST /api/v1/collections
// @access  Private/Admin
export const createCollection = asyncHandler(async (req, res) => {
  const { name, slug, image, banner, description, categoryId, featured, status, sortOrder } = req.body;

  const collectionExists = await Collection.findOne({ slug });
  if (collectionExists) {
    res.status(400);
    throw new Error('Collection slug already exists');
  }

  const collection = await Collection.create({
    name,
    slug,
    image,
    banner,
    description,
    categoryId,
    featured: featured || false,
    status: status || 'Active',
    sortOrder: sortOrder || 0
  });

  res.status(201).json(collection);
});

// @desc    Update a collection
// @route   PUT /api/v1/collections/:id
// @access  Private/Admin
export const updateCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findById(req.params.id);

  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }

  collection.name = req.body.name || collection.name;
  if (req.body.slug && req.body.slug !== collection.slug) {
    const exists = await Collection.findOne({ slug: req.body.slug });
    if (exists && exists._id.toString() !== collection._id.toString()) {
      res.status(400);
      throw new Error('Collection slug already exists');
    }
    collection.slug = req.body.slug;
  }

  collection.image = req.body.image !== undefined ? req.body.image : collection.image;
  collection.banner = req.body.banner !== undefined ? req.body.banner : collection.banner;
  collection.description = req.body.description !== undefined ? req.body.description : collection.description;
  collection.categoryId = req.body.categoryId !== undefined ? req.body.categoryId : collection.categoryId;
  collection.featured = req.body.featured !== undefined ? req.body.featured : collection.featured;
  collection.status = req.body.status || collection.status;
  collection.sortOrder = req.body.sortOrder !== undefined ? req.body.sortOrder : collection.sortOrder;

  const updatedCollection = await collection.save();
  res.json(updatedCollection);
});

// @desc    Delete collection
// @route   DELETE /api/v1/collections/:id
// @access  Private/Admin
export const deleteCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findById(req.params.id);

  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }

  collection.status = 'Inactive';
  await collection.save();

  res.json({ message: 'Collection removed (soft delete)' });
});

// @desc    Get all collections
// @route   GET /api/v1/collections
// @access  Public
export const getCollections = asyncHandler(async (req, res) => {
  const query = { status: { $ne: 'Inactive' } };
  
  // Apply featured filter if provided
  if (req.query.featured === 'true') {
    query.featured = true;
  }
  
  const collections = await Collection.find(query).sort({ sortOrder: 1, createdAt: -1 });

  const mappedCollections = collections.map(c => {
    const obj = c.toObject();
    obj.id = obj._id || obj.id;
    return obj;
  });

  res.json({ success: true, collections: mappedCollections, data: mappedCollections });
});

// @desc    Get collection by slug
// @route   GET /api/v1/collections/:slug
// @access  Public
export const getCollectionBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  let collection = null;
  if (mongoose.Types.ObjectId.isValid(slug)) {
    collection = await Collection.findById(slug);
  }
  if (!collection) {
    collection = await Collection.findOne({ slug });
  }

  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }

  const obj = collection.toObject();
  obj.id = obj._id || obj.id;
  res.json({ success: true, collection: obj, data: obj });
});
