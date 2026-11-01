const express = require('express');
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
} = require('../controllers/bookingController');
const { validateObjectId, sanitizePayload } = require('../middleware/validate');

// Booking collection routes
router
  .route('/')
  .get(getAllBookings)
  .post(sanitizePayload, createBooking);

// Single booking item routes
router
  .route('/:id')
  .get(validateObjectId('id'), getBookingById)
  .put(validateObjectId('id'), sanitizePayload, updateBooking)
  .delete(validateObjectId('id'), deleteBooking);

module.exports = router;
