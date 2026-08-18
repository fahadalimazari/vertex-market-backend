class PricingService {
  /**
   * Calculate the effective price of a product or variant
   */
  calculateEffectivePrice(product, variant = null) {
    let basePrice = 0;
    let oldPrice = 0;

    if (product.productType === 'Variable' && variant) {
      basePrice = variant.salePrice || variant.price;
      oldPrice = variant.price;
    } else {
      basePrice = product.discount > 0 ? (product.price - (product.price * product.discount / 100)) : product.price;
      oldPrice = product.price;
    }

    return {
      unitPrice: oldPrice || basePrice,
      effectivePrice: basePrice
    };
  }

  /**
   * Calculate totals for a cart
   */
  calculateCartTotals(products, coupon = null, shippingAddress = null) {
    let itemsTotal = 0;
    let discountTotal = 0;

    products.forEach(item => {
      if (item.productId) {
        const prices = this.calculateEffectivePrice(item.productId, item.variantId);
        const itemTotal = prices.unitPrice * item.quantity;
        const itemEffectiveTotal = prices.effectivePrice * item.quantity;
        
        itemsTotal += itemTotal;
        discountTotal += (itemTotal - itemEffectiveTotal);
      }
    });

    const subTotal = itemsTotal - discountTotal;
    
    // Calculate shipping fee
    let shippingFee = 0;
    if (shippingAddress && shippingAddress.state) {
      const state = shippingAddress.state.toLowerCase();
      if (state.includes('sindh')) {
        shippingFee = 100;
      } else if (state.includes('punjab')) {
        shippingFee = 150;
      } else if (state.includes('kp') || state.includes('khyber') || state.includes('kpk')) {
        shippingFee = 200;
      } else if (state.includes('balochistan')) {
        shippingFee = 250;
      } else {
        shippingFee = 300;
      }

      // Free shipping if order subtotal exceeds 5000 PKR
      if (subTotal > 5000) {
        shippingFee = 0;
      }
    }

    // Calculate tax (5% rate)
    const tax = Math.round(subTotal * 0.05);

    // Calculate coupon discount
    let couponDiscount = 0;
    let couponWarning = null;

    if (coupon) {
      const now = new Date();
      if (!coupon.isActive || (coupon.expiryDate && new Date(coupon.expiryDate) < now)) {
        couponWarning = 'Coupon is expired or inactive';
      } else if (subTotal < coupon.minPurchase) {
        couponWarning = `Minimum purchase of Rs. ${coupon.minPurchase} required for this coupon`;
      } else if (coupon.maxUsage && coupon.currentUsage >= coupon.maxUsage) {
        couponWarning = 'Coupon usage limit reached';
      } else {
        if (coupon.discountType === 'PERCENTAGE') {
          couponDiscount = (subTotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount) {
            couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
          }
        } else if (coupon.discountType === 'FIXED') {
          couponDiscount = Math.min(coupon.discountValue, subTotal);
        } else if (coupon.discountType === 'FREE_SHIPPING') {
          shippingFee = 0;
        }
      }
    }

    const grandTotal = Math.max(0, subTotal - couponDiscount + shippingFee + tax);

    return {
      itemsTotal,
      discountTotal,
      couponDiscount,
      couponWarning,
      shippingFee,
      tax,
      grandTotal,
      currency: "PKR"
    };
  }
}

export default new PricingService();

