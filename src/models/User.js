import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false, // Don't return password by default
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['Customer', 'Seller', 'Manager', 'Admin', 'Super Admin'],
      default: 'Customer',
    },
    permissions: {
      type: [String],
      default: [], // Used specifically for Managers
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    preferences: {
      language: { type: String, default: 'en' },
      currency: { type: String, default: 'USD' },
      country: { type: String, default: 'US' },
    },
    searchHistory: {
      type: [String],
      default: [],
    },
    recentlyViewed: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      viewedAt: { type: Date, default: Date.now }
    }],
    compareItems: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      addedAt: { type: Date, default: Date.now }
    }],
    chatHistory: {
      type: Array,
      default: []
    },
    paymentMethods: [{
      cardholderName: { type: String, required: true },
      cardNumber: { type: String, required: true },
      expiryDate: { type: String, required: true },
      cardType: { type: String, default: 'visa' },
      isDefault: { type: Boolean, default: false }
    }],
    notificationPreferences: {
      orders: { type: Boolean, default: true },
      payments: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      wishlist: { type: Boolean, default: true },
      security: { type: Boolean, default: true },
      emailEnabled: { type: Boolean, default: true },
      pushEnabled: { type: Boolean, default: true }
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastPasswordChange: Date,
    isMfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaSecret: String,
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
