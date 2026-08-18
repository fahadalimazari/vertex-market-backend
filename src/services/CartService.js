import Cart from '../models/Cart.js';
import InventoryService from './InventoryService.js';
import PricingService from './PricingService.js';

class CartService {
  /**
   * Get or create a cart for the user
   */
  async getOrCreateCart(userId) {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, products: [] });
    }
    return cart;
  }

  /**
   * Get full cart details including calculated totals
   */
  async getCartDetails(userId) {
    let cart = await this.getOrCreateCart(userId);
    
    // Populate product and variant details
    cart = await Cart.findById(cart._id)
      .populate('products.productId')
      .populate('products.variantId')
      .populate('couponId');

    const validatedProducts = [];
    const warnings = [];

    // Check stock for all items
    for (const item of cart.products) {
      if (!item.productId) {
        // Product no longer exists, skip/remove
        continue;
      }

      const { valid, maxAvailable, product, variant } = await InventoryService.validateStock(
        item.productId._id,
        item.variantId?._id,
        item.quantity
      );

      let updatedQuantity = item.quantity;
      if (!valid) {
        if (maxAvailable === 0) {
          warnings.push(`Item "${item.productId.name}" is out of stock and was removed.`);
          continue; // Do not add to validatedProducts, effectively removing it
        } else {
          updatedQuantity = maxAvailable;
          warnings.push(`Only ${maxAvailable} units of "${item.productId.name}" are available.`);
        }
      }

      validatedProducts.push({
        _id: item._id,
        productId: item.productId,
        variantId: item.variantId,
        sellerId: item.sellerId,
        quantity: updatedQuantity,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        unitPrice: item.unitPrice,
        isAvailable: maxAvailable > 0
      });
    }

    // Update cart products if quantities changed or items were removed
    cart.products = validatedProducts;

    // Calculate totals
    const totals = PricingService.calculateCartTotals(validatedProducts, cart.couponId, cart.shippingAddress);

    // Save totals on Cart document
    cart.subtotal = totals.itemsTotal - totals.discountTotal;
    cart.discount = totals.discountTotal + totals.couponDiscount;
    cart.tax = totals.tax;
    cart.shipping = totals.shippingFee;
    cart.grandTotal = totals.grandTotal;
    await cart.save();

    // Map sub-documents back to snapshots for frontend compatibility
    const formattedItems = validatedProducts.map(item => {
      const p = item.productId;
      const v = item.variantId;
      const prices = PricingService.calculateEffectivePrice(p, v);

      return {
        _id: item._id,
        productId: p._id,
        variantId: v?._id || null,
        sellerId: item.sellerId,
        quantity: item.quantity,
        unitPrice: prices.unitPrice,
        effectivePrice: prices.effectivePrice,
        isAvailable: item.isAvailable,
        snapshotName: p.name,
        snapshotSlug: p.slug,
        snapshotImage: p.image,
        snapshotBrand: p.brand,
        snapshotSKU: v ? v.sku : p.sku,
        snapshotVariant: v ? v.variantName : null
      };
    });

    return {
      cart,
      items: formattedItems,
      summary: {
        itemsTotal: totals.itemsTotal,
        discountTotal: totals.discountTotal,
        couponDiscount: totals.couponDiscount,
        couponWarning: totals.couponWarning,
        shippingFee: totals.shippingFee,
        tax: totals.tax,
        grandTotal: totals.grandTotal,
        currency: "PKR"
      },
      warnings
    };
  }

  /**
   * Add item to cart
   */
  async addToCart(userId, productId, variantId, quantity) {
    const cart = await this.getOrCreateCart(userId);
    
    const { valid, message, maxAvailable, product, variant } = await InventoryService.validateStock(productId, variantId, quantity);
    if (maxAvailable === 0) {
      throw new Error(message || 'Product is out of stock.');
    }
    
    const finalQuantity = valid ? quantity : maxAvailable;
    const prices = PricingService.calculateEffectivePrice(product, variant);

    // Check if product with same variantId is already in cart
    const existingIndex = cart.products.findIndex(
      p => p.productId.toString() === productId.toString() && 
           (!variantId || (p.variantId && p.variantId.toString() === variantId.toString()))
    );

    if (existingIndex > -1) {
      const newQuantity = cart.products[existingIndex].quantity + finalQuantity;
      const revalidation = await InventoryService.validateStock(productId, variantId, newQuantity);
      cart.products[existingIndex].quantity = revalidation.valid ? newQuantity : revalidation.maxAvailable;
      cart.products[existingIndex].unitPrice = prices.unitPrice;
    } else {
      cart.products.push({
        productId,
        variantId: variantId || null,
        sellerId: product.sellerId || null,
        quantity: finalQuantity,
        selectedColor: variant?.color || null,
        selectedSize: variant?.size || null,
        unitPrice: prices.unitPrice
      });
    }

    await cart.save();
    return this.getCartDetails(userId);
  }

  /**
   * Add bundle to cart
   */
  async addBundleToCart(userId, bundleId) {
    const Bundle = (await import('../models/Bundle.js')).default;
    const bundle = await Bundle.findById(bundleId).populate('products');
    if (!bundle || bundle.status !== 'Active') {
      throw new Error('Bundle not found or not active');
    }

    const cart = await this.getOrCreateCart(userId);
    const warnings = [];

    for (const product of bundle.products) {
      const { valid, message, maxAvailable } = await InventoryService.validateStock(product._id, null, 1);
      if (maxAvailable === 0) {
        throw new Error(`Product ${product.name} in bundle is out of stock`);
      }

      const prices = PricingService.calculateEffectivePrice(product, null);
      
      // Calculate bundled unit price (apply bundle discount)
      let finalUnitPrice = prices.unitPrice;
      if (bundle.discountPercentage > 0) {
        finalUnitPrice = finalUnitPrice * (1 - bundle.discountPercentage / 100);
      }

      const existingIndex = cart.products.findIndex(
        p => p.productId.toString() === product._id.toString() && !p.variantId
      );

      if (existingIndex > -1) {
        cart.products[existingIndex].quantity += 1;
        cart.products[existingIndex].unitPrice = finalUnitPrice;
        cart.products[existingIndex].bundleId = bundleId;
      } else {
        cart.products.push({
          productId: product._id,
          variantId: null,
          sellerId: product.sellerId || null,
          quantity: 1,
          unitPrice: finalUnitPrice,
          bundleId: bundleId
        });
      }
    }

    await cart.save();
    return this.getCartDetails(userId);
  }

  /**
   * Update quantity of an item
   */
  async updateQuantity(userId, itemId, quantity) {
    const cart = await this.getOrCreateCart(userId);
    const itemIndex = cart.products.findIndex(p => p._id.toString() === itemId.toString());
    
    if (itemIndex === -1) {
      throw new Error('Item not found in cart.');
    }

    if (quantity <= 0) {
      cart.products.splice(itemIndex, 1);
      await cart.save();
      return this.getCartDetails(userId);
    }

    const item = cart.products[itemIndex];
    const { valid, message, maxAvailable } = await InventoryService.validateStock(item.productId, item.variantId, quantity);
    
    cart.products[itemIndex].quantity = valid ? quantity : maxAvailable;
    await cart.save();
    return this.getCartDetails(userId);
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId, itemId) {
    const cart = await this.getOrCreateCart(userId);
    cart.products = cart.products.filter(p => p._id.toString() !== itemId.toString());
    await cart.save();
    return this.getCartDetails(userId);
  }

  /**
   * Clear active cart
   */
  async clearCart(userId) {
    const cart = await this.getOrCreateCart(userId);
    cart.products = [];
    cart.subtotal = 0;
    cart.discount = 0;
    cart.tax = 0;
    cart.shipping = 0;
    cart.grandTotal = 0;
    cart.couponId = null;
    await cart.save();
    return this.getCartDetails(userId);
  }

  /**
   * Apply Coupon to Cart
   */
  async applyCoupon(userId, couponCode) {
    const Coupon = (await import('../models/Coupon.js')).default;
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!coupon) {
      throw new Error('Invalid coupon code or coupon is inactive');
    }
    const now = new Date();
    if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
      throw new Error('Coupon has expired');
    }
    if (coupon.maxUsage && coupon.currentUsage >= coupon.maxUsage) {
      throw new Error('Coupon usage limit reached');
    }
    
    const cart = await this.getOrCreateCart(userId);
    cart.couponId = coupon._id;
    await cart.save();
    
    return this.getCartDetails(userId);
  }

  /**
   * Remove Coupon from Cart
   */
  async removeCoupon(userId) {
    const cart = await this.getOrCreateCart(userId);
    cart.couponId = null;
    await cart.save();
    return this.getCartDetails(userId);
  }

  /**
   * Update shipping address and calculate rates
   */
  async updateShipping(userId, shippingAddress) {
    const cart = await this.getOrCreateCart(userId);
    cart.shippingAddress = {
      country: shippingAddress.country || '',
      state: shippingAddress.state || '',
      city: shippingAddress.city || '',
      postalCode: shippingAddress.postalCode || ''
    };
    await cart.save();
    return this.getCartDetails(userId);
  }

  /**
   * Move item to Wishlist
   */
  async moveToWishlist(userId, itemId) {
    const Wishlist = (await import('../models/Wishlist.js')).default;
    const cart = await this.getOrCreateCart(userId);
    
    const itemIndex = cart.products.findIndex(p => p._id.toString() === itemId.toString());
    if (itemIndex === -1) {
      throw new Error('Item not found in cart');
    }

    const item = cart.products[itemIndex];

    // Check if already exists in wishlist
    const exists = await Wishlist.findOne({
      userId,
      productId: item.productId,
      variantId: item.variantId
    });

    if (!exists) {
      await Wishlist.create({
        userId,
        productId: item.productId,
        variantId: item.variantId
      });
    }

    // Pull from products array
    cart.products.splice(itemIndex, 1);
    await cart.save();

    return this.getCartDetails(userId);
  }

  /**
   * Merge Guest Cart into User Cart
   */
  async mergeGuestCart(userId, guestItems) {
    const cart = await this.getOrCreateCart(userId);
    const warnings = [];

    for (const guestItem of guestItems) {
      try {
        const { productId, variantId, quantity } = guestItem;
        
        const existingIndex = cart.products.findIndex(
          p => p.productId.toString() === productId.toString() &&
               (!variantId || (p.variantId && p.variantId.toString() === variantId.toString()))
        );

        let targetQuantity = quantity;
        if (existingIndex > -1) {
          targetQuantity += cart.products[existingIndex].quantity;
        }

        const { valid, message, maxAvailable, product, variant } = await InventoryService.validateStock(productId, variantId, targetQuantity);
        if (maxAvailable === 0) {
          warnings.push(`Item ${productId} is no longer available.`);
          continue;
        }

        if (!valid) {
          warnings.push(`Adjusted quantity for ${product.name} to ${maxAvailable}.`);
        }

        const finalQuantity = valid ? targetQuantity : maxAvailable;
        const prices = PricingService.calculateEffectivePrice(product, variant);

        if (existingIndex > -1) {
          cart.products[existingIndex].quantity = finalQuantity;
          cart.products[existingIndex].unitPrice = prices.unitPrice;
        } else {
          cart.products.push({
            productId,
            variantId: variantId || null,
            sellerId: product.sellerId || null,
            quantity: finalQuantity,
            unitPrice: prices.unitPrice
          });
        }
      } catch (err) {
        warnings.push(`Failed to merge item: ${err.message}`);
      }
    }

    await cart.save();
    return this.getCartDetails(userId);
  }
}

export default new CartService();
