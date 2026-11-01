const Event = require('../models/Event');
const Customer = require('../models/Customer');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

// Get system-wide dashboard metrics and statistics
const getDashboardStats = asyncHandler(async (req, res, next) => {
  // Query all database metrics in parallel
  const [
    totalEvents,
    activeEvents,
    totalCustomers,
    totalBookings,
    confirmedBookingsList,
    recentBookings,
    upcomingEvents,
  ] = await Promise.all([
    Event.countDocuments(),
    Event.countDocuments({ status: { $in: ['Upcoming', 'Ongoing'] } }),
    Customer.countDocuments(),
    Booking.countDocuments(),
    Booking.find({ bookingStatus: 'Confirmed' }),
    Booking.find()
      .populate('customer', 'fullName email')
      .populate('event', 'title ticketPrice')
      .sort({ createdAt: -1 })
      .limit(5),
    Event.find({ status: 'Upcoming' })
      .sort({ eventDate: 1 })
      .limit(4),
  ]);

  // Compute revenue and ticket totals
  const totalRevenue = confirmedBookingsList.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalTicketsSold = confirmedBookingsList.reduce((sum, b) => sum + (b.ticketQuantity || 0), 0);

  // Compute category breakdown
  const events = await Event.find({}, 'category totalCapacity availableSeats');
  const categoryCounts = events.reduce((acc, evt) => {
    acc[evt.category] = (acc[evt.category] || 0) + 1;
    return acc;
  }, {});

  // Compute overall occupancy rate percentage
  const totalCapacitySum = events.reduce((sum, e) => sum + (e.totalCapacity || 0), 0);
  const totalAvailableSeatsSum = events.reduce((sum, e) => sum + (e.availableSeats || 0), 0);
  const overallOccupancyRate = totalCapacitySum > 0
    ? Math.round(((totalCapacitySum - totalAvailableSeatsSum) / totalCapacitySum) * 100)
    : 0;

  return sendSuccess(res, 200, 'Dashboard statistics retrieved successfully', {
    overview: {
      totalEvents,
      activeEvents,
      totalCustomers,
      totalBookings,
      confirmedBookingsCount: confirmedBookingsList.length,
      totalTicketsSold,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCapacitySum,
      totalAvailableSeatsSum,
      overallOccupancyRate,
    },
    categoryBreakdown: categoryCounts,
    recentBookings,
    upcomingEvents,
  });
});

module.exports = {
  getDashboardStats,
};
