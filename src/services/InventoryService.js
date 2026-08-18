import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import Seller from '../models/Seller.js';

class InventoryService {
  /**
   * Validate if a product and its variant (if applicable) are available and have sufficient stock.
   */
  async validateStock(productId, variantId, requestedQuantity) {
    const product = await Product.findById(productId).lean();
    if (!product) {
      return { valid: false, message: 'Product not found', maxAvailable: 0 };
    }

    // Product Level Validations
    // In a real system, we'd also check `status` or `isPublished` if they exist.
    // For now we check category and seller active status if applicable.
    if (product.category) {
      const category = await Category.findOne({ name: product.category }).lean();
      if (category && category.status === 'Inactive') {
        return { valid: false, message: 'Product category is currently inactive', maxAvailable: 0 };
      }
    }

    if (product.sellerId) {
      const seller = await Seller.findById(product.sellerId).lean();
      if (!seller || seller.status !== 'Approved') {
        return { valid: false, message: 'Seller is currently inactive', maxAvailable: 0 };
      }
    }

    // Stock checking logic
    let availableStock = 0;
    
    if (product.productType === 'Variable') {
      if (!variantId) {
        return { valid: false, message: 'Variant ID is required for variable products', maxAvailable: 0 };
      }
      const variant = await ProductVariant.findById(variantId).lean();
      if (!variant || variant.status === 'Inactive') {
        return { valid: false, message: 'Product variant is inactive or not found', maxAvailable: 0 };
      }
      
      // Calculate effective available stock considering reservations
      availableStock = variant.stock - (variant.reservedStock || 0);
      
    } else {
      // Simple product
      availableStock = product.stock - (product.reservedStock || 0);
    }

    if (requestedQuantity > availableStock) {
      return { 
        valid: false, 
        message: `Only ${availableStock} units available`, 
        maxAvailable: availableStock,
        product,
        variant: variantId ? await ProductVariant.findById(variantId).lean() : null
      };
    }

    return { 
      valid: true, 
      maxAvailable: availableStock,
      product,
      variant: variantId ? await ProductVariant.findById(variantId).lean() : null
    };
  }
}

export default new InventoryService();
