const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
      index: true
    },
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guest',
      required: [true, 'Guest reference is required'],
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than zero']
    },
    paymentMethod: {
      type: String,
      enum: ['UPI / Google Pay / PhonePe', 'Net Banking', 'Credit Card', 'Debit Card', 'Cash', 'NEFT / RTGS'],
      default: 'UPI / Google Pay / PhonePe',
      required: [true, 'Payment method is required']
    },
    transactionId: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Partially Paid', 'Refunded'],
      default: 'Paid',
      index: true
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
