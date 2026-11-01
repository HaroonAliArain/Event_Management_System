const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      minlength: [3, 'Event title must be at least 3 characters'],
      maxlength: [120, 'Event title cannot exceed 120 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'Technology',
          'Business',
          'Music & Arts',
          'Workshop',
          'Conference',
          'Sports',
          'Other',
        ],
        message: '{VALUE} is not a supported event category',
      },
      index: true,
    },
    venue: {
      type: String,
      required: [true, 'Venue location is required'],
      trim: true,
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date and time is required'],
      validate: {
        validator: function (value) {
          // Allow existing past events when updating status, but for new documents encourage valid dates
          return value instanceof Date && !isNaN(value);
        },
        message: 'Please provide a valid date and time',
      },
    },
    ticketPrice: {
      type: Number,
      required: [true, 'Ticket price is required'],
      min: [0, 'Ticket price cannot be negative'],
      default: 0,
    },
    totalCapacity: {
      type: Number,
      required: [true, 'Total venue capacity is required'],
      min: [1, 'Total capacity must be at least 1 seat'],
    },
    availableSeats: {
      type: Number,
      min: [0, 'Available seats cannot be negative'],
    },
    bannerUrl: {
      type: String,
      trim: true,
      default: '/events/software-summit.jpg',
    },
    status: {
      type: String,
      enum: {
        values: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid event status',
      },
      default: 'Upcoming',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook: initialize availableSeats on new event creation if not set
EventSchema.pre('validate', function (next) {
  if (this.isNew && (this.availableSeats === undefined || this.availableSeats === null)) {
    this.availableSeats = this.totalCapacity;
  }
  next();
});

// Virtual: calculate booked seats
EventSchema.virtual('bookedSeats').get(function () {
  return (this.totalCapacity || 0) - (this.availableSeats || 0);
});

// Virtual: calculate occupancy percentage
EventSchema.virtual('occupancyRate').get(function () {
  if (!this.totalCapacity || this.totalCapacity === 0) return 0;
  const booked = (this.totalCapacity - this.availableSeats);
  return Math.min(100, Math.max(0, Math.round((booked / this.totalCapacity) * 100)));
});

// Virtual: check if sold out
EventSchema.virtual('isSoldOut').get(function () {
  return this.availableSeats <= 0;
});

// Compound text index for search
EventSchema.index({ title: 'text', description: 'text', venue: 'text' });

module.exports = mongoose.model('Event', EventSchema);
