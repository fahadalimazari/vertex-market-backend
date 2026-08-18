import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Manager', 'Operator', 'Viewer', 'Support'],
    default: 'Operator'
  },
  status: {
    type: String,
    enum: ['Active', 'Suspended'],
    default: 'Active'
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

const Staff = mongoose.model('Staff', staffSchema);
export default Staff;
