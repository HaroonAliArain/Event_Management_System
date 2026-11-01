const Event = require('../models/Event');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const { sendSuccess } = require('../utils/apiResponse');

// Create a new event
const createEvent = asyncHandler(async (req, res, next) => {
  const {
    title,
    description,
    category,
    venue,
    eventDate,
    ticketPrice,
    totalCapacity,
    bannerUrl,
    status,
  } = req.body;

  // Enforce available seats equal to total capacity on creation
  const event = await Event.create({
    title,
    description,
    category,
    venue,
    eventDate,
    ticketPrice,
    totalCapacity,
    availableSeats: totalCapacity,
    bannerUrl: bannerUrl || undefined,
    status: status || 'Upcoming',
  });

  return sendSuccess(res, 201, 'Event created successfully', event);
});

// Get all events with search, category filter, and sorting
const getAllEvents = asyncHandler(async (req, res, next) => {
  const { category, status, search, sort = 'eventDate' } = req.query;

  const query = {};

  if (category && category !== 'All') {
    query.category = category;
  }

  if (status && status !== 'All') {
    query.status = status;
  }

  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { venue: searchRegex },
      { category: searchRegex },
    ];
  }

  // Determine sort order
  let sortOption = { eventDate: 1 };
  if (sort === 'newest') sortOption = { createdAt: -1 };
  if (sort === 'price-low') sortOption = { ticketPrice: 1 };
  if (sort === 'price-high') sortOption = { ticketPrice: -1 };
  if (sort === 'capacity') sortOption = { totalCapacity: -1 };

  const events = await Event.find(query).sort(sortOption);

  return sendSuccess(res, 200, 'Events retrieved successfully', events, {
    count: events.length,
  });
});

// Get single event by ID with active booking stats
const getEventById = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new AppError(`Event not found with ID: ${req.params.id}`, 404));
  }

  // Fetch confirmed bookings for seat calculation
  const activeBookings = await Booking.find({
    event: event._id,
    bookingStatus: 'Confirmed',
  }).populate('customer', 'fullName email phone');

  const totalTicketsBooked = activeBookings.reduce((sum, b) => sum + b.ticketQuantity, 0);

  return sendSuccess(res, 200, 'Event retrieved successfully', {
    ...event.toObject(),
    totalTicketsBooked,
    activeBookingsCount: activeBookings.length,
    bookings: activeBookings,
  });
});

// Update event details and validate capacity
const updateEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new AppError(`Event not found with ID: ${req.params.id}`, 404));
  }

  const {
    title,
    description,
    category,
    venue,
    eventDate,
    ticketPrice,
    totalCapacity,
    bannerUrl,
    status,
  } = req.body;

  // Prevent reducing capacity below already confirmed reservations
  if (totalCapacity !== undefined && totalCapacity !== event.totalCapacity) {
    const confirmedBookings = await Booking.find({
      event: event._id,
      bookingStatus: 'Confirmed',
    });

    const currentlyBooked = confirmedBookings.reduce((sum, b) => sum + b.ticketQuantity, 0);

    if (totalCapacity < currentlyBooked) {
      return next(
        new AppError(
          `Cannot reduce capacity to ${totalCapacity}. There are already ${currentlyBooked} confirmed ticket reservations.`,
          400
        )
      );
    }

    // Recalculate available seats based on new capacity
    event.availableSeats = totalCapacity - currentlyBooked;
    event.totalCapacity = totalCapacity;
  }

  // Update modified fields
  if (title !== undefined) event.title = title;
  if (description !== undefined) event.description = description;
  if (category !== undefined) event.category = category;
  if (venue !== undefined) event.venue = venue;
  if (eventDate !== undefined) event.eventDate = eventDate;
  if (ticketPrice !== undefined) event.ticketPrice = ticketPrice;
  if (bannerUrl !== undefined) event.bannerUrl = bannerUrl;
  if (status !== undefined) event.status = status;

  await event.save();

  return sendSuccess(res, 200, 'Event updated successfully', event);
});

// Delete an event after verifying no active bookings exist
const deleteEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new AppError(`Event not found with ID: ${req.params.id}`, 404));
  }

  // Prevent deletion if active confirmed bookings exist
  const activeBookingsCount = await Booking.countDocuments({
    event: event._id,
    bookingStatus: 'Confirmed',
  });

  if (activeBookingsCount > 0) {
    return next(
      new AppError(
        `Security Checkpoint: Cannot delete event '${event.title}' because it has ${activeBookingsCount} active booking(s). Please cancel or delete the bookings first.`,
        400
      )
    );
  }

  // Clean up legacy cancelled bookings and remove event
  await Booking.deleteMany({ event: event._id });
  await Event.findByIdAndDelete(event._id);

  return sendSuccess(res, 200, `Event '${event.title}' deleted successfully`, {
    id: event._id,
  });
});

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
};
