import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import Category from './src/models/Category.js';
import HomepageFeaturedCategory from './src/models/HomepageFeaturedCategory.js';

dotenv.config();

const seedFeaturedCategories = async () => {
  try {
    await connectDB();

    // Clear existing featured categories
    await HomepageFeaturedCategory.deleteMany({});
    console.log('Cleared existing homepage featured categories.');

    // Fetch all active categories
    const categories = await Category.find({ isDeleted: { $ne: true } });
    console.log(`Found ${categories.length} categories in database.`);

    const featuredData = [];
    let order = 1;

    for (const cat of categories) {
      // Feature the top 6 categories
      const isFeatured = ['mobiles-and-tablets', 'electronics', 'computers', 'tv-and-home-appliances', 'mens-fashion', 'gaming'].includes(cat.slug);
      
      if (isFeatured) {
        featuredData.push({
          categoryId: cat._id,
          displayOrder: order++,
          status: 'Active',
          featured: true
        });
        console.log(`Prepared featured category: ${cat.name} (Slug: ${cat.slug})`);
      }
    }

    if (featuredData.length > 0) {
      await HomepageFeaturedCategory.insertMany(featuredData);
      console.log(`Successfully seeded ${featuredData.length} homepage featured categories.`);
    } else {
      console.log('No matching categories found to feature. Please run the main seeder first.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error seeding featured categories:', err);
    process.exit(1);
  }
};

seedFeaturedCategories();
