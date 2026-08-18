import CartService from '../services/CartService.js';
import CheckoutService from '../services/CheckoutService.js';

// @desc    Get user cart
// @route   GET /api/v1/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    const details = await CartService.getCartDetails(req.user._id);
    res.status(200).json({
      success: true,
      data: {
        cart: details.cart,
        items: details.items,
        savedForLater: [], // Nested cart structure does not have save-for-later status
        summary: details.summary
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user cart count
// @route   GET /api/v1/cart/count
// @access  Private
export const getCartCount = async (req, res) => {
  try {
    const details = await CartService.getCartDetails(req.user._id);
    const count = details.items.reduce((acc, item) => acc + item.quantity, 0);
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/v1/cart/items
// @access  Private
export const addToCart = async (req, res) => {
  try {
    const { productId, variantId, quantity } = req.body;
    const details = await CartService.addToCart(req.user._id, productId, variantId, quantity);
    res.status(201).json({
      success: true,
      data: {
        cart: details.cart,
        items: details.items,
        summary: details.summary
      },
      warning: details.warnings?.[0]
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Add bundle to cart
// @route   POST /api/v1/cart/bundle
// @access  Private
export const addBundleToCart = async (req, res) => {
  try {
    const { bundleId } = req.body;
    const details = await CartService.addBundleToCart(req.user._id, bundleId);
    res.status(201).json({
      success: true,
      data: {
        cart: details.cart,
        items: details.items,
        summary: details.summary
      },
      warning: details.warnings?.[0]
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update item quantity
// @route   PUT /api/v1/cart/items/:id
// @access  Private
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const details = await CartService.updateQuantity(req.user._id, req.params.id, quantity);
    res.status(200).json({
      success: true,
      data: {
        cart: details.cart,
        items: details.items,
        summary: details.summary
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update item status (ACTIVE / SAVED_FOR_LATER)
// @route   PATCH /api/v1/cart/items/status/:id
// @access  Private
export const updateItemStatus = async (req, res) => {
  try {
    // Nested cart schema doesn't support status. Mock return successful response.
    const details = await CartService.getCartDetails(req.user._id);
    res.status(200).json({ success: true, data: details });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/items/:id
// @access  Private
export const removeFromCart = async (req, res) => {
  try {
    const details = await CartService.removeItem(req.user._id, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: {
        cart: details.cart,
        items: details.items,
        summary: details.summary
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Clear active cart
// @route   DELETE /api/v1/cart/clear
// @access  Private
export const clearCart = async (req, res) => {
  try {
    const details = await CartService.clearCart(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: {
        cart: details.cart,
        items: details.items,
        summary: details.summary
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Merge guest cart
// @route   POST /api/v1/cart/merge
// @access  Private
export const mergeCart = async (req, res) => {
  try {
    const { guestItems } = req.body;
    if (!guestItems || !guestItems.length) {
      const details = await CartService.getCartDetails(req.user._id);
      return res.status(200).json({ success: true, data: details });
    }
    const details = await CartService.mergeGuestCart(req.user._id, guestItems);
    res.status(200).json({ success: true, data: details });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Validate Cart
// @route   POST /api/v1/cart/validate
// @access  Private
export const validateCart = async (req, res) => {
  try {
    const details = await CartService.getCartDetails(req.user._id);
    const hasWarnings = details.warnings && details.warnings.length > 0;
    res.status(200).json({ success: true, isValid: !hasWarnings, details });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get Checkout Summary
// @route   GET /api/v1/checkout/summary
// @access  Private
export const getCheckoutSummary = async (req, res) => {
  try {
    const summary = await CheckoutService.getCheckoutSummary(req.user._id);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Apply coupon to cart
// @route   POST /api/v1/cart/apply-coupon
// @access  Private
export const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }
    const details = await CartService.applyCoupon(req.user._id, code);
    res.status(200).json({ success: true, data: details });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Remove coupon from cart
// @route   DELETE /api/v1/cart/remove-coupon
// @access  Private
export const removeCoupon = async (req, res) => {
  try {
    const details = await CartService.removeCoupon(req.user._id);
    res.status(200).json({ success: true, data: details });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update cart shipping details
// @route   POST /api/v1/cart/shipping
// @access  Private
export const updateShipping = async (req, res) => {
  try {
    const { country, state, city, postalCode } = req.body;
    const details = await CartService.updateShipping(req.user._id, { country, state, city, postalCode });
    res.status(200).json({ success: true, data: details });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Move item to wishlist
// @route   POST /api/v1/cart/items/wishlist/:id
// @access  Private
export const moveToWishlist = async (req, res) => {
  try {
    const details = await CartService.moveToWishlist(req.user._id, req.params.id);
    res.status(200).json({ success: true, data: details });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
