import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  selectedColor: { type: String },
  selectedSize: { type: String },
  selectedStorage: { type: String },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } 
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true,
      default: 'Cash on Delivery',
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    orderNumber: { type: String, unique: true, index: true },
    customerEmail: { type: String, index: true },
    customerPhone: { type: String, index: true },
    courierProvider: { type: String, default: 'TCS Express' },
    trackingNumber: { type: String },
    estimatedDeliveryDate: { type: Date },
    timeline: {
      orderedAt: { type: Date, default: Date.now },
      confirmedAt: { type: Date },
      packedAt: { type: Date },
      shippedAt: { type: Date },
      outForDeliveryAt: { type: Date },
      deliveredAt: { type: Date },
      cancelledAt: { type: Date },
      returnedAt: { type: Date },
      refundedAt: { type: Date }
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Processing', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled', 'Return Requested', 'Returned'],
      default: 'Pending'
    },
    trackingInfo: [
      {
        status: String,
        description: String,
        date: Date
      }
    ]
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
