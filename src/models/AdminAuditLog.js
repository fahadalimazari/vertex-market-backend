import mongoose from 'mongoose';

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId, // E.g., Seller ID, User ID
      index: true
    },
    targetModel: {
      type: String,
      enum: ['User', 'Seller', 'Product', 'Order', 'Setting', 'Other'],
      default: 'Seller'
    },
    action: {
      type: String,
      required: true,
      index: true
      // e.g., 'SELLER_CREATED', 'SELLER_UPDATED', 'SELLER_ACTIVATED', 'SELLER_SUSPENDED', 'SELLER_PASSWORD_RESET'
    },
    previousValue: {
      type: mongoose.Schema.Types.Mixed
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);

export default AdminAuditLog;
