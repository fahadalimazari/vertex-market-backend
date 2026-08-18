import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import AnalyticsLog from '../models/AnalyticsLog.js';
import { syncAllTaxonomies } from '../utils/taxonomySync.js';

// Default static enterprise data for auto-seeding MongoDB on empty state
const defaultCategories = [
  {
    name: "Mobiles & Tablets",
    slug: "mobiles-and-tablets",
    icon: "FiSmartphone",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    description: "Latest smartphones and tablets from top brands.",
    featured: true,
    trending: true,
    sortOrder: 1,
    displayOrder: 1,
    status: "Active",
    isActive: true,
    productCount: 1250,
    subCategories: [
      { id: 101, name: "Smartphones", slug: "smartphones" },
      { id: 102, name: "Tablets", slug: "tablets" },
      { id: 103, name: "Accessories", slug: "accessories" },
      { id: 104, name: "Wearables", slug: "wearables" },
      { id: 105, name: "Mobile Parts", slug: "mobile-parts" }
    ],
    brands: [
      { id: 201, name: "Apple", slug: "apple", image: null },
      { id: 202, name: "Samsung", slug: "samsung", image: null },
      { id: 203, name: "Xiaomi", slug: "xiaomi", image: null },
      { id: 204, name: "OnePlus", slug: "oneplus", image: null },
      { id: 205, name: "Vivo", slug: "vivo", image: null }
    ],
    featuredProducts: [
      {
        id: 301,
        name: "Samsung Galaxy S23 Ultra",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80",
        price: 289999,
        discount: 10
      },
      {
        id: 302,
        name: "iPhone 15 Pro Max",
        image: "https://images.unsplash.com/photo-1609599006353-e629eeabfeae?auto=format&fit=crop&w=300&q=80",
        price: 349999,
        discount: 5
      }
    ],
    banner: {
      title: "Latest Arrivals in Mobiles",
      link: "/category/mobiles-and-tablets/latest",
      image: "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=300&q=80"
    },
    seoTitle: "Buy Mobiles & Tablets Online at Best Prices | Vertex Market",
    seoDescription: "Shop the latest smartphones, iPads, Android tablets, and original accessories with official warranty and fast shipping.",
    seoKeywords: ["smartphones", "mobiles", "tablets", "iphone", "samsung galaxy", "online shop"]
  },
  {
    name: "Electronics",
    slug: "electronics",
    icon: "FiMonitor",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80",
    description: "Computers, cameras, and audio devices.",
    featured: true,
    trending: true,
    sortOrder: 2,
    displayOrder: 2,
    status: "Active",
    isActive: true,
    productCount: 3400,
    subCategories: [
      { id: 106, name: "Laptops", slug: "laptops" },
      { id: 107, name: "Gaming Consoles", slug: "gaming-consoles" },
      { id: 108, name: "Cameras", slug: "cameras" },
      { id: 109, name: "Audio", slug: "audio" }
    ],
    brands: [
      { id: 206, name: "Sony", slug: "sony", image: null },
      { id: 207, name: "LG", slug: "lg", image: null },
      { id: 208, name: "Panasonic", slug: "panasonic", image: null },
      { id: 209, name: "Philips", slug: "philips", image: null }
    ],
    featuredProducts: [],
    banner: null,
    seoTitle: "Electronics & High-Tech Audio Systems | Vertex Market",
    seoDescription: "Explore cameras, audio soundbars, Smart 4K displays and premium electronic gadgets.",
    seoKeywords: ["electronics", "cameras", "audio", "sony", "lg"]
  },
  {
    name: "Computers",
    slug: "computers",
    icon: "FiCpu",
    image: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=800&q=80",
    description: "Desktops, components, and networking.",
    featured: false,
    trending: false,
    sortOrder: 3,
    displayOrder: 3,
    status: "Active",
    isActive: true,
    productCount: 890,
    subCategories: [
      { id: 110, name: "Desktops", slug: "desktops" },
      { id: 111, name: "Monitors", slug: "monitors" },
      { id: 112, name: "Components", slug: "components" },
      { id: 113, name: "Networking", slug: "networking" }
    ],
    brands: [],
    featuredProducts: [],
    banner: null
  },
  {
    name: "TV & Appliances",
    slug: "tv-and-home-appliances",
    icon: "FiTv",
    image: "https://images.unsplash.com/photo-1593453918093-8f308edb9e45?auto=format&fit=crop&w=800&q=80",
    description: "Televisions, refrigerators, and ACs.",
    featured: false,
    trending: false,
    sortOrder: 4,
    displayOrder: 4,
    status: "Active",
    isActive: true,
    productCount: 450,
    subCategories: [],
    brands: [],
    featuredProducts: [],
    banner: null
  },
  {
    name: "Men's Fashion",
    slug: "mens-fashion",
    icon: "FiUser",
    image: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80",
    description: "Clothing, shoes, and accessories for men.",
    featured: true,
    trending: true,
    sortOrder: 5,
    displayOrder: 5,
    status: "Active",
    isActive: true,
    productCount: 5200,
    subCategories: [
      { id: 114, name: "Clothing", slug: "clothing" },
      { id: 115, name: "Shoes", slug: "shoes" },
      { id: 116, name: "Watches", slug: "watches" }
    ],
    brands: [
      { id: 210, name: "Nike", slug: "nike", image: null },
      { id: 211, name: "Adidas", slug: "adidas", image: null }
    ],
    featuredProducts: [],
    banner: null
  },
  {
    name: "Gaming",
    slug: "gaming",
    icon: "FiHeadphones",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    description: "Consoles, games, and gaming accessories.",
    featured: true,
    trending: false,
    sortOrder: 6,
    displayOrder: 6,
    status: "Active",
    isActive: true,
    productCount: 890,
    subCategories: [],
    brands: [],
    featuredProducts: [],
    banner: null
  }
];

const checkAndSeedCategories = async () => {
  try {
    console.log('Syncing MongoDB categories with enterprise mega menu data...');
    for (const cat of defaultCategories) {
      await Category.findOneAndUpdate(
        { slug: cat.slug },
        { 
          $set: { 
            name: cat.name,
            icon: cat.icon,
            image: cat.image,
            description: cat.description,
            featured: cat.featured,
            trending: cat.trending,
            sortOrder: cat.sortOrder,
            displayOrder: cat.displayOrder,
            status: "Active",
            isActive: true,
            productCount: cat.productCount,
            subCategories: cat.subCategories,
            brands: cat.brands,
            featuredProducts: cat.featuredProducts,
            banner: cat.banner,
            seoTitle: cat.seoTitle || `${cat.name} Online Shopping | Vertex Market`,
            seoDescription: cat.seoDescription || `Buy best quality ${cat.name} online with warranty and fast delivery.`,
            seoKeywords: cat.seoKeywords || [cat.name.toLowerCase(), "online store", "deals"]
          } 
        },
        { upsert: true }
      );
    }
    // Auto-sync product taxonomies and ObjectIds in background
    syncAllTaxonomies().catch(e => console.error('Auto-sync taxonomy error:', e));
  } catch (err) {
    console.error('Error auto-seeding categories:', err);
  }
};

// @desc    Create a new category
// @route   POST /api/v1/categories
// @access  Private/Admin
export const createCategory = asyncHandler(async (req, res) => {
  const { 
    name, slug, description, shortDescription, image, bannerImage, mobileBanner, icon, status, 
    displayOrder, sortOrder, parentId, parentCategory, featured, trending,
    subCategories, brands, featuredProducts, banner, seoTitle, seoDescription, seoKeywords 
  } = req.body;

  let level = 0;
  let path = '';

  if (parentId || parentCategory) {
    const parent = await Category.findById(parentId || parentCategory);
    if (parent) {
      level = parent.level + 1;
      path = parent.path ? `${parent.path},${parent._id}` : `${parent._id}`;
    }
  }

  const categoryExists = await Category.findOne({ slug });
  if (categoryExists) {
    res.status(400);
    throw new Error('Category slug already exists');
  }

  const category = await Category.create({
    name,
    slug,
    description,
    shortDescription,
    image,
    bannerImage,
    mobileBanner,
    icon: icon || 'FiGrid',
    status: status || 'Active',
    isActive: status !== 'Inactive',
    displayOrder: displayOrder || sortOrder || 0,
    sortOrder: sortOrder || displayOrder || 0,
    parentId: parentId || parentCategory || null,
    parentCategory: parentCategory || parentId || null,
    featured: !!featured,
    trending: !!trending,
    level,
    path,
    subCategories: subCategories || [],
    brands: brands || [],
    featuredProducts: featuredProducts || [],
    banner: banner || null,
    seoTitle,
    seoDescription,
    seoKeywords,
    createdBy: req.user ? req.user._id : null
  });

  res.status(201).json(category);
});

// @desc    Update a category
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  category.name = req.body.name || category.name;
  if (req.body.slug && req.body.slug !== category.slug) {
      const exists = await Category.findOne({ slug: req.body.slug });
      if (exists && exists._id.toString() !== category._id.toString()) {
          res.status(400);
          throw new Error('Category slug already exists');
      }
      category.slug = req.body.slug;
  }
  
  category.description = req.body.description !== undefined ? req.body.description : category.description;
  category.shortDescription = req.body.shortDescription !== undefined ? req.body.shortDescription : category.shortDescription;
  category.image = req.body.image !== undefined ? req.body.image : category.image;
  category.bannerImage = req.body.bannerImage !== undefined ? req.body.bannerImage : category.bannerImage;
  category.mobileBanner = req.body.mobileBanner !== undefined ? req.body.mobileBanner : category.mobileBanner;
  category.icon = req.body.icon !== undefined ? req.body.icon : category.icon;
  category.status = req.body.status || category.status;
  category.isActive = category.status !== 'Inactive';
  category.displayOrder = req.body.displayOrder !== undefined ? req.body.displayOrder : category.displayOrder;
  category.sortOrder = req.body.sortOrder !== undefined ? req.body.sortOrder : category.displayOrder;
  category.featured = req.body.featured !== undefined ? req.body.featured : category.featured;
  category.trending = req.body.trending !== undefined ? req.body.trending : category.trending;
  category.subCategories = req.body.subCategories !== undefined ? req.body.subCategories : category.subCategories;
  category.brands = req.body.brands !== undefined ? req.body.brands : category.brands;
  category.featuredProducts = req.body.featuredProducts !== undefined ? req.body.featuredProducts : category.featuredProducts;
  category.banner = req.body.banner !== undefined ? req.body.banner : category.banner;
  category.seoTitle = req.body.seoTitle !== undefined ? req.body.seoTitle : category.seoTitle;
  category.seoDescription = req.body.seoDescription !== undefined ? req.body.seoDescription : category.seoDescription;
  category.seoKeywords = req.body.seoKeywords !== undefined ? req.body.seoKeywords : category.seoKeywords;
  
  if (req.body.parentId !== undefined && String(req.body.parentId) !== String(category.parentId)) {
     category.parentId = req.body.parentId || null;
     category.parentCategory = req.body.parentId || null;
     if (category.parentId) {
         const parent = await Category.findById(category.parentId);
         if (parent) {
            category.level = parent.level + 1;
            category.path = parent.path ? `${parent.path},${parent._id}` : `${parent._id}`;
         }
     } else {
         category.level = 0;
         category.path = '';
     }
  }

  const updatedCategory = await category.save();
  res.json(updatedCategory);
});

// @desc    Delete category (Soft Delete)
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  category.isDeleted = true;
  category.status = 'Inactive';
  category.isActive = false;
  await category.save();

  res.json({ message: 'Category removed (soft delete)' });
});

// @desc    Toggle Featured Status
// @route   PATCH /api/v1/categories/:id/featured
// @access  Private/Admin
export const toggleFeatured = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  category.featured = !category.featured;
  const updated = await category.save();
  res.json({ success: true, featured: updated.featured, message: `Category ${updated.featured ? 'Featured' : 'Unfeatured'}` });
});

// @desc    Toggle Active Status
// @route   PATCH /api/v1/categories/:id/status
// @access  Private/Admin
export const toggleStatus = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  const newStatus = category.status === 'Active' ? 'Inactive' : 'Active';
  category.status = newStatus;
  category.isActive = newStatus === 'Active';
  
  const updated = await category.save();
  res.json({ success: true, status: updated.status, message: `Category is now ${updated.status}` });
});

// @desc    Get all categories (Admin/Storefront)
// @route   GET /api/v1/categories
// @access  Public
export const getCategories = asyncHandler(async (req, res) => {
  // await checkAndSeedCategories();

  // If requesting from storefront or without explicit pagination, return clean list or structured response
  const pageSize = Number(req.query.pageSize) || 50;
  const page = Number(req.query.pageNumber) || 1;
  
  const query = { isDeleted: false };
  
  if (req.query.keyword) {
    query.name = { $regex: req.query.keyword, $options: 'i' };
  }
  
  if (req.query.featured === 'true') {
    query.featured = true;
    query.status = { $ne: 'Inactive' };
  }
  
  const count = await Category.countDocuments(query);
  const rawCategories = await Category.find(query)
    .sort({ sortOrder: 1, displayOrder: 1, createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  // Format cleanly so .id property is always available for storefront React components
  const categories = rawCategories.map(c => {
    const obj = c.toObject();
    obj.id = obj._id || obj.id;
    return obj;
  });

  res.json({ success: true, categories, data: categories, page, pages: Math.ceil(count / pageSize), count });
});

// @desc    Get active categories (Storefront Mega Menu)
// @route   GET /api/v1/categories/active
// @access  Public
export const getActiveCategories = asyncHandler(async (req, res) => {
  // await checkAndSeedCategories();

  const rawCategories = await Category.find({ isDeleted: false, status: { $ne: 'Inactive' } })
    .sort({ sortOrder: 1, displayOrder: 1 });
  
  const categories = rawCategories.map(c => {
    const obj = c.toObject();
    obj.id = obj._id || obj.id;
    return obj;
  });

  res.json(categories);
});

const normalizeCategorySlug = (val) => {
  if (!val) return '';
  const clean = val.toLowerCase();
  if (clean === 'mobiles-tablets' || clean === 'mobiles-and-tablets') return 'mobiles-and-tablets';
  if (clean === 'tv-appliances' || clean === 'tv-and-appliances' || clean === 'tv-and-home-appliances') return 'tv-and-home-appliances';
  return clean;
};

// @desc    Get category by ID or Slug (Landing Page details)
// @route   GET /api/v1/categories/:id
// @access  Public
export const getCategoryById = asyncHandler(async (req, res) => {
  // await checkAndSeedCategories();
  const param = req.params.id;

  let category = null;
  if (mongoose.Types.ObjectId.isValid(param)) {
    category = await Category.findOne({ _id: param, isDeleted: false });
  }
  if (!category) {
    const norm = normalizeCategorySlug(param);
    category = await Category.findOne({
      isDeleted: false,
      $or: [{ slug: norm }, { slug: param.toLowerCase() }]
    });
  }

  if (category) {
    // Log analytics tracking event asynchronously
    AnalyticsLog.create({
      event: 'CATEGORY_CLICK',
      target: category.slug,
      meta: { name: category.name }
    }).catch(err => console.error('Analytics logging failure:', err));

    const obj = category.toObject();
    obj.id = obj._id || obj.id;
    res.json({ success: true, data: obj, category: obj });
  } else {
    res.status(404);
    throw new Error('Category not found');
  }
});

// @desc    Get products by category slug with sorting & filtering
// @route   GET /api/v1/categories/:slug/products
// @access  Public
export const getProductsByCategorySlug = asyncHandler(async (req, res) => {
  // await checkAndSeedCategories();
  const { slug } = req.params;
  const { brand, minPrice, maxPrice, rating, inStock, sort, pageNumber, pageSize } = req.query;

  const norm = normalizeCategorySlug(slug);
  let category = await Category.findOne({
    isDeleted: false,
    $or: [{ slug: norm }, { slug: slug.toLowerCase() }]
  });
  if (!category && mongoose.Types.ObjectId.isValid(slug)) {
    category = await Category.findOne({ _id: slug, isDeleted: false });
  }

  if (!category && !mongoose.Types.ObjectId.isValid(slug)) {
    res.status(404);
    throw new Error('Category not found');
  }

  const query = {
    status: { $in: ['Active', 'Published'] },
    $or: [
      { categoryId: category ? category._id : null },
      { category: category ? category.slug : norm },
      { category: category ? category.name : norm },
      { category: category ? String(category._id) : norm },
      { category: slug },
      { category: { $regex: new RegExp(`^${slug.replace(/-/g, '.*')}$`, 'i') } }
    ]
  };

  // Brand Filter
  if (brand) {
    if (mongoose.Types.ObjectId.isValid(brand) && String(brand).length === 24) {
      query.$and = [{ $or: [{ brandId: brand }, { brand: brand }] }];
    } else {
      const brandClean = brand.toLowerCase().replace(/[^a-z0-9]/g, '');
      const brandDoc = await Brand.findOne({ $or: [{ slug: brand.toLowerCase() }, { name: { $regex: new RegExp(`^${brand}$`, 'i') } }] });
      const orList = [
        { brand: { $regex: new RegExp(`^${brand}$`, 'i') } },
        { brand: { $regex: new RegExp(brandClean, 'i') } }
      ];
      if (brandDoc) {
        orList.push({ brandId: brandDoc._id }, { brand: brandDoc.name });
      }
      query.$and = [{ $or: orList }];
    }
  }

  // Rating Filter
  if (rating) {
    query.rating = { $gte: Number(rating) };
  }

  // Price Range Filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Stock Filter
  if (inStock === 'true') {
    query.stock = { $gt: 0 };
  }

  // Sorting setup
  let sortOption = { createdAt: -1 };
  if (sort === 'price_asc') sortOption = { price: 1 };
  if (sort === 'price_desc') sortOption = { price: -1 };
  if (sort === 'popularity') sortOption = { rating: -1 };
  if (sort === 'newest') sortOption = { createdAt: -1 };

  const limit = Number(pageSize) || 20;
  const page = Number(pageNumber) || 1;

  const count = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('brandId', 'name slug logo')
    .sort(sortOption)
    .limit(limit)
    .skip(limit * (page - 1));

  res.json({
    success: true,
    category: category ? category.toObject() : { slug },
    products,
    page,
    pages: Math.ceil(count / limit),
    totalProducts: count
  });
});

// @desc    Get products by Category Slug & SubCategory Slug
// @route   GET /api/v1/categories/:slug/subcategories/:subSlug
// @access  Public
export const getSubCategoryBySlug = asyncHandler(async (req, res) => {
  // await checkAndSeedCategories();
  const { slug, subSlug } = req.params;
  const { brand, minPrice, maxPrice, rating, inStock, sort, pageNumber, pageSize } = req.query;

  const normCat = normalizeCategorySlug(slug);
  let category = await Category.findOne({
    isDeleted: false,
    $or: [{ slug: normCat }, { slug: slug.toLowerCase() }]
  });
  if (!category && mongoose.Types.ObjectId.isValid(slug)) {
    category = await Category.findOne({ _id: slug, isDeleted: false });
  }
  if (!category && !mongoose.Types.ObjectId.isValid(slug)) {
    res.status(404);
    throw new Error('Category not found');
  }

  let subCategory = null;
  if (category) {
    subCategory = await SubCategory.findOne({
      categoryId: category._id,
      isDeleted: false,
      $or: [
        { slug: subSlug.toLowerCase() },
        { name: { $regex: new RegExp(`^${subSlug.replace(/-/g, ' ')}$`, 'i') } }
      ]
    });
    if (!subCategory && mongoose.Types.ObjectId.isValid(subSlug)) {
      subCategory = await SubCategory.findOne({ _id: subSlug, isDeleted: false });
    }
  }

  const query = {
    status: { $in: ['Active', 'Published'] },
    $and: [
      {
        $or: [
          { categoryId: category ? category._id : null },
          { category: category ? category.name : normCat },
          { category: category ? category.slug : normCat },
          { category: slug },
          { category: { $regex: new RegExp(`^${slug.replace(/-/g, '.*')}$`, 'i') } }
        ]
      },
      {
        $or: [
          { subCategoryId: subCategory ? subCategory._id : null },
          { subCategory: subCategory ? subCategory.name : subSlug },
          { subCategory: subSlug },
          { subCategory: { $regex: new RegExp(`^${subSlug.replace(/-/g, '.*')}$`, 'i') } }
        ]
      }
    ]
  };

  if (brand) {
    if (mongoose.Types.ObjectId.isValid(brand) && String(brand).length === 24) {
      query.$and.push({ $or: [{ brandId: brand }, { brand: brand }] });
    } else {
      const brandDoc = await Brand.findOne({ $or: [{ slug: brand.toLowerCase() }, { name: { $regex: new RegExp(`^${brand}$`, 'i') } }] });
      const orList = [
        { brand: { $regex: new RegExp(`^${brand}$`, 'i') } },
        { brand: { $regex: new RegExp(brand.replace(/-/g, '.*'), 'i') } }
      ];
      if (brandDoc) {
        orList.push({ brandId: brandDoc._id }, { brand: brandDoc.name });
      }
      query.$and.push({ $or: orList });
    }
  }

  if (rating) query.rating = { $gte: Number(rating) };
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (inStock === 'true') query.stock = { $gt: 0 };

  let sortOption = { createdAt: -1 };
  if (sort === 'price_asc') sortOption = { price: 1 };
  if (sort === 'price_desc') sortOption = { price: -1 };
  if (sort === 'popularity') sortOption = { rating: -1 };
  if (sort === 'newest') sortOption = { createdAt: -1 };

  const limit = Number(pageSize) || 20;
  const page = Number(pageNumber) || 1;

  const count = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('brandId', 'name slug logo')
    .sort(sortOption)
    .limit(limit)
    .skip(limit * (page - 1));

  // Get available brands for this subcategory
  const distBrands = await Product.find(query).distinct('brand');
  const brandDocs = await Brand.find({
    status: 'Active',
    $or: [{ name: { $in: distBrands } }, { _id: { $in: await Product.find(query).distinct('brandId') } }]
  }).select('id _id name slug logo').lean();
  const availableBrands = brandDocs.map(b => ({ id: b._id || b.id, name: b.name, slug: b.slug, logo: b.logo }));

  res.json({
    success: true,
    category: category ? category.toObject() : { slug },
    subCategory: subCategory ? subCategory.toObject() : { slug: subSlug, name: subSlug.replace(/-/g, ' ') },
    products,
    brands: availableBrands,
    page,
    pages: Math.ceil(count / limit),
    totalProducts: count
  });
});

// @desc    Get products by Category Slug & Brand Slug
// @route   GET /api/v1/categories/:slug/brands/:brandSlug
// @access  Public
export const getBrandProductsByCategory = asyncHandler(async (req, res) => {
  // await checkAndSeedCategories();
  const { slug, brandSlug } = req.params;
  const { minPrice, maxPrice, rating, inStock, sort, pageNumber, pageSize } = req.query;

  const normCat = normalizeCategorySlug(slug);
  let category = await Category.findOne({
    isDeleted: false,
    $or: [{ slug: normCat }, { slug: slug.toLowerCase() }]
  });
  let brandDoc = await Brand.findOne({
    status: 'Active',
    $or: [{ slug: brandSlug.toLowerCase() }, { name: { $regex: new RegExp(`^${brandSlug.replace(/-/g, ' ')}$`, 'i') } }]
  });

  const query = {
    status: { $in: ['Active', 'Published'] },
    $and: [
      {
        $or: [
          { categoryId: category ? category._id : null },
          { category: category ? category.name : normCat },
          { category: category ? category.slug : normCat },
          { category: slug },
          { category: { $regex: new RegExp(`^${slug.replace(/-/g, '.*')}$`, 'i') } }
        ]
      },
      {
        $or: [
          { brandId: brandDoc ? brandDoc._id : null },
          { brand: brandDoc ? brandDoc.name : brandSlug },
          { brand: { $regex: new RegExp(`^${brandSlug.replace(/-/g, '.*')}$`, 'i') } }
        ]
      }
    ]
  };

  if (rating) query.rating = { $gte: Number(rating) };
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (inStock === 'true') query.stock = { $gt: 0 };

  let sortOption = { createdAt: -1 };
  if (sort === 'price_asc') sortOption = { price: 1 };
  if (sort === 'price_desc') sortOption = { price: -1 };

  const limit = Number(pageSize) || 20;
  const page = Number(pageNumber) || 1;

  const count = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('brandId', 'name slug logo')
    .sort(sortOption)
    .limit(limit)
    .skip(limit * (page - 1));

  res.json({
    success: true,
    category: category ? category.toObject() : { slug },
    brand: brandDoc ? brandDoc.toObject() : { slug: brandSlug, name: brandSlug.replace(/-/g, ' ') },
    products,
    page,
    pages: Math.ceil(count / limit),
    totalProducts: count
  });
});
