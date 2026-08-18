import Address from '../models/Address.js';

// @desc    Get user addresses
// @route   GET /api/v1/addresses
// @access  Private
export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add address
// @route   POST /api/v1/addresses
// @access  Private
export const addAddress = async (req, res) => {
  try {
    const data = req.body;
    
    // If setting as default, unset others
    if (data.isDefault) {
      await Address.updateMany({ userId: req.user._id }, { isDefault: false });
    } else {
      // If this is the first address, make it default
      const count = await Address.countDocuments({ userId: req.user._id });
      if (count === 0) data.isDefault = true;
    }

    const address = await Address.create({ ...data, userId: req.user._id });
    res.status(201).json({ success: true, data: address });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update address
// @route   PUT /api/v1/addresses/:id
// @access  Private
export const updateAddress = async (req, res) => {
  try {
    const data = req.body;
    
    if (data.isDefault) {
      await Address.updateMany({ userId: req.user._id }, { isDefault: false });
    }

    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      data,
      { new: true, runValidators: true }
    );

    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });
    
    res.status(200).json({ success: true, data: address });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete address
// @route   DELETE /api/v1/addresses/:id
// @access  Private
export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });
    
    // If the deleted address was default, make the most recently created address the new default
    if (address.isDefault) {
      const nextAddress = await Address.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    res.status(200).json({ success: true, message: 'Address deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Set default address
// @route   PATCH /api/v1/addresses/:id/default
// @access  Private
export const setDefaultAddress = async (req, res) => {
  try {
    await Address.updateMany({ userId: req.user._id }, { isDefault: false });
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isDefault: true },
      { new: true }
    );
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });
    
    res.status(200).json({ success: true, data: address });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
