import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import Coupon from './src/models/Coupon.js';

dotenv.config();
connectDB();

const seedCoupons = async () => {
  try {
    await Coupon.deleteMany();

    const coupons = [
      {
        code: 'SAVE20',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minPurchase: 500,
        maxDiscount: 200,
        expiryDate: new Date('2030-12-31'),
        isActive: true
      },
      {
        code: 'FLAT500',
        discountType: 'FIXED',
        discountValue: 500,
        minPurchase: 2000,
        expiryDate: new Date('2030-12-31'),
        isActive: true
      },
      {
        code: 'FREESHIP',
        discountType: 'FREE_SHIPPING',
        discountValue: 0,
        minPurchase: 0,
        expiryDate: new Date('2030-12-31'),
        isActive: true
      }
    ];

    await Coupon.insertMany(coupons);
    console.log('Test Coupons Seeded Successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding coupons: ${error.message}`);
    process.exit(1);
  }
};

seedCoupons();
