import Ticket from '../models/Ticket.js';

// @desc    Get user support tickets
// @route   GET /api/v1/tickets
// @access  Private
export const getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new support ticket
// @route   POST /api/v1/tickets
// @access  Private
export const createTicket = async (req, res) => {
  try {
    const { subject, category, message } = req.body;
    if (!subject || !category || !message) {
      return res.status(400).json({ success: false, message: 'Please provide all details' });
    }

    const ticket = await Ticket.create({
      userId: req.user._id,
      subject,
      category,
      messages: [{
        senderRole: 'Customer',
        senderName: req.user.name || 'Customer',
        text: message,
        timestamp: new Date()
      }]
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Add a message to a ticket
// @route   POST /api/v1/tickets/:id/messages
// @access  Private
export const addTicketMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const ticket = await Ticket.findOne({ _id: req.params.id, userId: req.user._id });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    ticket.messages.push({
      senderRole: 'Customer',
      senderName: req.user.name || 'Customer',
      text,
      timestamp: new Date()
    });
    ticket.updatedAt = new Date();

    await ticket.save();
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
