import CRMLead from '../models/CRMLead.js';
import CRMFollowUp from '../models/CRMFollowUp.js';
import CRMTask from '../models/CRMTask.js';
import CRMActivity from '../models/CRMActivity.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Helper to log activity
const logActivity = async (leadId, userId, action, oldValue, newValue, metadata = {}) => {
  await CRMActivity.create({
    leadId,
    userId,
    action,
    oldValue: oldValue ? String(oldValue) : undefined,
    newValue: newValue ? String(newValue) : undefined,
    metadata
  });
};

// @desc    Get dashboard stats
// @route   GET /api/v1/admin/crm/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const totalLeads = await CRMLead.countDocuments();
    const newLeads = await CRMLead.countDocuments({ stage: 'New' });
    const qualifiedLeads = await CRMLead.countDocuments({ stage: 'Qualified' });
    const wonLeads = await CRMLead.countDocuments({ stage: 'Won' });
    const lostLeads = await CRMLead.countDocuments({ stage: 'Lost' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setDate(today.getDate() + 1);
    
    const followUpsDue = await CRMFollowUp.countDocuments({
      status: 'Pending',
      scheduledAt: { $lte: endOfToday }
    });

    const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;

    // Pipeline counts
    const pipeline = await CRMLead.aggregate([
      { $group: { _id: '$stage', count: { $sum: 1 } } }
    ]);

    const pipelineCounts = {
      New: 0, Contacted: 0, Qualified: 0, Proposal: 0, Negotiation: 0, Won: 0, Lost: 0
    };
    pipeline.forEach(p => {
      if (pipelineCounts[p._id] !== undefined) {
        pipelineCounts[p._id] = p.count;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalLeads, newLeads, qualifiedLeads, wonLeads, lostLeads, followUpsDue, conversionRate, pipelineCounts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all leads with pagination & filtering
// @route   GET /api/v1/admin/crm/leads
// @access  Private/Admin
export const getLeads = async (req, res) => {
  try {
    const { page = 1, limit = 50, stage, status, priority, search } = req.query;
    const query = {};

    if (stage) query.stage = stage;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const leads = await CRMLead.find(query)
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await CRMLead.countDocuments(query);

    res.status(200).json({
      success: true,
      data: leads,
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

// @desc    Get single lead details
// @route   GET /api/v1/admin/crm/leads/:id
// @access  Private/Admin
export const getLeadById = async (req, res) => {
  try {
    const lead = await CRMLead.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .populate('customerId', 'firstName lastName email');
      
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    
    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new lead
// @route   POST /api/v1/admin/crm/leads
// @access  Private/Admin
export const createLead = async (req, res) => {
  try {
    const lead = await CRMLead.create({
      ...req.body,
      createdBy: req.user._id
    });

    await logActivity(lead._id, req.user._id, 'Lead Created', null, lead.stage);

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update lead stage (Drag and drop)
// @route   PATCH /api/v1/admin/crm/leads/:id/stage
// @access  Private/Admin
export const updateLeadStage = async (req, res) => {
  try {
    const { stage } = req.body;
    const lead = await CRMLead.findById(req.params.id);
    
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    
    const oldStage = lead.stage;
    lead.stage = stage;
    if (stage === 'Won') lead.status = 'Converted';
    if (stage === 'Lost') lead.status = 'Lost';
    
    await lead.save();

    await logActivity(lead._id, req.user._id, 'Stage Changed', oldStage, stage);

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get Lead Activities
// @route   GET /api/v1/admin/crm/leads/:id/activities
export const getLeadActivities = async (req, res) => {
  try {
    const activities = await CRMActivity.find({ leadId: req.params.id })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a Note to Lead
// @route   POST /api/v1/admin/crm/leads/:id/notes
export const addLeadNote = async (req, res) => {
  try {
    const { note } = req.body;
    const lead = await CRMLead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    
    // Notes are appended or stored in activities. Here we'll just log an activity for the note.
    await logActivity(lead._id, req.user._id, 'Note Added', null, null, { note });
    
    // Also append to lead notes field if desired
    lead.notes = lead.notes ? `${lead.notes}\n\n[${new Date().toISOString()}] - ${note}` : `[${new Date().toISOString()}] - ${note}`;
    await lead.save();

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Convert Lead to Customer
// @route   POST /api/v1/admin/crm/leads/:id/convert
export const convertLead = async (req, res) => {
  try {
    const lead = await CRMLead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    // In a real app, create actual User if not exists based on email
    let user = await User.findOne({ email: lead.email });
    if (!user) {
      // Mock user creation if strictly needed or just link
      user = await User.create({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        password: 'converted_customer_123' // They should reset this
      });
    }

    lead.stage = 'Won';
    lead.status = 'Converted';
    lead.customerId = user._id;
    await lead.save();

    await logActivity(lead._id, req.user._id, 'Lead Converted', null, 'Won', { customerId: user._id });

    res.status(200).json({ success: true, data: lead, message: 'Lead converted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Follow-ups
// @route   GET /api/v1/admin/crm/leads/:id/follow-ups
export const getLeadFollowUps = async (req, res) => {
  try {
    const followUps = await CRMFollowUp.find({ leadId: req.params.id })
      .populate('assignedTo', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .sort({ scheduledAt: 1 });
    res.status(200).json({ success: true, data: followUps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createFollowUp = async (req, res) => {
  try {
    const { leadId, assignedTo, type, scheduledAt, note } = req.body;
    const followUp = await CRMFollowUp.create({
      leadId,
      assignedTo: assignedTo || req.user._id,
      type,
      scheduledAt,
      note,
      createdBy: req.user._id
    });

    await logActivity(leadId, req.user._id, 'Follow-up Created', null, type, { scheduledAt });

    res.status(201).json({ success: true, data: followUp });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const completeFollowUp = async (req, res) => {
  try {
    const followUp = await CRMFollowUp.findById(req.params.id);
    if (!followUp) return res.status(404).json({ success: false, message: 'Not found' });

    followUp.status = 'Completed';
    followUp.completedAt = new Date();
    await followUp.save();

    await logActivity(followUp.leadId, req.user._id, 'Follow-up Completed', 'Pending', 'Completed');

    res.status(200).json({ success: true, data: followUp });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Tasks
export const getLeadTasks = async (req, res) => {
  try {
    const tasks = await CRMTask.find({ leadId: req.params.id })
      .populate('assignedTo', 'firstName lastName')
      .sort({ dueDate: 1 });
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const task = await CRMTask.create({
      ...req.body,
      createdBy: req.user._id
    });
    if (task.leadId) {
      await logActivity(task.leadId, req.user._id, 'Task Created', null, task.title);
    }
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await CRMTask.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
