import Product from '../models/Product.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import Attribute from '../models/Attribute.js';
import ProductVariant from '../models/ProductVariant.js';

class CatalogRepository {
  /**
   * Build the base aggregation pipeline for finding products and joining their minimum variant price.
   * This pipeline computes `effectivePrice` (lowest available price).
   */
  buildBasePipeline(filters = {}, fallbackSearch = false) {
    const matchStage = {
      $match: {
        // Exclude drafts/inactive products globally if needed, assuming default status is handled
        // We'll trust the caller to pass visibility rules inside filters
      }
    };

    // Apply basic visibility rules (mocked out for now, add exact logic if status fields exist)
    // matchStage.$match.status = 'Active';

    const pipeline = [];

    // 1. Search Pipeline (Brand Lookup + Multi-token Match + Scoring)
    if (filters.search) {
      // Lookup brands so we can search by brand name
      pipeline.push({
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brandData'
        }
      });

      const tokens = filters.search.split(' ').filter(t => t.trim().length > 0);
      
      const tokenConditions = tokens.map(token => {
        const searchRegex = new RegExp(token, 'i');
        return {
          $or: [
            { name: searchRegex },
            { 'brandData.name': searchRegex },
            { category: searchRegex },
            { subCategory: searchRegex },
            { sku: searchRegex },
            { tags: searchRegex },
            { searchKeywords: searchRegex },
            { highlights: searchRegex }
          ]
        };
      });

      // Strict matching uses $and (all words must match). Fallback uses $or (any word can match).
      pipeline.push({ $match: { [fallbackSearch ? '$or' : '$and']: tokenConditions } });

      // Add a searchScore for ranking
      // Using simple exact match and partial match on full search term
      const exactRegex = new RegExp(`^${filters.search}$`, 'i');
      const partialRegex = new RegExp(filters.search, 'i');
      pipeline.push({
        $addFields: {
          searchScore: {
            $add: [
              { $cond: [{ $regexMatch: { input: { $ifNull: ["$name", ""] }, regex: exactRegex } }, 100, 0] },
              { $cond: [{ $regexMatch: { input: { $ifNull: ["$name", ""] }, regex: partialRegex } }, 50, 0] }
            ]
          }
        }
      });
    }

    // 2. Base Match Stage for other filters
    const baseMatchStage = { $match: {} };
    if (filters.category) {
      baseMatchStage.$match.category = filters.category;
    }
    if (filters.subCategory) {
      baseMatchStage.$match.subCategory = filters.subCategory;
    }
    if (Object.keys(baseMatchStage.$match).length > 0) {
      pipeline.push(baseMatchStage);
    }

    // Join variants to calculate lowest price & availability
    pipeline.push({
      $lookup: {
        from: 'productvariants', // Ensure this matches actual collection name
        localField: '_id',
        foreignField: 'productId',
        as: 'variantData'
      }
    });

    // Compute effective price and total stock
    pipeline.push({
      $addFields: {
        effectivePrice: {
          $cond: {
            if: { $eq: ['$productType', 'Variable'] },
            then: { 
              $min: {
                $map: {
                  input: {
                    $filter: {
                      input: '$variantData',
                      as: 'v',
                      cond: { $and: [ { $eq: ['$$v.status', 'Active'] }, { $gt: ['$$v.stock', 0] } ] }
                    }
                  },
                  as: 'v',
                  in: { $ifNull: ['$$v.salePrice', '$$v.price'] }
                }
              }
            },
            else: { $ifNull: ['$salePrice', '$price'] }
          }
        },
        totalAvailableStock: {
          $cond: {
            if: { $eq: ['$productType', 'Variable'] },
            then: { $sum: '$variantData.stock' },
            else: '$stock'
          }
        }
      }
    });

    // If a variable product has no active variants in stock, fallback to default price for display
    pipeline.push({
      $addFields: {
        effectivePrice: {
          $cond: {
            if: { $eq: ['$effectivePrice', null] },
            then: { $ifNull: ['$salePrice', '$price'] },
            else: '$effectivePrice'
          }
        }
      }
    });

    // Apply price filters
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      const priceMatch = {};
      if (filters.priceMin !== undefined) priceMatch.$gte = Number(filters.priceMin);
      if (filters.priceMax !== undefined) priceMatch.$lte = Number(filters.priceMax);
      pipeline.push({
        $match: { effectivePrice: priceMatch }
      });
    }

    // Availability Filter
    if (filters.availability === 'in-stock') {
      pipeline.push({ $match: { totalAvailableStock: { $gt: 0 } } });
    } else if (filters.availability === 'out-of-stock') {
      pipeline.push({ $match: { totalAvailableStock: { $lte: 0 } } });
    }

    return pipeline;
  }

  async getProducts(filters, sortMapping, page = 1, limit = 12, fallbackSearch = false) {
    const pipeline = this.buildBasePipeline(filters, fallbackSearch);

    // Apply sorting
    if (sortMapping) {
      pipeline.push({ $sort: sortMapping });
    } else if (filters.search) {
      pipeline.push({ $sort: { searchScore: -1, createdAt: -1 } });
    } else {
      pipeline.push({ $sort: { createdAt: -1 } }); // Default newest
    }

    // Apply pagination
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: Number(limit) });

    // Execute aggregation
    return await Product.aggregate(pipeline);
  }

  async countProducts(filters, fallbackSearch = false) {
    const pipeline = this.buildBasePipeline(filters, fallbackSearch);
    pipeline.push({ $count: 'total' });
    const result = await Product.aggregate(pipeline);
    return result.length > 0 ? result[0].total : 0;
  }

  async getFacetedFilters(filters, fallbackSearch = false) {
    const pipeline = this.buildBasePipeline(filters, fallbackSearch);
    
    pipeline.push({
      $facet: {
        categories: [
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ],
        brands: [
          { $unwind: { path: '$brandData', preserveNullAndEmptyArrays: true } },
          { $group: { _id: '$brand', name: { $first: '$brandData.name' }, count: { $sum: 1 } } }
        ],
        priceRange: [
          { $group: { _id: null, min: { $min: '$effectivePrice' }, max: { $max: '$effectivePrice' } } }
        ],
        ratings: [
          { $group: { _id: { $floor: '$rating' }, count: { $sum: 1 } } }
        ],
        availability: [
          { 
            $group: { 
              _id: { $cond: [{ $gt: ['$totalAvailableStock', 0] }, 'In Stock', 'Out of Stock'] },
              count: { $sum: 1 }
            } 
          }
        ],
        discounts: [
          {
            $group: {
              _id: {
                $cond: [
                  { $gte: ['$discount', 50] }, '50%+',
                  { $cond: [{ $gte: ['$discount', 30] }, '30%+',
                    { $cond: [{ $gte: ['$discount', 20] }, '20%+',
                      { $cond: [{ $gte: ['$discount', 10] }, '10%+', 'No Discount'] }
                    ]}
                  ]}
                ]
              },
              count: { $sum: 1 }
            }
          }
        ]
      }
    });

    const result = await Product.aggregate(pipeline);
    return result[0];
  }

  async getDynamicFilters(categoryId, subCategoryId) {
    // Return attributes marked as filterable
    const matchQuery = { filterable: true };
    if (subCategoryId) {
      matchQuery.subCategories = subCategoryId;
    } else if (categoryId) {
      matchQuery.categories = categoryId;
    }

    const attributes = await Attribute.find(matchQuery).populate('values').lean();
    return attributes;
  }
}

export default new CatalogRepository();
