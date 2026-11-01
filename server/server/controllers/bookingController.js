const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Customer = require('../models/Customer');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const { sendSuccess } = require('../utils/apiResponse');

// Price multiplier for ticket tiers
const TIER_MULTIPLIERS = {
  Standard: 1.0,
  VIP: 1.5,
  Student: 0.8,
};

// Create a new booking with automatic seat reservation
const createBooking = asyncHandler(async (req, res, next) => {
  const { customer, event, ticketQuantity, ticketType = 'Standard', paymentStatus = 'Pending', specialRequests } = req.body;

  // Validate customer existence
  const customerExists = await Customer.findById(customer);
  if (!customerExists) {
    return next(new AppError(`Customer not found with ID: ${customer}`, 404));
  }

  // Validate event existence
  const eventDoc = await Event.findById(event);
  if (!eventDoc) {
    return next(new AppError(`Event not found with ID: ${event}`, 404));
  }

  // Verify event is not cancelled or completed
  if (eventDoc.status === 'Cancelled') {
    return next(new AppError('Cannot reserve tickets for a cancelled event.', 400));
  }
  if (eventDoc.status === 'Completed') {
    return next(new AppError('Cannot reserve tickets for an event that has already completed.', 400));
  }

  // Validate ticket quantity within limits
  const qty = parseInt(ticketQuantity, 10);
  if (isNaN(qty) || qty < 1 || qty > 10) {
    return next(new AppError('Ticket quantity must be an integer between 1 and 10.', 400));
  }

  // Check available seat inventory
  if (eventDoc.availableSeats < qty) {
    return next(
      new AppError(
        `Insufficient seat capacity! Only ${eventDoc.availableSeats} seat(s) remaining for '${eventDoc.title}'. Requested: ${qty}.`,
        400
      )
    );
  }

  // Calculate tier pricing and total amount
  const tierMultiplier = TIER_MULTIPLIERS[ticketType] || 1.0;
  const unitPrice = eventDoc.ticketPrice;
  const effectiveUnitPrice = unitPrice * tierMultiplier;
  const totalAmount = Math.round(qty * effectiveUnitPrice * 100) / 100;

  // Create booking record
  const newBooking = await Booking.create({
    customer: customerExists._id,
    event: eventDoc._id,
    ticketQuantity: qty,
    ticketType,
    unitPrice: effectiveUnitPrice,
    tierMultiplier,
    totalAmount,
    paymentStatus,
    bookingStatus: 'Confirmed',
    specialRequests: specialRequests || '',
  });

  // Decrement event available seats
  eventDoc.availableSeats -= qty;
  await eventDoc.save();

  // Populate booking relations for response
  const populatedBooking = await Booking.findById(newBooking._id)
    .populate('customer', 'fullName email phone')
    .populate('event', 'title venue eventDate ticketPrice bannerUrl status availableSeats totalCapacity');

  return sendSuccess(res, 201, 'Booking reserved and confirmed successfully', populatedBooking);
});

// Get all bookings with optional filters and search
const getAllBookings = asyncHandler(async (req, res, next) => {
  const { customer, event, status, paymentStatus, search } = req.query;

  const query = {};

  if (customer) query.customer = customer;
  if (event) query.event = event;
  if (status && status !== 'All') query.bookingStatus = status;
  if (paymentStatus && paymentStatus !== 'All') query.paymentStatus = paymentStatus;

  let bookings = await Booking.find(query)
    .populate('customer', 'fullName email phone city')
    .populate('event', 'title venue eventDate ticketPrice category status bannerUrl availableSeats totalCapacity')
    .sort({ bookingDate: -1 });

  // Filter bookings by search term across related fields
  if (search && search.trim() !== '') {
    const term = search.toLowerCase().trim();
    bookings = bookings.filter((b) => {
      const custName = b.customer?.fullName?.toLowerCase() || '';
      const custEmail = b.customer?.email?.toLowerCase() || '';
      const evtTitle = b.event?.title?.toLowerCase() || '';
      const ref = b.bookingReference?.toLowerCase() || '';
      return (
        custName.includes(term) ||
        custEmail.includes(term) ||
        evtTitle.includes(term) ||
        ref.includes(term)
      );
    });
  }

  return sendSuccess(res, 200, 'Bookings retrieved successfully', bookings, {
    count: bookings.length,
  });
});

// Get single booking by ID for digital boarding pass
const getBookingById = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate('customer', 'fullName email phone city organization')
    .populate('event', 'title description venue eventDate ticketPrice category bannerUrl status');

  if (!booking) {
    return next(new AppError(`Booking not found with ID: ${req.params.id}`, 404));
  }

  return sendSuccess(res, 200, 'Booking retrieved successfully', booking);
});

// Update booking status or ticket quantity with seat synchronization
const updateBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new AppError(`Booking not found with ID: ${req.params.id}`, 404));
  }

  const eventDoc = await Event.findById(booking.event);
  if (!eventDoc) {
    return next(new AppError('Associated event record could not be found.', 404));
  }

  const { ticketQuantity, ticketType, paymentStatus, bookingStatus, specialRequests } = req.body;

  // Handle status transition between Confirmed and Cancelled
  if (bookingStatus && bookingStatus !== booking.bookingStatus) {
    if (bookingStatus === 'Cancelled' && booking.bookingStatus === 'Confirmed') {
      eventDoc.availableSeats += booking.ticketQuantity;
      await eventDoc.save();
      booking.bookingStatus = 'Cancelled';
    } else if (bookingStatus === 'Confirmed' && booking.bookingStatus === 'Cancelled') {
      if (eventDoc.availableSeats < booking.ticketQuantity) {
        return next(
          new AppError(
            `Cannot reactivate booking: only ${eventDoc.availableSeats} seat(s) available, but this booking needs ${booking.ticketQuantity}.`,
            400
          )
        );
      }
      eventDoc.availableSeats -= booking.ticketQuantity;
      await eventDoc.save();
      booking.bookingStatus = 'Confirmed';
    }
  }

  // Handle ticket quantity adjustments and update inventory
  if (ticketQuantity !== undefined && parseInt(ticketQuantity, 10) !== booking.ticketQuantity) {
    const newQty = parseInt(ticketQuantity, 10);
    if (newQty < 1 || newQty > 10) {
      return next(new AppError('Ticket quantity must be between 1 and 10.', 400));
    }

    if (booking.bookingStatus === 'Confirmed') {
      const diff = newQty - booking.ticketQuantity;
      if (diff > 0) {
        if (eventDoc.availableSeats < diff) {
          return next(
            new AppError(
              `Cannot increase tickets by ${diff}. Only ${eventDoc.availableSeats} seat(s) are remaining.`,
              400
            )
          );
        }
        eventDoc.availableSeats -= diff;
      } else {
        eventDoc.availableSeats += Math.abs(diff);
      }
      await eventDoc.save();
    }

    booking.ticketQuantity = newQty;
    const multiplier = TIER_MULTIPLIERS[ticketType || booking.ticketType] || 1.0;
    booking.totalAmount = Math.round(newQty * (eventDoc.ticketPrice * multiplier) * 100) / 100;
  }

  // Handle ticket tier changes
  if (ticketType && ticketType !== booking.ticketType) {
    booking.ticketType = ticketType;
    booking.tierMultiplier = TIER_MULTIPLIERS[ticketType] || 1.0;
    booking.unitPrice = eventDoc.ticketPrice * booking.tierMultiplier;
    booking.totalAmount = Math.round(booking.ticketQuantity * booking.unitPrice * 100) / 100;
  }

  if (paymentStatus) booking.paymentStatus = paymentStatus;
  if (specialRequests !== undefined) booking.specialRequests = specialRequests;

  await booking.save();

  const updatedBooking = await Booking.findById(booking._id)
    .populate('customer', 'fullName email phone')
    .populate('event', 'title venue eventDate ticketPrice category status bannerUrl availableSeats totalCapacity');

  return sendSuccess(res, 200, 'Booking updated successfully', updatedBooking);
});

// Delete booking and restore reserved seats
const deleteBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new AppError(`Booking not found with ID: ${req.params.id}`, 404));
  }

  // Restore seats to event if booking was confirmed
  if (booking.bookingStatus === 'Confirmed') {
    const eventDoc = await Event.findById(booking.event);
    if (eventDoc) {
      eventDoc.availableSeats = Math.min(
        eventDoc.totalCapacity,
        eventDoc.availableSeats + booking.ticketQuantity
      );
      await eventDoc.save();
    }
  }

  await Booking.findByIdAndDelete(booking._id);

  return sendSuccess(res, 200, `Booking '${booking.bookingReference}' deleted and seats restored`, {
    id: booking._id,
    restoredSeats: booking.bookingStatus === 'Confirmed' ? booking.ticketQuantity : 0,
  });
});

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
};
