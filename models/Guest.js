const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      lowercase: true,
      trim: true,
      index: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true
    },
    idType: {
      type: String,
      enum: ['Aadhaar Card', 'PAN Card', 'Voter ID', 'Driving License', 'Passport', 'Other'],
      default: 'Aadhaar Card'
    },
    idNumber: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: 'India' },
      zipCode: { type: String, default: '' }
    },
    nationality: {
      type: String,
      trim: true,
      default: 'Indian'
    },
    specialRequests: {
      type: String,
      default: ''
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

// Virtual for full name
guestSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

guestSchema.set('toJSON', { virtuals: true });
guestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Guest', guestSchema);
