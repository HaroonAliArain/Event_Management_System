const Customer = require('../models/Customer');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const { sendSuccess } = require('../utils/apiResponse');

// Register a new customer
const createCustomer = asyncHandler(async (req, res, next) => {
  const { fullName, email, phone, city, organization } = req.body;

  // Validate email uniqueness before creating customer
  const existingCustomer = await Customer.findOne({ email: email.toLowerCase().trim() });
  if (existingCustomer) {
    return next(new AppError(`A customer with email '${email}' is already registered.`, 409));
  }

  const customer = await Customer.create({
    fullName,
    email: email.toLowerCase().trim(),
    phone,
    city: city || '',
    organization: organization || '',
  });

  return sendSuccess(res, 201, 'Customer registered successfully', customer);
});

// Get all customers with search and booking count
const getAllCustomers = asyncHandler(async (req, res, next) => {
  const { search } = req.query;

  const query = {};

  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { city: searchRegex },
      { organization: searchRegex },
    ];
  }

  const customers = await Customer.find(query).sort({ createdAt: -1 });

  // Attach booking statistics to each customer record
  const customerIds = customers.map((c) => c._id);
  const bookings = await Booking.find({ customer: { $in: customerIds } });

  const customersWithStats = customers.map((customer) => {
    const custBookings = bookings.filter((b) => b.customer.toString() === customer._id.toString());
    return {
      ...customer.toObject(),
      totalBookings: custBookings.length,
      confirmedBookings: custBookings.filter((b) => b.bookingStatus === 'Confirmed').length,
    };
  });

  return sendSuccess(res, 200, 'Customers retrieved successfully', customersWithStats, {
    count: customersWithStats.length,
  });
});

// Get single customer profile and full booking history
const getCustomerById = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return next(new AppError(`Customer not found with ID: ${req.params.id}`, 404));
  }

  // Populate booking history with event details
  const bookings = await Booking.find({ customer: customer._id })
    .populate('event', 'title category venue eventDate ticketPrice status bannerUrl')
    .sort({ bookingDate: -1 });

  return sendSuccess(res, 200, 'Customer profile retrieved successfully', {
    ...customer.toObject(),
    bookings,
    totalBookingsCount: bookings.length,
  });
});

// Update customer profile details
const updateCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return next(new AppError(`Customer not found with ID: ${req.params.id}`, 404));
  }

  const { fullName, email, phone, city, organization } = req.body;

  // Validate uniqueness if email is changed
  if (email && email.toLowerCase().trim() !== customer.email) {
    const emailExists = await Customer.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: customer._id },
    });
    if (emailExists) {
      return next(new AppError(`Email '${email}' is already in use by another customer.`, 409));
    }
    customer.email = email.toLowerCase().trim();
  }

  if (fullName !== undefined) customer.fullName = fullName;
  if (phone !== undefined) customer.phone = phone;
  if (city !== undefined) customer.city = city;
  if (organization !== undefined) customer.organization = organization;

  await customer.save();

  return sendSuccess(res, 200, 'Customer details updated successfully', customer);
});

// Delete customer record after verifying no active bookings exist
const deleteCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return next(new AppError(`Customer not found with ID: ${req.params.id}`, 404));
  }

  // Check for active confirmed bookings before deleting
  const activeBookingsCount = await Booking.countDocuments({
    customer: customer._id,
    bookingStatus: 'Confirmed',
  });

  if (activeBookingsCount > 0) {
    return next(
      new AppError(
        `Safety Checkpoint: Cannot delete customer '${customer.fullName}' because they have ${activeBookingsCount} active booking(s). Please cancel or delete their bookings first.`,
        400
      )
    );
  }

  // Remove cancelled bookings and delete customer record
  await Booking.deleteMany({ customer: customer._id });
  await Customer.findByIdAndDelete(customer._id);

  return sendSuccess(res, 200, `Customer '${customer.fullName}' deleted successfully`, {
    id: customer._id,
  });
});

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
