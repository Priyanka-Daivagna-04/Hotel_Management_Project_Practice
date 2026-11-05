const mongoose = require('mongoose');

const roomCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Category code is required (e.g., DLX, SGL)'],
      unique: true,
      uppercase: true,
      trim: true
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price per night is required'],
      min: [0, 'Base price cannot be negative']
    },
    maxOccupancy: {
      type: Number,
      required: [true, 'Max occupancy is required'],
      min: [1, 'Occupancy must be at least 1'],
      default: 2
    },
    bedType: {
      type: String,
      enum: ['Single', 'Double', 'Queen', 'King', 'Twin'],
      default: 'Double'
    },
    sizeSqFt: {
      type: Number,
      default: 300
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    amenities: [
      {
        type: String,
        trim: true
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('RoomCategory', roomCategorySchema);
