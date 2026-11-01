const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer reference is required'],
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required'],
      index: true,
    },
    ticketQuantity: {
      type: Number,
      required: [true, 'Ticket quantity is required'],
      min: [1, 'Minimum booking is 1 ticket'],
      max: [10, 'Maximum allowed booking is 10 tickets per order'],
    },
    ticketType: {
      type: String,
      enum: {
        values: ['Standard', 'VIP', 'Student'],
        message: '{VALUE} is not a valid ticket tier',
      },
      default: 'Standard',
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    tierMultiplier: {
      type: Number,
      default: 1.0,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['Paid', 'Pending', 'Refunded'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'Pending',
      index: true,
    },
    bookingStatus: {
      type: String,
      enum: {
        values: ['Confirmed', 'Cancelled'],
        message: '{VALUE} is not a valid booking status',
      },
      default: 'Confirmed',
      index: true,
    },
    specialRequests: {
      type: String,
      trim: true,
      maxlength: [250, 'Special requests cannot exceed 250 characters'],
      default: '',
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook: auto-generate unique booking reference if not present
BookingSchema.pre('save', function (next) {
  if (!this.bookingReference) {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    this.bookingReference = `EVT-${timestamp}-${randomHex}`;
  }
  next();
});

module.exports = mongoose.model('Booking', BookingSchema);
