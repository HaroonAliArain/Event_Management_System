const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [3, 'Full name must be at least 3 characters'],
      maxlength: [80, 'Full name cannot exceed 80 characters'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address (e.g., user@domain.com)',
      ],
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      minlength: [7, 'Phone number must be at least 7 characters'],
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    organization: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to populate bookings placed by this customer
CustomerSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'customer',
});

// Text index for search
CustomerSchema.index({ fullName: 'text', email: 'text', organization: 'text' });

module.exports = mongoose.model('Customer', CustomerSchema);
