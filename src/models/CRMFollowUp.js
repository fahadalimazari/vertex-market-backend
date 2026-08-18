import mongoose from 'mongoose';

const CRMFollowUpSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'CRMLead', required: true, index: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['Call', 'Email', 'WhatsApp', 'Meeting', 'Demo', 'Other'],
    required: true
  },
  scheduledAt: { type: Date, required: true },
  note: { type: String },
  status: { 
    type: String, 
    enum: ['Pending', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  completedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

const CRMFollowUp = mongoose.model('CRMFollowUp', CRMFollowUpSchema);
export default CRMFollowUp;
