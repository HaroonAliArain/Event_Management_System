const express = require('express');
const router = express.Router();
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { validateObjectId, sanitizePayload } = require('../middleware/validate');

// Event collection routes
router
  .route('/')
  .get(getAllEvents)
  .post(sanitizePayload, createEvent);

// Single event item routes
router
  .route('/:id')
  .get(validateObjectId('id'), getEventById)
  .put(validateObjectId('id'), sanitizePayload, updateEvent)
  .delete(validateObjectId('id'), deleteEvent);

module.exports = router;
