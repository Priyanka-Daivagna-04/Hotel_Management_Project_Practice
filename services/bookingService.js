const Booking = require('../models/Booking');
const Room = require('../models/Room');
const mongoose = require('mongoose');

/**
 * Checks if a room is available for the given dates
 * Excludes an optional bookingId (useful when updating an existing booking)
 */
const isRoomAvailable = async (roomId, checkInDate, checkOutDate, excludeBookingId = null) => {
  const inDate = new Date(checkInDate);
  const outDate = new Date(checkOutDate);

  const query = {
    room: roomId,
    status: { $in: ['Confirmed', 'Checked In'] },
    isDeleted: false,
    $or: [
      // Condition: existing booking overlaps with proposed dates
      {
        checkInDate: { $lt: outDate },
        checkOutDate: { $gt: inDate }
      }
    ]
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBooking = await Booking.findOne(query);
  return !conflictingBooking;
};

/**
 * Finds all rooms available for given dates and capacity
 */
const findAvailableRooms = async (checkInDate, checkOutDate, guests = 1, categoryId = null) => {
  const inDate = new Date(checkInDate);
  const outDate = new Date(checkOutDate);

  // 1. Find all bookings that overlap
  const conflictingBookings = await Booking.find({
    status: { $in: ['Confirmed', 'Checked In'] },
    isDeleted: false,
    checkInDate: { $lt: outDate },
    checkOutDate: { $gt: inDate }
  }).select('room');

  const unavailableRoomIds = conflictingBookings.map((b) => b.room);

  // 2. Query rooms that are not in the unavailable list and not in Maintenance or deleted
  const roomQuery = {
    _id: { $nin: unavailableRoomIds },
    isDeleted: false,
    capacity: { $gte: parseInt(guests) || 1 }
  };

  if (categoryId && categoryId !== 'all') {
    roomQuery.category = categoryId;
  }

  const availableRooms = await Room.find(roomQuery)
    .populate('category')
    .sort({ pricePerNight: 1 });

  return availableRooms;
};

/**
 * Generates a unique booking reference number
 */
const generateBookingNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `BK-${dateStr}-${randomSuffix}`;
};

/**
 * Calculates number of nights between check-in and check-out
 */
const calculateNights = (checkInDate, checkOutDate) => {
  const inDate = new Date(checkInDate);
  const outDate = new Date(checkOutDate);
  const diffTime = outDate.getTime() - inDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
};

module.exports = {
  isRoomAvailable,
  findAvailableRooms,
  generateBookingNumber,
  calculateNights
};
