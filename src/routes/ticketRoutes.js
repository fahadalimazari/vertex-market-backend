import express from 'express';
import { getTickets, createTicket, addTicketMessage } from '../controllers/ticketController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTickets)
  .post(createTicket);

router.route('/:id/messages')
  .post(addTicketMessage);

export default router;
