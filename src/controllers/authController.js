import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Session from '../models/Session.js';
import Seller from '../models/Seller.js';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { UAParser } from 'ua-parser-js';

// Helper to generate token
const generateToken = (user, sellerData = null) => {
  const payload = {
    id: user._id,
    role: user.role,
    permissions: user.permissions || [],
    ...(sellerData && { sellerStatus: sellerData.status }),
  };
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new user (Customer or Seller)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { 
      name, email, password, role, storeName, nationalId, cnic, phone,
      businessType, businessCategory, expectedProducts, monthlySales,
      ntn, taxNumber, warehouseAddress, businessAddress,
      bankName, accountTitle, accountNumber, iban, jazzCash, easyPaisa,
      cnicFront, cnicBack, businessCertificate, taxCertificate, utilityBill, warehouseImages
    } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Default to Customer if not specified or invalid
    const assignedRole = role === 'Seller' ? 'Seller' : 'Customer';

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      isEmailVerified: true // Mocking email verification for now
    });

    if (assignedRole === 'Seller') {
      const baseSlug = (storeName || name || 'store').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `seller-${Date.now()}`;
      const uniqueSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Create Pending Seller Profile with rich KYC & business metadata
      await Seller.create({
        user: user._id,
        storeName: storeName || `${name}'s Store`,
        storeSlug: uniqueSlug,
        nationalId: cnic || nationalId || '00000-0000000-0',
        contactPhone: phone,
        contactEmail: email,
        businessType: businessType || 'Individual',
        businessCategory: businessCategory || 'General Commerce',
        expectedProducts: expectedProducts || '10-50 Products',
        monthlySales: monthlySales || 'Rs. 100,000 - 500,000',
        businessRegistrationNumber: ntn,
        taxRegistrationNumber: taxNumber,
        proofOfAddress: warehouseAddress || businessAddress,
        bankDetails: {
          accountName: accountTitle || name,
          accountTitle: accountTitle || name,
          accountNumber,
          bankName,
          iban,
          jazzCash,
          easyPaisa,
        },
        kycDocuments: {
          cnicFront,
          cnicBack,
          businessCertificate,
          taxCertificate,
          utilityBill,
          warehouseImages,
        },
        status: 'Pending',
      });
      
      res.status(201).json({
        success: true,
        message: 'Your seller application has been submitted successfully and is waiting for Super Admin approval.',
      });
    } else {
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user),
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Auth user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const authUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      
      let sellerData = null;
      if (user.role === 'Seller') {
        const seller = await Seller.findOne({ user: user._id });
        if (seller) {
          sellerData = {
            status: seller.status,
            storeName: seller.storeName,
            storeLogo: seller.storeLogo,
            rejectionReason: seller.rejectionReason,
            resubmissionComments: seller.resubmissionComments
          };
        }
      }

      const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        ...(sellerData && { sellerProfile: sellerData })
      };

      const token = generateToken(user, sellerData);

      // Track Session
      const parser = new UAParser();
      const ua = parser.setUA(req.headers['user-agent']).getResult();
      const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown IP';
      
      const session = await Session.create({
        user: user._id,
        tokenHash: token,
        device: ua.device.model || ua.device.vendor || 'Desktop/Laptop',
        browser: ua.browser.name || 'Unknown Browser',
        os: ua.os.name || 'Unknown OS',
        ipAddress,
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token,
          sessionId: session._id,
        },
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('recentlyViewed.productId')
      .populate('compareItems.productId');

    if (user) {
      let sellerData = null;
      if (user.role === 'Seller') {
        const seller = await Seller.findOne({ user: user._id });
        if (seller) {
          sellerData = {
            status: seller.status,
            storeName: seller.storeName,
            storeLogo: seller.storeLogo,
            rejectionReason: seller.rejectionReason,
            resubmissionComments: seller.resubmissionComments
          };
        }
      }

      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          preferences: user.preferences || { language: 'en', currency: 'USD', country: 'US' },
          searchHistory: user.searchHistory || [],
          recentlyViewed: user.recentlyViewed || [],
          compareItems: user.compareItems || [],
          chatHistory: user.chatHistory || [],
          paymentMethods: user.paymentMethods || [],
          notificationPreferences: user.notificationPreferences || {
            orders: true,
            payments: true,
            promotions: true,
            wishlist: true,
            security: true,
            emailEnabled: true,
            pushEnabled: true
          },
          ...(sellerData && { sellerProfile: sellerData })
        }
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (req, res, next) => {
  try {
    const { language, currency, country } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    user.preferences = {
      language: language || user.preferences.language,
      currency: currency || user.preferences.currency,
      country: country || user.preferences.country,
    };
    await user.save();
    res.json({ success: true, data: user.preferences });
  } catch (error) {
    next(error);
  }
};

export const addSearchHistory = async (req, res, next) => {
  try {
    const { search } = req.body;
    if (!search) {
      res.status(400);
      throw new Error('Search term is required');
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    user.searchHistory = (user.searchHistory || []).filter(term => term !== search);
    user.searchHistory.unshift(search);
    if (user.searchHistory.length > 10) {
      user.searchHistory = user.searchHistory.slice(0, 10);
    }
    await user.save();
    res.json({ success: true, data: user.searchHistory });
  } catch (error) {
    next(error);
  }
};

export const clearSearchHistory = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    user.searchHistory = [];
    await user.save();
    res.json({ success: true, data: user.searchHistory });
  } catch (error) {
    next(error);
  }
};

export const addRecentlyViewed = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      res.status(400);
      throw new Error('Product ID is required');
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    user.recentlyViewed = (user.recentlyViewed || []).filter(
      item => item.productId && item.productId.toString() !== productId
    );
    user.recentlyViewed.unshift({ productId, viewedAt: new Date() });
    if (user.recentlyViewed.length > 20) {
      user.recentlyViewed = user.recentlyViewed.slice(0, 20);
    }
    await user.save();
    
    const populatedUser = await User.findById(req.user._id).populate('recentlyViewed.productId');
    res.json({ success: true, data: populatedUser.recentlyViewed });
  } catch (error) {
    next(error);
  }
};

export const updateCompareItems = async (req, res, next) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds)) {
      res.status(400);
      throw new Error('productIds must be an array');
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    user.compareItems = productIds.map(productId => ({ productId, addedAt: new Date() }));
    await user.save();

    const populatedUser = await User.findById(req.user._id).populate('compareItems.productId');
    res.json({ success: true, data: populatedUser.compareItems });
  } catch (error) {
    next(error);
  }
};

export const updateChatHistory = async (req, res, next) => {
  try {
    const { history } = req.body;
    if (!Array.isArray(history)) {
      res.status(400);
      throw new Error('history must be an array');
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    user.chatHistory = history;
    await user.save();
    res.json({ success: true, data: user.chatHistory });
  } catch (error) {
    next(error);
  }
};

export const getPaymentMethods = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    res.json({ success: true, data: user.paymentMethods || [] });
  } catch (error) {
    next(error);
  }
};

export const addPaymentMethod = async (req, res, next) => {
  try {
    const { cardholderName, cardNumber, expiryDate, cardType, isDefault } = req.body;
    if (!cardholderName || !cardNumber || !expiryDate) {
      res.status(400);
      throw new Error('Please provide card details');
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (isDefault) {
      user.paymentMethods.forEach(method => { method.isDefault = false; });
    } else if (user.paymentMethods.length === 0) {
      req.body.isDefault = true;
    }

    user.paymentMethods.push({
      cardholderName,
      cardNumber,
      expiryDate,
      cardType: cardType || 'visa',
      isDefault: req.body.isDefault || isDefault || false
    });
    await user.save();
    res.status(201).json({ success: true, data: user.paymentMethods });
  } catch (error) {
    next(error);
  }
};

export const deletePaymentMethod = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    const methodToDelete = user.paymentMethods.id(req.params.id);
    if (!methodToDelete) {
      res.status(404);
      throw new Error('Payment method not found');
    }

    const wasDefault = methodToDelete.isDefault;
    methodToDelete.deleteOne();

    if (wasDefault && user.paymentMethods.length > 0) {
      user.paymentMethods[user.paymentMethods.length - 1].isDefault = true;
    }

    await user.save();
    res.json({ success: true, data: user.paymentMethods });
  } catch (error) {
    next(error);
  }
};

export const setDefaultPaymentMethod = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    const target = user.paymentMethods.id(req.params.id);
    if (!target) {
      res.status(404);
      throw new Error('Payment method not found');
    }
    user.paymentMethods.forEach(method => {
      method.isDefault = method._id.toString() === req.params.id;
    });
    await user.save();
    res.json({ success: true, data: user.paymentMethods });
  } catch (error) {
    next(error);
  }
};

export const updateNotificationPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...req.body
    };
    await user.save();
    res.json({ success: true, data: user.notificationPreferences });
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.name = req.body.name || user.name;
    if (req.body.avatar !== undefined) {
      user.avatar = req.body.avatar;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// SECURITY / ACCOUNT SETTINGS
// ==========================================

export const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  
  if (!user || !(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  user.lastPasswordChange = new Date();
  await user.save();

  res.json({ success: true, message: 'Password updated successfully' });
});

export const setupMfa = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const secret = speakeasy.generateSecret({ name: `VertexMarket (${user.email})` });

  user.mfaSecret = secret.base32;
  await user.save();

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  res.json({
    success: true,
    data: {
      qrCodeUrl,
      secret: secret.base32,
    },
  });
});

export const verifyMfa = asyncHandler(async (req, res, next) => {
  const { token } = req.body;
  const user = await User.findById(req.user._id);

  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token,
  });

  if (verified) {
    user.isMfaEnabled = true;
    await user.save();
    res.json({ success: true, message: 'MFA enabled successfully' });
  } else {
    res.status(400);
    throw new Error('Invalid verification code');
  }
});

export const disableMfa = asyncHandler(async (req, res, next) => {
  const { currentPassword, token } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!user || !(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token,
  });

  if (!verified) {
    res.status(400);
    throw new Error('Invalid MFA token');
  }

  user.isMfaEnabled = false;
  user.mfaSecret = undefined;
  await user.save();

  res.json({ success: true, message: 'MFA disabled successfully' });
});

export const getSessions = asyncHandler(async (req, res, next) => {
  const sessions = await Session.find({ user: req.user._id }).sort('-lastActive');
  res.json({
    success: true,
    data: sessions.map(s => ({
      _id: s._id,
      device: s.device,
      browser: s.browser,
      os: s.os,
      ipAddress: s.ipAddress,
      lastActive: s.lastActive,
      isCurrent: req.sessionId && req.sessionId.toString() === s._id.toString()
    })),
  });
});

export const revokeSession = asyncHandler(async (req, res, next) => {
  const session = await Session.findOne({ _id: req.params.id, user: req.user._id });
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }
  await session.deleteOne();
  res.json({ success: true, message: 'Session revoked successfully' });
});

export const revokeAllOtherSessions = asyncHandler(async (req, res, next) => {
  if (!req.sessionId) {
    res.status(400);
    throw new Error('Current session could not be determined');
  }
  await Session.deleteMany({
    user: req.user._id,
    _id: { $ne: req.sessionId }
  });
  res.json({ success: true, message: 'All other sessions revoked' });
});
