import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import AnalyticsLog from '../models/AnalyticsLog.js';

const defaultBrands = [
  { name: "Apple", slug: "apple", logo: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=200&q=80", banner: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1200&q=80", description: "Think Different. Apple smartphones, laptops, and wearables.", brandStory: "Founded in Cupertino, Apple revolutionized personal technology with Apple II and Macintosh, and later the iPhone.", featured: true, customerRating: 4.9 },
  { name: "Samsung", slug: "samsung", logo: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=200&q=80", banner: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=1200&q=80", description: "Inspire the World, Create the Future.", brandStory: "Samsung is a leading global electronics pioneer delivering breakthrough smartphones, QLED TVs, and semiconductor marvels.", featured: true, customerRating: 4.8 },
  { name: "Sony", slug: "sony", logo: "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=200&q=80", banner: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80", description: "Be Moved. PlayStation gaming consoles, world-class audio, and mirrorless Alpha cameras.", brandStory: "Sony delivers emotion through power of creativity and technology, defining entertainment for generations.", featured: true, customerRating: 4.8 },
  { name: "LG", slug: "lg", logo: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=200&q=80", banner: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1200&q=80", description: "Life's Good. Innovation for a better life in OLED TVs and intelligent appliances.", brandStory: "LG pioneers sustainable and intuitive home comfort solutions globally.", featured: false, customerRating: 4.7 },
  { name: "Panasonic", slug: "panasonic", logo: null, banner: null, description: "A Better Life, A Better World. High-grade industrial electronic goods.", featured: false, customerRating: 4.6 },
  { name: "Philips", slug: "philips", logo: null, banner: null, description: "Innovation and You. Medical healthcare and domestic electronic appliances.", featured: false, customerRating: 4.6 },
  { name: "Nike", slug: "nike", logo: null, banner: null, description: "Just Do It. Premium athletic footwear, apparel, and lifestyle accessories.", featured: true, customerRating: 4.9 },
  { name: "Adidas", slug: "adidas", logo: null, banner: null, description: "Impossible is Nothing. Iconic performance activewear and sneakers.", featured: true, customerRating: 4.8 },
  { name: "Xiaomi", slug: "xiaomi", logo: null, banner: null, description: "Innovation for Everyone. Smart mobile tech and smart living ecosystems.", featured: true, customerRating: 4.7 },
  { name: "OnePlus", slug: "oneplus", logo: null, banner: null, description: "Never Settle. Ultra-fast performance flagship killer phones.", featured: false, customerRating: 4.7 },
  { name: "Vivo", slug: "vivo", logo: null, banner: null, description: "Love America, Love Vivo. Mobile portrait camera craftsmanship.", featured: false, customerRating: 4.5 }
];

let seedError = null;
const checkAndSeedBrands = async () => {
  try {
    const count = await Brand.countDocuments();
    if (count < defaultBrands.length) {
      console.log('Seeding brands...');
      for (const b of defaultBrands) {
        try {
          await Brand.findOneAndUpdate(
            { slug: b.slug },
            { $set: { ...b, status: "Active" } },
            { upsert: true, runValidators: false }
          );
        } catch (e) {
          seedError = `Brand ${b.slug} failed: ${e.message}`;
        }
      }
    }
  } catch (err) {
    seedError = err.message || err.toString();
    console.error('Error auto-seeding brands:', err);
  }
};

// @desc    Get all brands
// @route   GET /api/brands
// @access  Public
export const getBrands = asyncHandler(async (req, res) => {
  await checkAndSeedBrands();
  const { featured, keyword } = req.query;

  const query = {};
  if (featured === 'true') query.featured = true;
  if (keyword) query.name = { $regex: keyword, $options: 'i' };

  const brands = await Brand.find(query).sort({ name: 1 });
  const data = brands.map(b => {
    const obj = b.toObject();
    obj.id = obj._id || obj.id;
    return obj;
  });

  res.status(200).json({ success: true, count: data.length, data, brands: data, seedError, totalDocs: await Brand.countDocuments() });
});

// @desc    Get brand by Slug or ID (Brand Landing Page)
// @route   GET /api/brands/:id
// @access  Public
export const getBrandBySlugOrId = asyncHandler(async (req, res) => {
  await checkAndSeedBrands();
  const param = req.params.id;

  let brand = null;
  if (mongoose.Types.ObjectId.isValid(param)) {
    brand = await Brand.findOne({ _id: param, status: 'Active' });
  }
  if (!brand) {
    brand = await Brand.findOne({ slug: param.toLowerCase(), status: 'Active' });
  }

  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }

  // Log analytics tracking event
  AnalyticsLog.create({
    event: 'BRAND_CLICK',
    target: brand.slug,
    meta: { name: brand.name }
  }).catch(err => console.error('Analytics logging error:', err));

  // Query products associated with this brand
  const products = await Product.find({
    status: { $in: ['Active', 'Published'] },
    $or: [
      { brandId: brand._id },
      { brand: brand._id },
      { brand: brand.name },
      { brand: brand.slug },
      { 'brand.slug': brand.slug },
      { 'brand.name': brand.name }
    ]
  }).limit(50);

  const obj = brand.toObject();
  obj.id = obj._id || obj.id;
  obj.products = products;
  obj.featuredProducts = products.filter(p => p.isFeatured || p.isTrending).slice(0, 6);
  obj.latestProducts = products.slice(0, 8);
  obj.bestSellers = products.filter(p => p.isBestSeller).slice(0, 6);

  res.status(200).json({ success: true, data: obj, brand: obj });
});

// @desc    Get all brands (Admin)
// @route   GET /api/brands/admin
// @access  Private/Admin
export const getBrandsAdmin = asyncHandler(async (req, res) => {
  await checkAndSeedBrands();
  const brands = await Brand.find({}).sort({ name: 1 });
  res.status(200).json({ success: true, count: brands.length, data: brands });
});

// @desc    Create new brand
// @route   POST /api/brands
// @access  Private/Admin
export const createBrand = asyncHandler(async (req, res) => {
  const { name, slug, logo, banner, description, brandStory, officialWarranty, featured, status } = req.body;

  const brandExists = await Brand.findOne({ $or: [{ name }, { slug }] });

  if (brandExists) {
    res.status(400);
    throw new Error('Brand with this name or slug already exists');
  }

  const brand = await Brand.create({
    name,
    slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    logo,
    banner,
    description,
    brandStory,
    officialWarranty,
    featured: !!featured,
    status
  });

  res.status(201).json({ success: true, data: brand });
});

// @desc    Update brand
// @route   PUT /api/brands/:id
// @access  Private/Admin
export const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }

  const updatedBrand = await Brand.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: updatedBrand });
});

// @desc    Delete brand
// @route   DELETE /api/brands/:id
// @access  Private/Admin
export const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }

  await brand.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

// @desc    Follow brand
// @route   POST /api/brands/:id/follow
// @access  Private
export const followBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }

  if (brand.followers.includes(req.user._id)) {
    res.status(400);
    throw new Error('Already following this brand');
  }

  brand.followers.push(req.user._id);
  await brand.save();

  res.status(200).json({ success: true, message: 'Brand followed successfully' });
});

// @desc    Unfollow brand
// @route   POST /api/brands/:id/unfollow
// @access  Private
export const unfollowBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }

  if (!brand.followers.includes(req.user._id)) {
    res.status(400);
    throw new Error('Not following this brand');
  }

  brand.followers = brand.followers.filter(id => id.toString() !== req.user._id.toString());
  await brand.save();

  res.status(200).json({ success: true, message: 'Brand unfollowed successfully' });
});

// @desc    Update brand verification status
// @route   PUT /api/brands/:id/verification
// @access  Private/Admin
export const updateBrandVerification = asyncHandler(async (req, res) => {
  const { verificationStatus, verified } = req.body;
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }

  brand.verificationStatus = verificationStatus || brand.verificationStatus;
  if (typeof verified !== 'undefined') {
    brand.verified = verified;
  }

  const updatedBrand = await brand.save();
  res.status(200).json({ success: true, data: updatedBrand });
});
