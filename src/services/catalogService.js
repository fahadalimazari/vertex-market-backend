import catalogRepository from '../repositories/catalogRepository.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';

class CatalogService {
  /**
   * Helper to map query sort keys to MongoDB sort objects.
   */
  getSortMapping(sortKey) {
    const mappings = {
      featured: { isFeatured: -1, sortOrder: -1 },
      newest: { createdAt: -1 },
      priceAsc: { effectivePrice: 1 },
      priceDesc: { effectivePrice: -1 },
      'a-z': { name: 1 },
      'z-a': { name: -1 },
      highestRated: { rating: -1 }
    };
    return mappings[sortKey] || { createdAt: -1 };
  }

  /**
   * Main method to get products for the catalog.
   */
  async getProducts(queryParams) {
    const {
      search,
      categorySlug,
      subCategorySlug,
      priceMin,
      priceMax,
      availability,
      sort,
      page = 1,
      limit = 12
    } = queryParams;

    const filters = { search, priceMin, priceMax, availability };

    // Resolve Category Slug
    if (categorySlug && categorySlug !== 'all') {
      const cat = await Category.findOne({ slug: categorySlug }).lean();
      if (cat) filters.category = cat._id.toString();
    }

    // Resolve SubCategory Slug
    if (subCategorySlug) {
      const subCat = await SubCategory.findOne({ slug: subCategorySlug }).lean();
      if (subCat) filters.subCategory = subCat._id.toString();
    }

    const sortMapping = this.getSortMapping(sort);

    let [products, total] = await Promise.all([
      catalogRepository.getProducts(filters, sortMapping, page, limit),
      catalogRepository.countProducts(filters)
    ]);

    // Fallback logic for Smart Search
    // If strict token matching yields 0 results and it's a search, try with fallbackSearch = true (OR matching)
    if (total === 0 && filters.search) {
      const fallbackResults = await Promise.all([
        catalogRepository.getProducts(filters, sortMapping, page, limit, true),
        catalogRepository.countProducts(filters, true)
      ]);
      products = fallbackResults[0];
      total = fallbackResults[1];
    }

    // Format products for listing cards
    const formattedProducts = products.map(p => ({
      _id: p._id,
      name: p.name,
      slug: p.slug,
      image: p.image,
      rating: p.rating,
      reviews: p.reviews,
      brand: p.brand,
      isFeatured: p.isFeatured,
      isVariable: p.productType === 'Variable',
      price: p.effectivePrice,
      oldPrice: p.oldPrice,
      discount: p.discount,
      inStock: p.totalAvailableStock > 0
    }));

    return {
      products: formattedProducts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get dynamic filters based on context.
   */
  async getFilters(queryParams) {
    const { search, categorySlug, subCategorySlug } = queryParams;
    let filtersParams = { search };

    if (categorySlug && categorySlug !== 'all') {
      const cat = await Category.findOne({ slug: categorySlug }).lean();
      if (cat) filtersParams.category = cat._id.toString();
    }

    if (subCategorySlug) {
      const subCat = await SubCategory.findOne({ slug: subCategorySlug }).lean();
      if (subCat) filtersParams.subCategory = subCat._id.toString();
    }

    // Attempt to get faceted results. If 0 products, try fallback search
    let facetData = await catalogRepository.getFacetedFilters(filtersParams);
    
    // Check if we need fallback logic (if this is a search and we got 0 total products)
    const categoryCount = facetData.categories.reduce((acc, curr) => acc + curr.count, 0);
    if (categoryCount === 0 && search) {
      facetData = await catalogRepository.getFacetedFilters(filtersParams, true);
    }

    const filters = [];

    // Categories
    if (facetData.categories && facetData.categories.length > 0) {
      filters.push({
        attribute: 'Category',
        code: 'category',
        options: facetData.categories.map(c => ({ label: c._id || 'Uncategorized', value: c._id || 'uncategorized', count: c.count }))
      });
    }

    // Brands
    if (facetData.brands && facetData.brands.length > 0) {
      filters.push({
        attribute: 'Brand',
        code: 'brand',
        options: facetData.brands.filter(b => b._id).map(b => ({ label: b.name || b._id.toString(), value: b._id.toString(), count: b.count }))
      });
    }

    // Price Range (Not a traditional multi-select, so pass max/min separately or as a special filter)
    if (facetData.priceRange && facetData.priceRange.length > 0 && facetData.priceRange[0]._id === null) {
      const { min, max } = facetData.priceRange[0];
      filters.push({
        attribute: 'Price Range',
        code: 'price',
        isRange: true,
        min: min || 0,
        max: max || 1000000
      });
    }

    // Ratings
    if (facetData.ratings && facetData.ratings.length > 0) {
      filters.push({
        attribute: 'Rating',
        code: 'rating',
        options: facetData.ratings.filter(r => r._id !== null).map(r => ({ label: `${r._id} Stars & Up`, value: r._id, count: r.count })).sort((a,b) => b.value - a.value)
      });
    }

    // Availability
    if (facetData.availability && facetData.availability.length > 0) {
      filters.push({
        attribute: 'Availability',
        code: 'availability',
        options: facetData.availability.map(a => ({ label: a._id, value: a._id.toLowerCase().replace(/ /g, '-'), count: a.count }))
      });
    }

    // Discounts
    if (facetData.discounts && facetData.discounts.length > 0) {
      filters.push({
        attribute: 'Discount',
        code: 'discount',
        options: facetData.discounts.filter(d => d._id !== 'No Discount').map(d => ({ label: d._id, value: d._id.replace('%+', ''), count: d.count }))
      });
    }

    return filters;
  }

  /**
   * Suggestions API (Preparation for future)
   */
  async getSuggestions(query) {
    // Return empty structured response as requested
    return {
      products: [],
      categories: [],
      brands: [],
      keywords: []
    };
  }
}

export default new CatalogService();
