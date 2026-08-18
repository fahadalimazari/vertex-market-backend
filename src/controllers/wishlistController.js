import Wishlist from '../models/Wishlist.js';
import CartService from '../services/CartService.js';
import InventoryService from '../services/InventoryService.js';
import PricingService from '../services/PricingService.js';

// @desc    Get user wishlist
// @route   GET /api/v1/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
  try {
    const wishlistItems = await Wishlist.find({ userId: req.user._id })
      .populate('productId variantId')
      .lean();
      
    // Filter out items where productId is null (product was deleted)
    const validItems = wishlistItems.filter(item => item.productId != null);
      
    // Format response and check stock/availability
    const formatted = await Promise.all(validItems.map(async (item) => {
      const { valid, maxAvailable } = await InventoryService.validateStock(
        item.productId._id, 
        item.variantId?._id, 
        1
      );
      
      const prices = PricingService.calculateEffectivePrice(item.productId, item.variantId);
      
      return {
        _id: item._id,
        productId: item.productId._id,
        variantId: item.variantId?._id,
        name: item.productId.name,
        slug: item.productId.slug,
        image: item.productId.image,
        variantName: item.variantId?.variantName,
        price: prices.unitPrice,
        effectivePrice: prices.effectivePrice,
        inStock: maxAvailable > 0,
        createdAt: item.createdAt
      };
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user wishlist count
// @route   GET /api/v1/wishlist/count
// @access  Private
export const getWishlistCount = async (req, res) => {
  try {
    const count = await Wishlist.countDocuments({ userId: req.user._id });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add item to wishlist
// @route   POST /api/v1/wishlist
// @access  Private
export const addToWishlist = async (req, res) => {
  try {
    const { productId, variantId } = req.body;
    
    // Check if already exists
    const exists = await Wishlist.findOne({ 
      userId: req.user._id, 
      productId, 
      variantId: variantId || null 
    });
    
    if (exists) {
      return res.status(400).json({ success: false, message: 'Item already in wishlist' });
    }

    const item = await Wishlist.create({
      userId: req.user._id,
      productId,
      variantId: variantId || null
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    // Handle uniqueness error dynamically
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Item already in wishlist' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Remove from wishlist
// @route   DELETE /api/v1/wishlist/:id
// @access  Private
export const removeFromWishlist = async (req, res) => {
  try {
    await Wishlist.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.status(200).json({ success: true, message: 'Item removed from wishlist' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Move wishlist item to cart
// @route   POST /api/v1/wishlist/move-to-cart/:id
// @access  Private
export const moveToCart = async (req, res) => {
  try {
    const wishlistItem = await Wishlist.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!wishlistItem) {
      return res.status(404).json({ success: false, message: 'Wishlist item not found' });
    }

    // Add to Cart
    const { item, warning } = await CartService.addToCart(
      req.user._id, 
      wishlistItem.productId, 
      wishlistItem.variantId, 
      1
    );

    // If stock validation completely failed (maxAvailable === 0), it throws in CartService
    
    // Remove from Wishlist
    await wishlistItem.deleteOne();

    res.status(200).json({ success: true, data: item, warning });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
