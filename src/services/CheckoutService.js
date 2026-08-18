import CartService from './CartService.js';
import PricingService from './PricingService.js';

class CheckoutService {
  /**
   * Get the checkout summary structure.
   */
  async getCheckoutSummary(userId) {
    const { items, summary } = await CartService.getCartDetails(userId);
    
    // Filter to only active items, getCartDetails already calculates valid totals.
    const activeItems = items.filter(item => item.status === 'ACTIVE' && item.isAvailable);

    if (activeItems.length === 0) {
      throw new Error('Your cart is empty or items are no longer available.');
    }

    // summary is already calculated in CartService.getCartDetails
    // Return complete structure as required
    return {
      itemsTotal: summary.itemsTotal,
      discountTotal: summary.discountTotal,
      couponDiscount: summary.couponDiscount,
      shippingFee: summary.shippingFee,
      tax: summary.tax,
      grandTotal: summary.grandTotal,
      currency: summary.currency
    };
  }
}

export default new CheckoutService();
