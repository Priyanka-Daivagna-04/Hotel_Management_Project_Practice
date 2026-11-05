const mongoose = require('mongoose');

const housekeepingSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room reference is required'],
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    taskType: {
      type: String,
      enum: ['Daily Cleaning', 'Deep Clean', 'Checkout Clean', 'Maintenance Repair', 'Inspection'],
      default: 'Daily Cleaning'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
      index: true
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    },
    scheduledDate: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Housekeeping', housekeepingSchema);
