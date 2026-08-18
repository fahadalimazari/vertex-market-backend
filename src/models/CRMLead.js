import mongoose from 'mongoose';

const CRMLeadSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  name: { type: String },
  email: { type: String, index: true },
  phone: { type: String, index: true },
  company: { type: String },
  website: { type: String },
  source: { 
    type: String, 
    enum: ['Website', 'Contact Form', 'Seller Registration', 'Customer Registration', 'Referral', 'Social Media', 'Advertisement', 'Manual Entry', 'Other'],
    default: 'Manual Entry',
    index: true
  },
  leadType: { type: String, default: 'Customer' }, // Customer, Seller, B2B
  stage: { 
    type: String, 
    enum: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'],
    default: 'New',
    index: true
  },
  status: { 
    type: String, 
    enum: ['New', 'Active', 'Qualified', 'Unqualified', 'Converted', 'Lost'],
    default: 'New',
    index: true
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium' 
  },
  estimatedValue: { type: Number, default: 0 },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
  nextFollowUp: { type: Date },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

// Pre-save middleware to set full name if not provided
CRMLeadSchema.pre('save', function(next) {
  if (this.firstName && !this.name) {
    this.name = `${this.firstName} ${this.lastName || ''}`.trim();
  }
  next();
});

const CRMLead = mongoose.model('CRMLead', CRMLeadSchema);
export default CRMLead;
