import User from '../models/User.js';
import Seller from '../models/Seller.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import bcrypt from 'bcryptjs';

// Helper to log audit
const createAuditLog = async (adminId, targetId, action, previousValue, newValue, ipAddress) => {
  try {
    await AdminAuditLog.create({
      adminId,
      targetId,
      targetModel: 'Seller',
      action,
      previousValue,
      newValue,
      ipAddress
    });
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
};

// @desc    Get all sellers (Admin view)
// @route   GET /api/v1/admin/sellers
// @access  Private/SuperAdmin, Admin
export const getSellers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, approvalStatus } = req.query;
    
    // Find all users with role 'Seller'
    const userQuery = { role: 'Seller' };
    if (search) {
      userQuery.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(userQuery).select('_id email phone firstName lastName isActive createdAt');
    const userIds = users.map(u => u._id);
    
    // Find associated seller profiles
    const sellerQuery = { user: { $in: userIds } };
    if (status) sellerQuery.status = status; // Active, Suspended etc
    
    const sellers = await Seller.find(sellerQuery)
      .populate('user', 'firstName lastName email phone isActive')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      
    const total = await Seller.countDocuments(sellerQuery);

    res.status(200).json({
      success: true,
      data: sellers,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single seller details
// @route   GET /api/v1/admin/sellers/:id
// @access  Private/SuperAdmin, Admin
export const getSellerById = async (req, res) => {
  try {
    // ID can be Seller _id or User _id. Let's assume it's Seller _id
    const seller = await Seller.findById(req.params.id)
      .populate('user', 'firstName lastName email phone isActive role');
      
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }
    
    res.status(200).json({ success: true, data: seller });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a seller manually
// @route   POST /api/v1/admin/sellers
// @access  Private/SuperAdmin, Admin
export const createSeller = async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, password,
      businessName, businessType, businessRegistrationNumber, taxRegistrationNumber,
      sellerType, country, state, city, area, address, postalCode,
      kycDocuments, status // Active, Pending, Suspended
    } = req.body;

    // 1. Validation
    if (!firstName || !lastName || !email || !phone || !password || !businessName) {
      return res.status(400).json({ success: false, message: 'Required fields missing.' });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // 2. Hash Password & Create User
    const user = await User.create({
      name: `${firstName} ${lastName}`,
      email,
      phone,
      password, // Send plain text, Mongoose pre-save hook handles hashing
      role: 'Seller', // Hardcoded role to ensure safety
      isActive: status === 'Active' ? true : false,
    });

    // 3. Generate Store Slug
    let storeSlug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existingSlug = await Seller.findOne({ storeSlug });
    if (existingSlug) {
      storeSlug = `${storeSlug}-${Math.floor(Math.random() * 1000)}`;
    }

    // 4. Create Seller Profile
    const seller = await Seller.create({
      user: user._id,
      storeName: businessName,
      storeSlug,
      businessType: businessType || 'Business',
      businessRegistrationNumber,
      taxRegistrationNumber,
      contactEmail: email,
      contactPhone: phone,
      nationalId: 'Manual-Entry', // Placeholder or required field override
      kycDocuments: kycDocuments || {},
      status: status === 'Active' ? 'Approved' : 'Pending', // Approval workflow
      approvalDate: status === 'Active' ? new Date() : null,
      approvedBy: status === 'Active' ? req.user._id : null
    });

    // 5. Audit Log
    await createAuditLog(
      req.user._id, 
      seller._id, 
      'SELLER_CREATED', 
      null, 
      { email, status }, 
      req.ip
    );

    res.status(201).json({ success: true, data: seller, message: 'Seller created successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Quick Create a seller with only email & password
// @route   POST /api/v1/admin/sellers/quick-create
// @access  Private/SuperAdmin, Admin
export const quickCreateSeller = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and Password are required.' });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({
      name: 'Seller Profile', // Placeholder
      email,
      password, // Send plain text, Mongoose pre-save hook handles hashing
      role: 'Seller',
      isActive: true, // Allow them to login immediately to complete profile
    });

    const seller = await Seller.create({
      user: user._id,
      storeName: `Store-${user._id.toString().slice(-6)}`, // Placeholder
      storeSlug: `store-${user._id.toString().slice(-6)}`, // Placeholder
      nationalId: 'Pending', // Placeholder
      status: 'Approved', // They are approved to start setup
      approvalDate: new Date(),
      approvedBy: req.user._id
    });

    await createAuditLog(
      req.user._id, 
      seller._id, 
      'SELLER_QUICK_CREATED', 
      null, 
      { email }, 
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Seller account created successfully',
      data: {
        sellerId: seller._id,
        email: user.email,
        role: user.role,
        status: seller.status
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update Seller Status / Active state
// @route   PATCH /api/v1/admin/sellers/:id/status
// @access  Private/SuperAdmin, Admin
export const updateSellerStatus = async (req, res) => {
  try {
    const { status } = req.body; // e.g. Active, Suspended
    const seller = await Seller.findById(req.params.id);
    
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });
    
    const user = await User.findById(seller.user);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const previousStatus = user.isActive ? 'Active' : 'Suspended';
    
    if (status === 'Active') {
      user.isActive = true;
      seller.status = 'Approved';
    } else if (status === 'Suspended') {
      user.isActive = false;
      seller.status = 'Suspended';
    } else {
      user.isActive = false;
      seller.status = 'Pending';
    }

    await user.save();
    await seller.save();

    await createAuditLog(
      req.user._id, 
      seller._id, 
      'SELLER_STATUS_UPDATED', 
      previousStatus, 
      status, 
      req.ip
    );

    res.status(200).json({ success: true, message: `Seller marked as ${status}`, data: seller });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Reset Seller Password
// @route   POST /api/v1/admin/sellers/:id/reset-password
// @access  Private/SuperAdmin, Admin
export const resetSellerPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(seller.user, { password: hashedPassword });

    await createAuditLog(
      req.user._id, 
      seller._id, 
      'SELLER_PASSWORD_RESET', 
      null, 
      'Password reset manually', 
      req.ip
    );

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update Seller Details
// @route   PUT /api/v1/admin/sellers/:id
export const updateSeller = async (req, res) => {
  try {
    const seller = await Seller.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    await createAuditLog(
      req.user._id, 
      seller._id, 
      'SELLER_UPDATED', 
      null, 
      'Profile updated', 
      req.ip
    );

    res.status(200).json({ success: true, data: seller });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete Seller
// @route   DELETE /api/v1/admin/sellers/:id
export const deleteSeller = async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    await User.findByIdAndDelete(seller.user);
    await seller.deleteOne();

    await createAuditLog(
      req.user._id, 
      seller._id, 
      'SELLER_DELETED', 
      null, 
      null, 
      req.ip
    );

    res.status(200).json({ success: true, message: 'Seller deleted permanently' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
