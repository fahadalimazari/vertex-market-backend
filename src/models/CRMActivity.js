import mongoose from 'mongoose';

const CRMActivitySchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'CRMLead', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { 
    type: String, 
    required: true,
    enum: [
      'Lead Created', 
      'Stage Changed', 
      'Lead Assigned', 
      'Priority Changed', 
      'Follow-up Created', 
      'Follow-up Completed', 
      'Note Added', 
      'Lead Converted', 
      'Lead Lost',
      'Status Changed',
      'Info Updated'
    ]
  },
  oldValue: { type: String },
  newValue: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }, // flexible data storage
}, {
  timestamps: true // createdAt represents when activity happened
});

const CRMActivity = mongoose.model('CRMActivity', CRMActivitySchema);
export default CRMActivity;
