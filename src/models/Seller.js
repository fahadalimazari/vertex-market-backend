import mongoose from 'mongoose';

const approvalHistorySchema = new mongoose.Schema(
  {
    previousStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Resubmission Required', 'Suspended', null],
    },
    newStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Resubmission Required', 'Suspended'],
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // The Super Admin who made the change
      required: true,
    },
    adminComments: {
      type: String,
    },
  },
  { timestamps: { createdAt: 'date', updatedAt: false } }
);

const sellerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Store & Business Information
    storeName: { type: String, required: true },
    storeSlug: { type: String, required: true, unique: true },
    storeLogo: { type: String },
    storeBanner: { type: String },
    storeDescription: { type: String },
    businessType: { type: String, default: 'Individual' },
    businessCategory: { type: String, default: 'General Commerce' },
    expectedProducts: { type: String },
    monthlySales: { type: String },
    contactPhone: { type: String },
    contactEmail: { type: String },
    
    // KYC & Business Information
    nationalId: { type: String, required: true },
    businessRegistrationNumber: { type: String },
    taxRegistrationNumber: { type: String },
    proofOfAddress: { type: String },
    verificationDocuments: [{ type: String }], // URLs to uploaded documents
    kycDocuments: {
      cnicFront: { type: String },
      cnicBack: { type: String },
      businessCertificate: { type: String },
      taxCertificate: { type: String },
      utilityBill: { type: String },
      warehouseImages: { type: String },
    },
    
    // Bank Information
    bankDetails: {
      accountName: { type: String },
      accountTitle: { type: String },
      accountNumber: { type: String },
      bankName: { type: String },
      branchCode: { type: String },
      iban: { type: String },
      jazzCash: { type: String },
      easyPaisa: { type: String },
    },
    
    // Approval Workflow
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Resubmission Required', 'Suspended'],
      default: 'Pending',
    },
    approvalDate: { type: Date },
    rejectionDate: { type: Date },
    rejectionReason: { type: String },
    resubmissionComments: { type: String },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isVerified: { type: Boolean, default: false },
    approvalHistory: [approvalHistorySchema],
    
    // Store Badges (Admin Assigned)
    assignedBadges: [{
      label: { type: String, required: true },
      icon: { type: String, required: true },
      source: { type: String, default: 'admin', enum: ['admin'] },
      assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      assignedAt: { type: Date, default: Date.now },
      reason: { type: String },
      isActive: { type: Boolean, default: true }
    }],
    
    // Metrics
    storeRating: { type: Number, default: 4.5 },
    totalSales: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    
    // Store Theme & SEO
    brandColor: { type: String, default: '#ff6a00' },
    storeSeoTitle: { type: String },
    metaDescription: { type: String },
    metaKeywords: { type: String },
    openGraphImage: { type: String },
    
    // Store Policies
    returnPolicy: { type: String },
    refundPolicy: { type: String },
    shippingPolicy: { type: String },
    termsConditions: { type: String },
    policiesPublished: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Seller = mongoose.model('Seller', sellerSchema);

export default Seller;
