import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import Category from './src/models/Category.js';
import SubCategory from './src/models/SubCategory.js';
import Attribute from './src/models/Attribute.js';
import AttributeValue from './src/models/AttributeValue.js';

dotenv.config();

const taxonomyData = [
  {
    category: { name: "Electronics", slug: "electronics", description: "All consumer electronics, computer parts and smart devices", icon: "FiMonitor" },
    subCategories: [
      "Mobile Phones", "Tablets", "Laptops", "Desktop PCs", "Monitors", "Keyboards", "Mouse", "Speakers",
      "Headphones", "Earbuds", "Smart Watches", "Smart Bands", "Cameras", "Printers", "Routers", "SSD",
      "HDD", "Graphics Cards", "Processors", "RAM", "Power Banks", "Chargers", "Cables", "Projectors"
    ],
    attributes: [
      { name: "Brand", code: "brand", inputType: "Dropdown", required: true, options: ["Apple", "Samsung", "Sony", "Dell", "HP", "Logitech", "Intel", "AMD", "NVIDIA", "Xiaomi"] },
      { name: "Model", code: "model", inputType: "Text Field", required: false },
      { name: "Colour", code: "colour", inputType: "Dropdown", required: false, options: ["Black", "White", "Silver", "Space Gray", "Blue", "Red", "Gold"] },
      { name: "Storage", code: "storage", inputType: "Dropdown", required: false, options: ["128 GB", "256 GB", "512 GB", "1 TB", "2 TB"] },
      { name: "RAM", code: "ram", inputType: "Dropdown", required: false, options: ["8 GB", "16 GB", "32 GB", "64 GB"] },
      { name: "Processor", code: "processor", inputType: "Text Field", required: false },
      { name: "GPU", code: "gpu", inputType: "Text Field", required: false },
      { name: "Display Size", code: "display_size", inputType: "Text Field", required: false },
      { name: "Resolution", code: "resolution", inputType: "Dropdown", required: false, options: ["1080p Full HD", "1440p Quad HD", "4K Ultra HD"] },
      { name: "Refresh Rate", code: "refresh_rate", inputType: "Dropdown", required: false, options: ["60 Hz", "120 Hz", "144 Hz", "240 Hz"] },
      { name: "Battery Capacity", code: "battery_capacity", inputType: "Text Field", required: false },
      { name: "Operating System", code: "os", inputType: "Dropdown", required: false, options: ["iOS", "Android", "Windows", "macOS", "Linux"] },
      { name: "Connectivity", code: "connectivity", inputType: "Checkbox", required: false, options: ["Wi-Fi", "Bluetooth", "NFC", "5G", "GPS"] },
      { name: "Ports", code: "ports", inputType: "Text Field", required: false },
      { name: "Warranty", code: "warranty", inputType: "Dropdown", required: false, options: ["No Warranty", "6 Months Local", "1 Year Brand Warranty", "2 Year Brand Warranty"] },
      { name: "Weight", code: "weight", inputType: "Text Field", required: false },
      { name: "Dimensions", code: "dimensions", inputType: "Text Field", required: false }
    ]
  },
  {
    category: { name: "Fashion", slug: "fashion", description: "Trendy clothes, shoes, bags and jewellery", icon: "FiUser" },
    subCategories: [
      "Men's Clothing", "Women's Clothing", "Kids Clothing", "Shoes", "Sandals", "Sneakers", "Watches", "Bags", "Wallets", "Sunglasses", "Jewellery"
    ],
    attributes: [
      { name: "Brand", code: "brand", inputType: "Dropdown", required: true, options: ["Nike", "Adidas", "Puma", "Zara", "Gucci", "Levis", "Casio", "Rolex", "Local Brand"] },
      { name: "Gender", code: "gender", inputType: "Radio", required: true, options: ["Men", "Women", "Unisex", "Kids"] },
      { name: "Size", code: "size", inputType: "Dropdown", required: true, options: ["XS", "S", "M", "L", "XL", "XXL", "38", "39", "40", "41", "42", "43", "44"] },
      { name: "Colour", code: "colour", inputType: "Dropdown", required: true, options: ["Black", "White", "Red", "Blue", "Green", "Yellow", "Pink", "Beige", "Grey"] },
      { name: "Material", code: "material", inputType: "Dropdown", required: false, options: ["Cotton", "Polyester", "Leather", "Denim", "Silk", "Wool", "Gold Plated"] },
      { name: "Pattern", code: "pattern", inputType: "Dropdown", required: false, options: ["Solid", "Striped", "Printed", "Plaid", "Checked"] },
      { name: "Style", code: "style", inputType: "Text Field", required: false },
      { name: "Fit", code: "fit", inputType: "Dropdown", required: false, options: ["Regular Fit", "Slim Fit", "Loose Fit", "Skinny Fit"] },
      { name: "Sleeve Type", code: "sleeve_type", inputType: "Dropdown", required: false, options: ["Short Sleeve", "Long Sleeve", "Sleeveless"] },
      { name: "Neck Type", code: "neck_type", inputType: "Dropdown", required: false, options: ["Crew Neck", "V-Neck", "Collar", "Hooded"] },
      { name: "Fabric", code: "fabric", inputType: "Text Field", required: false },
      { name: "Season", code: "season", inputType: "Checkbox", required: false, options: ["Summer", "Winter", "Spring/Autumn", "All Seasons"] },
      { name: "Occasion", code: "occasion", inputType: "Dropdown", required: false, options: ["Casual", "Formal", "Sports", "Party Wear"] }
    ]
  },
  {
    category: { name: "Beauty", slug: "beauty", description: "Skincare, cosmetics and hair products", icon: "FiActivity" },
    subCategories: [
      "Makeup", "Skincare", "Hair Care", "Perfumes", "Body Care"
    ],
    attributes: [
      { name: "Brand", code: "brand", inputType: "Dropdown", required: true, options: ["L'Oreal", "Maybelline", "The Ordinary", "Nivea", "Dove", "Chanel", "Dior"] },
      { name: "Skin Type", code: "skin_type", inputType: "Checkbox", required: false, options: ["All Skin Types", "Dry Skin", "Oily Skin", "Sensitive Skin", "Combination Skin"] },
      { name: "Hair Type", code: "hair_type", inputType: "Checkbox", required: false, options: ["All Hair Types", "Dry Hair", "Oily Hair", "Curly", "Straight"] },
      { name: "Volume", code: "volume", inputType: "Dropdown", required: false, options: ["30 ml", "50 ml", "100 ml", "150 ml", "250 ml", "500 ml"] },
      { name: "Ingredients", code: "ingredients", inputType: "Textarea", required: false },
      { name: "Fragrance", code: "fragrance", inputType: "Text Field", required: false },
      { name: "Expiry Date", code: "expiry_date", inputType: "Text Field", required: false },
      { name: "Gender", code: "gender", inputType: "Dropdown", required: false, options: ["Unisex", "Men", "Women"] }
    ]
  },
  {
    category: { name: "Home & Kitchen", slug: "home-and-kitchen", description: "Furniture, home decor and appliances", icon: "FiHome" },
    subCategories: [
      "Furniture", "Kitchen Appliances", "Cookware", "Dining", "Home Decor", "Storage", "Bedding", "Lighting"
    ],
    attributes: [
      { name: "Brand", code: "brand", inputType: "Dropdown", required: true, options: ["Philips", "Panasonic", "IKEA", "Dawlance", "Haier", "Kenwood", "Local Craft"] },
      { name: "Material", code: "material", inputType: "Dropdown", required: false, options: ["Wood", "Plastic", "Stainless Steel", "Glass", "Ceramic", "Cotton"] },
      { name: "Colour", code: "colour", inputType: "Dropdown", required: false, options: ["Brown", "White", "Black", "Silver", "Red", "Grey"] },
      { name: "Dimensions", code: "dimensions", inputType: "Text Field", required: false },
      { name: "Weight", code: "weight", inputType: "Text Field", required: false },
      { name: "Capacity", code: "capacity", inputType: "Text Field", required: false },
      { name: "Power", code: "power", inputType: "Text Field", required: false },
      { name: "Voltage", code: "voltage", inputType: "Dropdown", required: false, options: ["220V", "110V", "Battery Operated"] },
      { name: "Warranty", code: "warranty", inputType: "Dropdown", required: false, options: ["No Warranty", "1 Year Local Warranty", "2 Year Brand Warranty"] }
    ]
  },
  {
    category: { name: "Grocery", slug: "grocery", description: "Daily household items and food supplies", icon: "FiShoppingCart" },
    subCategories: [
      "Rice", "Flour", "Cooking Oil", "Beverages", "Snacks", "Dairy", "Frozen Food"
    ],
    attributes: [
      { name: "Brand", code: "brand", inputType: "Dropdown", required: true, options: ["National", "Nestle", "Lipton", "Knorr", "Dalda", "Sufi", "Local Mills"] },
      { name: "Weight", code: "weight", inputType: "Dropdown", required: false, options: ["500g", "1kg", "5kg", "10kg"] },
      { name: "Volume", code: "volume", inputType: "Dropdown", required: false, options: ["250ml", "500ml", "1L", "5L"] },
      { name: "Expiry Date", code: "expiry_date", inputType: "Text Field", required: true },
      { name: "Ingredients", code: "ingredients", inputType: "Textarea", required: false },
      { name: "Storage Instructions", code: "storage_instructions", inputType: "Dropdown", required: false, options: ["Keep in dry place", "Refrigerate after opening", "Keep frozen below -18C"] }
    ]
  },
  {
    category: { name: "Sports & Outdoors", slug: "sports-and-outdoors", description: "Athletic accessories and outdoor gear", icon: "FiDribbble" },
    subCategories: [
      "Cricket", "Football", "Gym Equipment", "Cycling", "Camping"
    ],
    attributes: [
      { name: "Brand", code: "brand", inputType: "Dropdown", required: true, options: ["CA Sports", "Kookaburra", "Adidas", "Nike", "Decathlon", "Shimano", "Coleman"] },
      { name: "Material", code: "material", inputType: "Dropdown", required: false, options: ["English Willow", "Leather", "Carbon Fiber", "Aluminium", "Nylon"] },
      { name: "Size", code: "size", inputType: "Dropdown", required: false, options: ["Standard", "Short Handle", "Full Size", "Small", "Medium", "Large"] },
      { name: "Weight", code: "weight", inputType: "Text Field", required: false },
      { name: "Colour", code: "colour", inputType: "Dropdown", required: false, options: ["Red", "White", "Blue", "Black", "Yellow"] },
      { name: "Sport Type", code: "sport_type", inputType: "Dropdown", required: true, options: ["Cricket", "Football", "Fitness", "Cycling", "Camping"] }
    ]
  },
  {
    category: { name: "Automotive", slug: "automotive", description: "Car and bike spare parts and interior utilities", icon: "FiSettings" },
    subCategories: [
      "Car Accessories", "Bike Accessories", "Engine Oil", "Tyres", "Batteries"
    ],
    attributes: [
      { name: "Brand", code: "brand", inputType: "Dropdown", required: true, options: ["Mobil", "Shell", "Bridgestone", "Michelin", "AGS", "Exide", "Yamaha", "Suzuki", "Honda"] },
      { name: "Vehicle Type", code: "vehicle_type", inputType: "Dropdown", required: true, options: ["Car", "Motorcycle", "Truck", "SUV"] },
      { name: "Compatibility", code: "compatibility", inputType: "Text Field", required: false },
      { name: "Model", code: "model", inputType: "Text Field", required: false },
      { name: "Capacity", code: "capacity", inputType: "Text Field", required: false },
      { name: "Warranty", code: "warranty", inputType: "Dropdown", required: false, options: ["No Warranty", "6 Months Warranty", "1 Year Brand Warranty"] }
    ]
  },
  {
    category: { name: "Books", slug: "books", description: "Educational, business and narrative books", icon: "FiBookOpen" },
    subCategories: [
      "Academic", "Novels", "Comics", "Business", "Programming", "Islamic Books"
    ],
    attributes: [
      { name: "Author", code: "author", inputType: "Text Field", required: true },
      { name: "Publisher", code: "publisher", inputType: "Text Field", required: true },
      { name: "Language", code: "language", inputType: "Dropdown", required: true, options: ["English", "Urdu", "Arabic", "French", "Spanish"] },
      { name: "ISBN", code: "isbn", inputType: "Text Field", required: false },
      { name: "Number of Pages", code: "pages", inputType: "Number Input", required: false },
      { name: "Edition", code: "edition", inputType: "Text Field", required: false },
      { name: "Publication Year", code: "pub_year", inputType: "Number Input", required: false }
    ]
  },
  {
    category: { name: "Toys & Baby", slug: "toys-and-baby", description: "Baby outfits, accessories and childhood toys", icon: "FiHeart" },
    subCategories: [
      "Baby Clothing", "Baby Care", "Toys", "Educational Toys", "Strollers"
    ],
    attributes: [
      { name: "Brand", code: "brand", inputType: "Dropdown", required: true, options: ["Lego", "Hot Wheels", "Fisher-Price", "Johnson's Baby", "Pampers", "Chicco"] },
      { name: "Age Group", code: "age_group", inputType: "Dropdown", required: true, options: ["0-6 Months", "6-12 Months", "1-3 Years", "3-5 Years", "5-8 Years", "8+ Years"] },
      { name: "Material", code: "material", inputType: "Dropdown", required: false, options: ["Plastic", "Wood", "Silicon", "Cotton", "Metal"] },
      { name: "Colour", code: "colour", inputType: "Dropdown", required: false, options: ["Blue", "Pink", "Yellow", "Green", "Red", "Multi-colour"] },
      { name: "Safety Certification", code: "safety_cert", inputType: "Dropdown", required: false, options: ["Certified Safe (EN71)", "ASTM Certified", "CE Certified"] }
    ]
  },
  {
    category: { name: "Health", slug: "health", description: "Supplements, vitamins and personal healthcare devices", icon: "FiActivity" },
    subCategories: [
      "Vitamins", "Medical Devices", "Personal Care", "Fitness Supplements"
    ],
    attributes: [
      { name: "Brand", code: "brand", inputType: "Dropdown", required: true, options: ["Sensodyne", "GNC", "Optimum Nutrition", "Omron", "Dettol", "Centrum"] },
      { name: "Weight", code: "weight", inputType: "Text Field", required: false },
      { name: "Ingredients", code: "ingredients", inputType: "Textarea", required: false },
      { name: "Expiry Date", code: "expiry_date", inputType: "Text Field", required: true },
      { name: "Dosage", code: "dosage", inputType: "Text Field", required: false },
      { name: "Manufacturer", code: "manufacturer", inputType: "Text Field", required: false }
    ]
  }
];

const seedTaxonomy = async () => {
  try {
    await connectDB();

    console.log("Clearing existing taxonomy collections...");
    await Category.deleteMany();
    await SubCategory.deleteMany();
    await Attribute.deleteMany();
    await AttributeValue.deleteMany();

    console.log("Seeding new enterprise taxonomy...");

    for (const data of taxonomyData) {
      // 1. Create Category
      const cat = await Category.create({
        ...data.category,
        status: "Active"
      });
      console.log(`Created Category: ${cat.name}`);

      // 2. Create SubCategories and link to Category
      for (const subName of data.subCategories) {
        const subSlug = subName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const sub = await SubCategory.create({
          categoryId: cat._id,
          name: subName,
          slug: subSlug,
          status: "Active"
        });

        // 3. Create Attributes for this SubCategory
        for (const attrData of data.attributes) {
          const attr = await Attribute.create({
            subCategoryId: sub._id,
            name: attrData.name,
            code: `${subSlug}_${attrData.code}`,
            attributeGroup: "General",
            inputType: attrData.inputType,
            dataType: "Text",
            required: attrData.required,
            status: "Active"
          });

          // 4. Create Attribute Values if options are present
          if (attrData.options) {
            for (const option of attrData.options) {
              await AttributeValue.create({
                attributeId: attr._id,
                label: option,
                value: option.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                status: "Active"
              });
            }
          }
        }
      }
    }

    console.log("Enterprise taxonomy successfully seeded!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed taxonomy:", error);
    process.exit(1);
  }
};

seedTaxonomy();
