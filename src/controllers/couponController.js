import asyncHandler from 'express-async-handler';
import Coupon from '../models/Coupon.js';

// @desc    Get user's available and expired vouchers
// @route   GET /api/v1/coupons/my-vouchers
// @access  Private
export const getMyVouchers = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  // Find all coupons where userSpecific is empty OR contains the userId
  // Also we want to fetch them regardless of expiry/usage to categorize them in the frontend (Available vs Expired vs Used)
  const allCoupons = await Coupon.find({
    isActive: true,
    $or: [
      { userSpecific: { $size: 0 } },
      { userSpecific: userId }
    ]
  }).sort({ createdAt: -1 });

  const now = new Date();

  // Categorize coupons for the frontend
  const vouchers = allCoupons.map((coupon) => {
    let status = 'Available';
    
    if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
      status = 'Expired';
    } else if (coupon.maxUsage && coupon.currentUsage >= coupon.maxUsage) {
      // If a coupon is a global one-time-use, it might be exhausted for everyone. 
      // If we track individual usage in the future, we'd check it here. For now, maxUsage means total global limit.
      status = 'Used'; 
    }

    return {
      _id: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchase: coupon.minPurchase,
      maxDiscount: coupon.maxDiscount,
      expiryDate: coupon.expiryDate,
      status: status,
      sellerId: coupon.sellerId // Can be used by frontend to show if it's a seller specific voucher
    };
  });

  res.json({
    success: true,
    data: vouchers
  });
});
