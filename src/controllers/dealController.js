import asyncHandler from 'express-async-handler';
import Deal from '../models/Deal.js';
import Product from '../models/Product.js';

const defaultDeals = [
  {
    title: "Mega Mid-Year Tech Sale",
    slug: "mega-mid-year-tech-sale",
    banner: "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=800&q=80",
    discountBadge: "Up to 60% OFF",
    limitedStock: 35,
    couponCode: "VERTEX60",
    freeShipping: true,
    isFlashSale: false,
    status: "Active"
  },
  {
    title: "Midnight Flash Discounts on Laptops",
    slug: "midnight-flash-discounts-laptops",
    banner: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80",
    discountBadge: "Flat $200 OFF",
    limitedStock: 12,
    couponCode: "FLASH200",
    freeShipping: true,
    isFlashSale: true,
    status: "Active"
  },
  {
    title: "Smart Gaming Bundle Blowout",
    slug: "smart-gaming-bundle",
    banner: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    discountBadge: "40% OFF + Free Controller",
    limitedStock: 25,
    couponCode: "GAME40",
    freeShipping: false,
    isFlashSale: true,
    status: "Active"
  }
];

const checkAndSeedDeals = async () => {
  try {
    const count = await Deal.countDocuments();
    if (count === 0) {
      console.log('Seeding default enterprise deals and flash sales...');
      await Deal.insertMany(defaultDeals);
    }
  } catch (err) {
    console.error('Error seeding deals:', err);
  }
};

// @desc    Get all active deals
// @route   GET /api/v1/deals
// @access  Public
export const getDeals = asyncHandler(async (req, res) => {
  await checkAndSeedDeals();
  const deals = await Deal.find({ status: 'Active' }).populate('dealProducts');
  
  res.json({ success: true, count: deals.length, data: deals, deals });
});

// @desc    Get flash sales
// @route   GET /api/v1/flash-sales
// @access  Public
export const getFlashSales = asyncHandler(async (req, res) => {
  await checkAndSeedDeals();
  const flashDeals = await Deal.find({ isFlashSale: true, status: 'Active' }).populate('dealProducts');
  const flashProducts = await Product.find({ isFlashSale: true, status: 'Published' }).limit(10).lean();

  res.json({
    success: true,
    deals: flashDeals,
    products: flashProducts,
    countdownEndTime: flashDeals.length > 0 ? flashDeals[0].countdownEndTime : new Date(Date.now() + 24 * 3600 * 1000)
  });
});

// @desc    Create new deal (Admin)
// @route   POST /api/v1/deals
// @access  Private/Admin
export const createDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.create(req.body);
  res.status(201).json({ success: true, data: deal });
});
