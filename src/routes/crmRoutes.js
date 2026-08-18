import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  getDashboardStats,
  getLeads,
  getLeadById,
  createLead,
  updateLeadStage,
  convertLead,
  getLeadActivities,
  addLeadNote,
  getLeadFollowUps,
  createFollowUp,
  completeFollowUp,
  getLeadTasks,
  createTask,
  updateTask
} from '../controllers/crmController.js';

const router = express.Router();

// All CRM routes require authentication and Admin/Manager role
router.use(protect);
router.use(authorizeRoles('Super Admin', 'Admin', 'Manager'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Leads
router.route('/leads')
  .get(getLeads)
  .post(createLead);

router.route('/leads/:id')
  .get(getLeadById);

router.patch('/leads/:id/stage', updateLeadStage);
router.post('/leads/:id/convert', convertLead);
router.post('/leads/:id/notes', addLeadNote);

// Activities
router.get('/leads/:id/activities', getLeadActivities);

// Follow-ups
router.route('/leads/:id/follow-ups')
  .get(getLeadFollowUps);

router.route('/follow-ups')
  .post(createFollowUp);

router.patch('/follow-ups/:id/complete', completeFollowUp);

// Tasks
router.route('/leads/:id/tasks')
  .get(getLeadTasks);

router.route('/tasks')
  .post(createTask);

router.route('/tasks/:id')
  .put(updateTask);

export default router;
