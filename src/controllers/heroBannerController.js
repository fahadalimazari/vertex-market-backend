import asyncHandler from 'express-async-handler';
import HeroBanner from '../models/HeroBanner.js';

// Seed initial hardcoded approved hero banners if none exist in MongoDB
const seedDefaultHeroBanners = async () => {
  try {
    const count = await HeroBanner.countDocuments();
    if (count === 0) {
      const defaultBanners = [
        {
          name: 'Next-Gen Computing Deal',
          title: 'Next-Gen Computing',
          subtitle: 'Up to 30% Off on Laptops. Experience the power of the latest processors and graphics.',
          badge: 'VERTEX PRO',
          description: 'Experience lightning fast speed and revolutionary graphics performance.',
          primaryButtonText: 'Shop Now',
          primaryButtonUrl: '/products',
          secondaryButtonText: 'Explore Deals',
          secondaryButtonUrl: '/products?filter=flash-sale',
          desktopImage: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=2070&auto=format&fit=crop',
          displayOrder: 1,
          status: 'Active',
          featured: true,
          autoRotate: true,
          altText: 'Next-Gen Computing Laptops',
          createdBy: 'System Seed',
          updatedBy: 'System Seed',
        },
        {
          name: 'Smart Audio Series Deal',
          title: 'Smart Audio Series',
          subtitle: 'Immersive Sound Experience with Active Noise Cancellation.',
          badge: 'SONIC BEATS',
          description: 'Studio quality acoustic engineering with seamless Bluetooth 5.3 connectivity.',
          primaryButtonText: 'Shop Now',
          primaryButtonUrl: '/products',
          secondaryButtonText: 'Explore Deals',
          secondaryButtonUrl: '/products?filter=flash-sale',
          desktopImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=2080&auto=format&fit=crop',
          displayOrder: 2,
          status: 'Active',
          featured: false,
          autoRotate: true,
          altText: 'Smart Audio Headphones',
          createdBy: 'System Seed',
          updatedBy: 'System Seed',
        },
        {
          name: 'Gaming Essentials Deal',
          title: 'Gaming Essentials',
          subtitle: 'Elevate your setup with premium gaming gear.',
          badge: 'GAMER X',
          description: 'Mechanical keyboards, high-DPI mice, and ultra-wide displays for serious gamers.',
          primaryButtonText: 'Shop Now',
          primaryButtonUrl: '/products',
          secondaryButtonText: 'Explore Deals',
          secondaryButtonUrl: '/products?filter=flash-sale',
          desktopImage: 'https://images.unsplash.com/photo-1526406915894-7bcd65f60845?q=80&w=2070&auto=format&fit=crop',
          displayOrder: 3,
          status: 'Active',
          featured: false,
          autoRotate: true,
          altText: 'Premium Gaming Setup',
          createdBy: 'System Seed',
          updatedBy: 'System Seed',
        }
      ];
      await HeroBanner.insertMany(defaultBanners);
      console.log('✅ Seeded 3 default enterprise Hero Banners successfully.');
    }
  } catch (error) {
    console.error('Error in seedDefaultHeroBanners:', error.message);
  }
};

// @desc    Get all hero banners (active by default, or all for admin)
// @route   GET /api/v1/hero-banners & /api/hero-banners
// @access  Public
export const getHeroBanners = asyncHandler(async (req, res) => {
  await seedDefaultHeroBanners();

  const isAdmin = req.query.admin === 'true' || req.query.all === 'true';
  const now = new Date();

  let query = {};
  if (!isAdmin) {
    query = {
      status: 'Active',
      $and: [
        { $or: [{ startDate: { $eq: null } }, { startDate: { $lte: now } }, { startDate: { $exists: false } }] },
        { $or: [{ endDate: { $eq: null } }, { endDate: { $gte: now } }, { endDate: { $exists: false } }] }
      ]
    };
  }

  const banners = await HeroBanner.find(query).sort({ displayOrder: 1, createdAt: -1 });

  res.json({
    success: true,
    count: banners.length,
    data: banners,
    banners, // alias for flexible consumption
  });
});

// @desc    Create a new hero banner
// @route   POST /api/v1/hero-banners & /api/hero-banners
// @access  Public (or Admin)
export const createHeroBanner = asyncHandler(async (req, res) => {
  const {
    name,
    title,
    subtitle,
    badge,
    description,
    primaryButtonText,
    primaryButtonUrl,
    secondaryButtonText,
    secondaryButtonUrl,
    desktopImage,
    mobileImage,
    tabletImage,
    displayOrder,
    status,
    featured,
    autoRotate,
    openInNewTab,
    startDate,
    endDate,
    altText,
    imageTitle,
  } = req.body;

  // Auto calculate displayOrder if not provided
  let finalOrder = displayOrder;
  if (finalOrder === undefined || finalOrder === null || finalOrder === '') {
    const highest = await HeroBanner.findOne().sort({ displayOrder: -1 });
    finalOrder = highest ? highest.displayOrder + 1 : 1;
  }

  const banner = await HeroBanner.create({
    name: name || title || 'New Hero Banner',
    title: title || 'Untitled Banner',
    subtitle: subtitle || '',
    badge: badge || '',
    description: description || '',
    primaryButtonText: primaryButtonText || 'Shop Now',
    primaryButtonUrl: primaryButtonUrl || '/products',
    secondaryButtonText: secondaryButtonText || 'Explore Deals',
    secondaryButtonUrl: secondaryButtonUrl || '/products?filter=flash-sale',
    desktopImage: desktopImage || 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=2070&auto=format&fit=crop',
    mobileImage: mobileImage || '',
    tabletImage: tabletImage || '',
    displayOrder: Number(finalOrder),
    status: status || 'Active',
    featured: Boolean(featured),
    autoRotate: autoRotate !== undefined ? Boolean(autoRotate) : true,
    openInNewTab: Boolean(openInNewTab),
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    altText: altText || title || '',
    imageTitle: imageTitle || title || '',
    createdBy: req.user ? req.user.name : 'Admin',
    updatedBy: req.user ? req.user.name : 'Admin',
  });

  res.status(201).json({
    success: true,
    data: banner,
    banner,
  });
});

// @desc    Update a hero banner
// @route   PUT /api/v1/hero-banners/:id & /api/hero-banners/:id
// @access  Public (or Admin)
export const updateHeroBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const banner = await HeroBanner.findById(id);

  if (!banner) {
    res.status(404);
    throw new Error('Hero Banner not found');
  }

  const updateData = { ...req.body, updatedBy: req.user ? req.user.name : 'Admin' };
  if (updateData.startDate === '' || updateData.startDate === null) updateData.startDate = null;
  if (updateData.endDate === '' || updateData.endDate === null) updateData.endDate = null;

  const updatedBanner = await HeroBanner.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  res.json({
    success: true,
    data: updatedBanner,
    banner: updatedBanner,
  });
});

// @desc    Delete a hero banner
// @route   DELETE /api/v1/hero-banners/:id & /api/hero-banners/:id
// @access  Public (or Admin)
export const deleteHeroBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const banner = await HeroBanner.findById(id);

  if (!banner) {
    res.status(404);
    throw new Error('Hero Banner not found');
  }

  await HeroBanner.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Hero banner removed successfully',
  });
});

// @desc    Update status of a hero banner (Enable/Disable toggle)
// @route   PATCH /api/v1/hero-banners/:id/status & /api/hero-banners/:id/status
// @access  Public (or Admin)
export const updateHeroBannerStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const banner = await HeroBanner.findById(id);

  if (!banner) {
    res.status(404);
    throw new Error('Hero Banner not found');
  }

  let newStatus = req.body.status;
  if (!newStatus) {
    newStatus = banner.status === 'Active' ? 'Inactive' : 'Active';
  }

  banner.status = newStatus;
  banner.updatedBy = req.user ? req.user.name : 'Admin';
  await banner.save();

  res.json({
    success: true,
    data: banner,
    banner,
  });
});

// @desc    Reorder display Order of hero banners
// @route   PATCH /api/v1/hero-banners/reorder & /api/hero-banners/reorder
// @access  Public (or Admin)
export const reorderHeroBanners = asyncHandler(async (req, res) => {
  const { items, ids } = req.body;
  
  if (Array.isArray(items)) {
    // items is an array of objects like [{ id: 'xxxx', displayOrder: 1 }, ...]
    for (const item of items) {
      if (item.id && item.displayOrder !== undefined) {
        await HeroBanner.findByIdAndUpdate(item.id, { displayOrder: Number(item.displayOrder) });
      }
    }
  } else if (Array.isArray(ids)) {
    // ids is simply an array of ordered IDs ['id1', 'id2', 'id3']
    for (let i = 0; i < ids.length; i++) {
      await HeroBanner.findByIdAndUpdate(ids[i], { displayOrder: i + 1 });
    }
  }

  const updatedBanners = await HeroBanner.find({}).sort({ displayOrder: 1 });

  res.json({
    success: true,
    message: 'Display orders updated successfully',
    data: updatedBanners,
  });
});
