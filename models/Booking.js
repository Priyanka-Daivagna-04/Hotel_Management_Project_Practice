const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guest',
      required: [true, 'Guest is required'],
      index: true
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required'],
      index: true
    },
    checkInDate: {
      type: Date,
      required: [true, 'Check-in date is required'],
      index: true
    },
    checkOutDate: {
      type: Date,
      required: [true, 'Check-out date is required'],
      index: true
    },
    actualCheckIn: {
      type: Date
    },
    actualCheckOut: {
      type: Date
    },
    adults: {
      type: Number,
      required: true,
      min: [1, 'At least 1 adult is required'],
      default: 1
    },
    children: {
      type: Number,
      min: 0,
      default: 0
    },
    nights: {
      type: Number,
      required: true,
      min: [1, 'Booking must be at least 1 night']
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['Confirmed', 'Checked In', 'Checked Out', 'Cancelled'],
      default: 'Confirmed',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Partially Paid', 'Paid', 'Refunded'],
      default: 'Pending',
      index: true
    },
    specialRequests: {
      type: String,
      default: ''
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Virtual for outstanding balance
bookingSchema.virtual('balanceAmount').get(function () {
  const balance = (this.totalPrice || 0) - (this.paidAmount || 0);
  return balance > 0 ? balance : 0;
});

// Compound index for querying room overlaps
bookingSchema.index({ room: 1, status: 1, checkInDate: 1, checkOutDate: 1 });

bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Booking', bookingSchema);
