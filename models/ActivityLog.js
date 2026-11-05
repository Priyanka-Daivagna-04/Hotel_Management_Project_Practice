const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: {
      type: String,
      default: 'System'
    },
    action: {
      type: String,
      required: true,
      trim: true
    },
    module: {
      type: String,
      enum: ['Auth', 'Rooms', 'Bookings', 'Guests', 'Payments', 'Housekeeping', 'Staff', 'System'],
      required: true,
      index: true
    },
    details: {
      type: String,
      trim: true,
      default: ''
    },
    ipAddress: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
