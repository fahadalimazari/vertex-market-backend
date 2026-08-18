import mongoose from 'mongoose';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';

const toSlug = (str) => {
  if (!str) return '';
  return String(str).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

export const syncProductTaxonomy = async (product) => {
  try {
    // 1. Resolve Category
    let categoryDoc = null;
    if (product.categoryId && mongoose.Types.ObjectId.isValid(product.categoryId)) {
      categoryDoc = await Category.findById(product.categoryId);
    }
    if (!categoryDoc && product.category) {
      const catName = typeof product.category === 'object' ? product.category.name : product.category;
      const catSlug = toSlug(catName);
      categoryDoc = await Category.findOne({
        $or: [{ name: { $regex: new RegExp(`^${catName}$`, 'i') } }, { slug: catSlug }]
      });
      if (!categoryDoc && catName) {
        try {
          categoryDoc = await Category.create({
            name: catName,
            slug: catSlug || `cat-${Date.now()}`,
            status: 'Active',
            isActive: true
          });
        } catch (e) {
          categoryDoc = await Category.findOne({ slug: catSlug });
        }
      }
    }
    if (categoryDoc) {
      product.categoryId = categoryDoc._id;
      product.category = categoryDoc.name;
    }

    // 2. Resolve SubCategory
    let subCatDoc = null;
    if (product.subCategoryId && mongoose.Types.ObjectId.isValid(product.subCategoryId)) {
      subCatDoc = await SubCategory.findById(product.subCategoryId);
    }
    if (!subCatDoc && product.subCategory && categoryDoc) {
      const subName = typeof product.subCategory === 'object' ? product.subCategory.name : product.subCategory;
      const subSlug = toSlug(subName);
      subCatDoc = await SubCategory.findOne({
        categoryId: categoryDoc._id,
        $or: [{ name: { $regex: new RegExp(`^${subName}$`, 'i') } }, { slug: subSlug }]
      });
      if (!subCatDoc && subName) {
        try {
          subCatDoc = await SubCategory.create({
            categoryId: categoryDoc._id,
            name: subName,
            slug: subSlug || `sub-${Date.now()}`,
            status: 'Active'
          });
        } catch (e) {
          subCatDoc = await SubCategory.findOne({ slug: subSlug });
        }
      }
    }
    if (subCatDoc) {
      product.subCategoryId = subCatDoc._id;
      product.subCategory = subCatDoc.name;
    }

    // 3. Resolve Brand
    let brandDoc = null;
    if (product.brandId && mongoose.Types.ObjectId.isValid(product.brandId)) {
      brandDoc = await Brand.findById(product.brandId);
    }
    if (!brandDoc && product.brand) {
      if (typeof product.brand === 'object' && product.brand._id && mongoose.Types.ObjectId.isValid(product.brand._id)) {
        brandDoc = await Brand.findById(product.brand._id);
      } else if (typeof product.brand === 'string' && mongoose.Types.ObjectId.isValid(product.brand) && product.brand.length === 24) {
        brandDoc = await Brand.findById(product.brand);
      }
      if (!brandDoc) {
        const brandName = typeof product.brand === 'object' ? (product.brand.name || product.brand.label) : String(product.brand);
        const brandSlug = toSlug(brandName);
        if (brandName && brandSlug) {
          brandDoc = await Brand.findOne({
            $or: [{ name: { $regex: new RegExp(`^${brandName}$`, 'i') } }, { slug: brandSlug }]
          });
          if (!brandDoc) {
            try {
              brandDoc = await Brand.create({
                name: brandName,
                slug: brandSlug,
                status: 'Active'
              });
            } catch (e) {
              brandDoc = await Brand.findOne({ slug: brandSlug });
            }
          }
        }
      }
    }
    if (brandDoc) {
      product.brandId = brandDoc._id;
      product.brand = brandDoc.name;
    }

    // 4. Ensure active status if unassigned or Draft during sync
    if (!product.status || product.status === 'Draft') {
      product.status = 'Active';
    }
  } catch (err) {
    console.error('Error syncing product taxonomy:', err.message);
  }
};

let syncPromise = null;
export const syncAllTaxonomies = async () => {
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    try {
      const products = await Product.find({});
      for (const prod of products) {
        let modified = false;
        if (!prod.categoryId || !prod.brandId || prod.status === 'Draft' || !prod.status) {
          await syncProductTaxonomy(prod);
          modified = true;
        }
        if (modified) {
          await prod.save({ validateBeforeSave: false });
        }
      }

      // Update productCount for categories
      const categories = await Category.find({});
      for (const cat of categories) {
        const count = await Product.countDocuments({
          $or: [
            { categoryId: cat._id },
            { category: cat.name },
            { category: cat.slug },
            { category: String(cat._id) }
          ],
          status: { $in: ['Active', 'Published'] }
        });
        
        // Populate embedded subCategories and brands if needed for mega menu
        const subs = await SubCategory.find({ categoryId: cat._id, isDeleted: false, status: 'Active' }).select('id _id name slug displayOrder').lean();
        const subList = subs.map(s => ({ id: s._id || s.id, name: s.name, slug: s.slug }));
        
        // Find distinct brands under this category
        const prodBrands = await Product.find({
          $or: [{ categoryId: cat._id }, { category: cat.name }],
          status: { $in: ['Active', 'Published'] },
          brandId: { $ne: null }
        }).distinct('brandId');
        
        const brandDocs = await Brand.find({ _id: { $in: prodBrands }, status: 'Active' }).select('id _id name slug logo').lean();
        const brandList = brandDocs.map(b => ({ id: b._id || b.id, name: b.name, slug: b.slug, logo: b.logo }));
        
        const updateObj = { productCount: count };
        if (subList.length > 0) updateObj.subCategories = subList;
        if (brandList.length > 0) updateObj.brands = brandList;

        await Category.updateOne({ _id: cat._id }, { $set: updateObj });
      }

      // Update productCount for brands
      const brands = await Brand.find({});
      for (const br of brands) {
        const count = await Product.countDocuments({
          $or: [
            { brandId: br._id },
            { brand: br.name },
            { brand: br.slug },
            { brand: String(br._id) }
          ],
          status: { $in: ['Active', 'Published'] }
        });
        await Brand.updateOne({ _id: br._id }, { $set: { productCount: count } });
      }
    } catch (err) {
      console.error('Error in syncAllTaxonomies:', err.message);
    } finally {
      syncPromise = null;
    }
  })();
  return syncPromise;
};

export default {
  syncProductTaxonomy,
  syncAllTaxonomies
};
