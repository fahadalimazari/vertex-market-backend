import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    device: {
      type: String, // e.g. "Mac" or "Windows"
      default: 'Unknown Device',
    },
    browser: {
      type: String, // e.g. "Chrome"
      default: 'Unknown Browser',
    },
    os: {
      type: String, // e.g. "Windows 10"
      default: 'Unknown OS',
    },
    ipAddress: {
      type: String,
      default: 'Unknown IP',
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Session = mongoose.model('Session', sessionSchema);

export default Session;
