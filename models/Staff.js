const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    department: {
      type: String,
      enum: ['Front Desk', 'Management', 'Housekeeping', 'Maintenance', 'Food & Beverage'],
      default: 'Front Desk'
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true
    },
    shift: {
      type: String,
      enum: ['Morning', 'Evening', 'Night', 'General'],
      default: 'Morning'
    },
    salary: {
      type: Number,
      default: 0
    },
    dateOfJoining: {
      type: Date,
      default: Date.now
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relation: { type: String, default: '' },
      phone: { type: String, default: '' }
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Staff', staffSchema);
