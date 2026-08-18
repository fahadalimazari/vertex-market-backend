import Order from '../models/Order.js';
import { sendResponse } from '../utils/responseFormatter.js';

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 */
export const addOrderItems = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      res.status(400);
      throw new Error('No order items');
    } else {
      // Generate a unique order number
      const generatedOrderNumber = 'ORD-' + Date.now().toString() + '-' + Math.floor(1000 + Math.random() * 9000);

      const order = new Order({
        orderNumber: generatedOrderNumber,
        orderItems,
        user: req.user._id,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        status: 'Pending',
        trackingInfo: [
          { status: 'Pending', description: 'Order placed successfully', date: new Date() }
        ]
      });

      const createdOrder = await order.save();
      sendResponse(res, 201, 'Order created successfully', createdOrder);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email'
    );

    if (order && (order.user._id.toString() === req.user._id.toString() || req.user.role === 'Admin' || req.user.role === 'Super Admin')) {
      sendResponse(res, 200, 'Order fetched', order);
    } else {
      res.status(404);
      throw new Error('Order not found or unauthorized');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged in user orders
 * @route   GET /api/orders/myorders
 * @access  Private
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    sendResponse(res, 200, 'My orders fetched', orders);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel order
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order && order.user.toString() === req.user._id.toString()) {
      if (['Shipped', 'Out For Delivery', 'Delivered'].includes(order.status)) {
        res.status(400);
        throw new Error('Cannot cancel an order that has already been shipped');
      }

      order.status = 'Cancelled';
      order.trackingInfo.push({
        status: 'Cancelled',
        description: 'Order cancelled by user',
        date: new Date()
      });

      await order.save();
      sendResponse(res, 200, 'Order cancelled successfully', order);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};
