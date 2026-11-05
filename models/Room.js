const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
      index: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomCategory',
      required: [true, 'Room category is required'],
      index: true
    },
    floor: {
      type: Number,
      required: [true, 'Floor number is required'],
      default: 1
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1 guest'],
      default: 2
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Price per night is required'],
      min: [0, 'Price cannot be negative']
    },
    amenities: [
      {
        type: String,
        trim: true
      }
    ],
    description: {
      type: String,
      trim: true,
      default: ''
    },
    images: [
      {
        type: String,
        trim: true
      }
    ],
    status: {
      type: String,
      enum: ['Available', 'Occupied', 'Reserved', 'Maintenance'],
      default: 'Available',
      index: true
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

// Virtual for primary image
roomSchema.virtual('primaryImage').get(function () {
  if (this.images && this.images.length > 0) {
    return this.images[0];
  }
  return '/images/default-room.jpg';
});

// Configure toJSON and toObject to include virtuals
roomSchema.set('toJSON', { virtuals: true });
roomSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Room', roomSchema);
