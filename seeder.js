import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import Product from './src/models/Product.js';
import { syncAllTaxonomies } from './src/utils/taxonomySync.js';

// We will simulate importing from the frontend by hardcoding or copying the data here for the seeder
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

import User from './src/models/User.js';
import Category from './src/models/Category.js';
import SubCategory from './src/models/SubCategory.js';
import Attribute from './src/models/Attribute.js';
import AttributeValue from './src/models/AttributeValue.js';
import HeroFlashSale from './src/models/HeroFlashSale.js';
import bcrypt from 'bcryptjs';

const importData = async () => {
  try {
    // Delete existing data
    await Product.deleteMany({});
    await User.deleteMany({});
    await Category.deleteMany({});
    await SubCategory.deleteMany({});
    await Attribute.deleteMany({});
    await AttributeValue.deleteMany({});
    await HeroFlashSale.deleteMany({});

    // Create Super Admin User
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@vertexmarket.com',
      password: 'password123', // Will be hashed by pre-save hook
      role: 'Super Admin',
      isEmailVerified: true
    });

    console.log(`Super Admin Created: ${superAdmin.email}`);

    // Seed Categories
    const categoriesData = [
      { name: "Mobiles & Tablets", slug: "mobiles-and-tablets", description: "Latest smartphones and tablets", icon: "FiSmartphone" },
      { name: "Electronics", slug: "electronics", description: "Computers, cameras, and audio devices", icon: "FiMonitor" },
      { name: "Computers", slug: "computers", description: "Desktops, components, and networking", icon: "FiCpu" },
      { name: "TV & Appliances", slug: "tv-and-home-appliances", description: "Televisions, refrigerators, and ACs", icon: "FiTv" },
      { name: "Men's Fashion", slug: "mens-fashion", description: "Clothing, shoes, and accessories for men", icon: "FiUser" },
      { name: "Gaming", slug: "gaming", description: "Consoles, games, and gaming accessories", icon: "FiHeadphones" }
    ];

    const insertedCategories = await Category.insertMany(categoriesData);

    const subCategoriesData = [];
    const mobileCat = insertedCategories.find(c => c.slug === "mobiles-and-tablets");
    if (mobileCat) {
      subCategoriesData.push(
        { categoryId: mobileCat._id, name: "Smartphones", slug: "smartphones" },
        { categoryId: mobileCat._id, name: "Tablets", slug: "tablets" },
        { categoryId: mobileCat._id, name: "Accessories", slug: "accessories" },
        { categoryId: mobileCat._id, name: "Wearables", slug: "wearables" },
        { categoryId: mobileCat._id, name: "Mobile Parts", slug: "mobile-parts" }
      );
    }
    const electroCat = insertedCategories.find(c => c.slug === "electronics");
    if (electroCat) {
      subCategoriesData.push(
        { categoryId: electroCat._id, name: "Laptops", slug: "laptops" },
        { categoryId: electroCat._id, name: "Gaming Consoles", slug: "gaming-consoles" },
        { categoryId: electroCat._id, name: "Cameras", slug: "cameras" },
        { categoryId: electroCat._id, name: "Audio", slug: "audio" }
      );
    }
    const compCat = insertedCategories.find(c => c.slug === "computers");
    if (compCat) {
      subCategoriesData.push(
        { categoryId: compCat._id, name: "Desktops", slug: "desktops" },
        { categoryId: compCat._id, name: "Monitors", slug: "monitors" },
        { categoryId: compCat._id, name: "Components", slug: "components" },
        { categoryId: compCat._id, name: "Networking", slug: "networking" }
      );
    }
    const mensCat = insertedCategories.find(c => c.slug === "mens-fashion");
    if (mensCat) {
      subCategoriesData.push(
        { categoryId: mensCat._id, name: "Clothing", slug: "clothing" },
        { categoryId: mensCat._id, name: "Shoes", slug: "shoes" },
        { categoryId: mensCat._id, name: "Watches", slug: "watches" }
      );
    }

    const seededSubs = await SubCategory.insertMany(subCategoriesData);
    console.log('Categories and Subcategories seeded successfully!');

    // Get Smartphones and Shoes subcategories
    const smartphoneSub = seededSubs.find(s => s.slug === "smartphones");
    const shoesSub = seededSubs.find(s => s.slug === "shoes");

    if (smartphoneSub) {
      // Create Smartphone Attributes
      const attributes = [
        { subCategoryId: smartphoneSub._id, name: 'Brand', code: 'brand', inputType: 'Dropdown', required: true, sortOrder: 1 },
        { subCategoryId: smartphoneSub._id, name: 'Storage', code: 'storage', inputType: 'Dropdown', required: true, sortOrder: 2 },
        { subCategoryId: smartphoneSub._id, name: 'RAM', code: 'ram', inputType: 'Dropdown', required: true, sortOrder: 3 },
        { subCategoryId: smartphoneSub._id, name: 'Colour', code: 'colour', inputType: 'Dropdown', required: true, sortOrder: 4 },
        { subCategoryId: smartphoneSub._id, name: 'Display Size', code: 'display_size', inputType: 'Text Field', required: false, sortOrder: 5 },
        { subCategoryId: smartphoneSub._id, name: 'Battery', code: 'battery', inputType: 'Text Field', required: false, sortOrder: 6 },
        { subCategoryId: smartphoneSub._id, name: 'Processor', code: 'processor', inputType: 'Text Field', required: false, sortOrder: 7 }
      ];

      const createdAttrs = await Attribute.insertMany(attributes);

      // Create Smartphone Attribute Values
      const brandAttr = createdAttrs.find(a => a.code === 'brand');
      const storageAttr = createdAttrs.find(a => a.code === 'storage');
      const ramAttr = createdAttrs.find(a => a.code === 'ram');
      const colourAttr = createdAttrs.find(a => a.code === 'colour');

      const values = [];
      if (brandAttr) {
        values.push(
          { attributeId: brandAttr._id, value: 'Apple', label: 'Apple', sortOrder: 1 },
          { attributeId: brandAttr._id, value: 'Samsung', label: 'Samsung', sortOrder: 2 },
          { attributeId: brandAttr._id, value: 'Xiaomi', label: 'Xiaomi', sortOrder: 3 },
          { attributeId: brandAttr._id, value: 'OnePlus', label: 'OnePlus', sortOrder: 4 }
        );
      }
      if (storageAttr) {
        values.push(
          { attributeId: storageAttr._id, value: '64GB', label: '64 GB', sortOrder: 1 },
          { attributeId: storageAttr._id, value: '128GB', label: '128 GB', sortOrder: 2 },
          { attributeId: storageAttr._id, value: '256GB', label: '256 GB', sortOrder: 3 },
          { attributeId: storageAttr._id, value: '512GB', label: '512 GB', sortOrder: 4 },
          { attributeId: storageAttr._id, value: '1TB', label: '1 TB', sortOrder: 5 }
        );
      }
      if (ramAttr) {
        values.push(
          { attributeId: ramAttr._id, value: '4GB', label: '4 GB', sortOrder: 1 },
          { attributeId: ramAttr._id, value: '6GB', label: '6 GB', sortOrder: 2 },
          { attributeId: ramAttr._id, value: '8GB', label: '8 GB', sortOrder: 3 },
          { attributeId: ramAttr._id, value: '12GB', label: '12 GB', sortOrder: 4 },
          { attributeId: ramAttr._id, value: '16GB', label: '16 GB', sortOrder: 5 }
        );
      }
      if (colourAttr) {
        values.push(
          { attributeId: colourAttr._id, value: 'Black', label: 'Black', sortOrder: 1 },
          { attributeId: colourAttr._id, value: 'White', label: 'White', sortOrder: 2 },
          { attributeId: colourAttr._id, value: 'Silver', label: 'Silver', sortOrder: 3 },
          { attributeId: colourAttr._id, value: 'Gold', label: 'Gold', sortOrder: 4 },
          { attributeId: colourAttr._id, value: 'Blue', label: 'Blue', sortOrder: 5 }
        );
      }

      await AttributeValue.insertMany(values);
    }

    if (shoesSub) {
      // Create Shoes Attributes
      const attributes = [
        { subCategoryId: shoesSub._id, name: 'Size', code: 'size', inputType: 'Dropdown', required: true, sortOrder: 1 },
        { subCategoryId: shoesSub._id, name: 'Colour', code: 'colour_shoes', inputType: 'Dropdown', required: true, sortOrder: 2 },
        { subCategoryId: shoesSub._id, name: 'Material', code: 'material', inputType: 'Dropdown', required: true, sortOrder: 3 },
        { subCategoryId: shoesSub._id, name: 'Gender', code: 'gender', inputType: 'Dropdown', required: true, sortOrder: 4 }
      ];

      const createdAttrs = await Attribute.insertMany(attributes);

      // Create Shoes Attribute Values
      const sizeAttr = createdAttrs.find(a => a.code === 'size');
      const colourShoesAttr = createdAttrs.find(a => a.code === 'colour_shoes');
      const materialAttr = createdAttrs.find(a => a.code === 'material');
      const genderAttr = createdAttrs.find(a => a.code === 'gender');

      const values = [];
      if (sizeAttr) {
        values.push(
          { attributeId: sizeAttr._id, value: '7', label: '7', sortOrder: 1 },
          { attributeId: sizeAttr._id, value: '8', label: '8', sortOrder: 2 },
          { attributeId: sizeAttr._id, value: '9', label: '9', sortOrder: 3 },
          { attributeId: sizeAttr._id, value: '10', label: '10', sortOrder: 4 },
          { attributeId: sizeAttr._id, value: '11', label: '11', sortOrder: 5 }
        );
      }
      if (colourShoesAttr) {
        values.push(
          { attributeId: colourShoesAttr._id, value: 'Black', label: 'Black', sortOrder: 1 },
          { attributeId: colourShoesAttr._id, value: 'White', label: 'White', sortOrder: 2 },
          { attributeId: colourShoesAttr._id, value: 'Red', label: 'Red', sortOrder: 3 },
          { attributeId: colourShoesAttr._id, value: 'Blue', label: 'Blue', sortOrder: 4 }
        );
      }
      if (materialAttr) {
        values.push(
          { attributeId: materialAttr._id, value: 'Leather', label: 'Leather', sortOrder: 1 },
          { attributeId: materialAttr._id, value: 'Mesh', label: 'Mesh', sortOrder: 2 },
          { attributeId: materialAttr._id, value: 'Canvas', label: 'Canvas', sortOrder: 3 },
          { attributeId: materialAttr._id, value: 'Rubber', label: 'Rubber', sortOrder: 4 }
        );
      }
      if (genderAttr) {
        values.push(
          { attributeId: genderAttr._id, value: 'Men', label: 'Men', sortOrder: 1 },
          { attributeId: genderAttr._id, value: 'Women', label: 'Women', sortOrder: 2 },
          { attributeId: genderAttr._id, value: 'Unisex', label: 'Unisex', sortOrder: 3 }
        );
      }

      await AttributeValue.insertMany(values);
    }

    console.log('Dynamic attributes and values seeded successfully!');

    // Read the products data from the frontend file
    const frontendPath = path.resolve(__dirname, '../src/data/products.js');
    const { products } = await import(`file://${frontendPath}`);

    // Insert into DB
    await Product.insertMany(products);
    console.log('Synchronizing product taxonomies and ObjectIds...');
    await syncAllTaxonomies();

    const targetProd = await Product.findOne({ name: { $regex: /samsung galaxy s23/i } }) || await Product.findOne({});
    if (targetProd) {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000); // 5 days 4 hours
      await HeroFlashSale.create({
        saleName: "Galaxy S23 Ultra Mega Offer",
        productId: targetProd._id,
        badge: "Flash Sale",
        salePrice: Math.round(targetProd.price * 0.8),
        originalPrice: targetProd.price,
        discountType: "Percentage",
        discountValue: 20,
        displayPriority: 10,
        buttonText: "Shop Now",
        buttonUrl: `/product/${targetProd.slug}`,
        status: "Active",
        saleStartDate: new Date(now.getTime() - 3600000), // 1 hr ago
        saleEndDate: nextWeek
      });
      console.log('Initial Hero Flash Sale campaign seeded successfully!');
    }

    console.log('Data Imported successfully! Products, Categories, Subcategories, Flash Sales and Super Admin injected into MongoDB.');
    process.exit();
  } catch (error) {
    console.error(`Error importing data: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Product.deleteMany({});
    await Category.deleteMany({});
    await SubCategory.deleteMany({});
    await HeroFlashSale.deleteMany({});
    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`Error destroying data: ${error.message}`);
    process.exit(1);
  }
};

connectDB().then(() => {
  if (process.argv[2] === '-d') {
    destroyData();
  } else {
    importData();
  }
});
