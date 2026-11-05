const Room = require('../models/Room');
const RoomCategory = require('../models/RoomCategory');
const Booking = require('../models/Booking');
const Housekeeping = require('../models/Housekeeping');
const { logActivity } = require('../services/activityService');

// List all rooms with filter, search & pagination
exports.getAllRooms = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;

    const { status, category, search } = req.query;
    const query = { isDeleted: false };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { roomNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const totalRooms = await Room.countDocuments(query);
    const totalPages = Math.ceil(totalRooms / limit) || 1;

    const rooms = await Room.find(query)
      .populate('category')
      .sort({ roomNumber: 1 })
      .skip(skip)
      .limit(limit);

    const categories = await RoomCategory.find({ isActive: true });

    res.render('rooms/index', {
      title: 'Room Management | Grand Royale Hotel',
      path: '/rooms',
      rooms,
      categories,
      currentPage: page,
      totalPages,
      totalRooms,
      selectedStatus: status || 'all',
      selectedCategory: category || 'all',
      searchQuery: search || ''
    });
  } catch (err) {
    next(err);
  }
};

// Render Add Room Form
exports.getNewRoom = async (req, res, next) => {
  try {
    const categories = await RoomCategory.find({ isActive: true });
    res.render('rooms/create', {
      title: 'Add New Room | Grand Royale Hotel',
      path: '/rooms',
      categories,
      room: {}
    });
  } catch (err) {
    next(err);
  }
};

// Create Room
exports.createRoom = async (req, res, next) => {
  try {
    const { roomNumber, category, floor, capacity, pricePerNight, description, amenities, imageUrl } = req.body;

    const existing = await Room.findOne({ roomNumber: roomNumber.trim(), isDeleted: false });
    if (existing) {
      req.flash('error_msg', `Room number "${roomNumber}" already exists.`);
      return res.redirect('/rooms/new');
    }

    // Process amenities array
    let amenitiesList = [];
    if (typeof amenities === 'string') {
      amenitiesList = amenities.split(',').map((a) => a.trim()).filter(Boolean);
    } else if (Array.isArray(amenities)) {
      amenitiesList = amenities;
    }

    // Images
    const images = [];
    if (req.file) {
      images.push(`/uploads/rooms/${req.file.filename}`);
    } else if (imageUrl && imageUrl.trim()) {
      images.push(imageUrl.trim());
    } else {
      images.push('/images/default-room.jpg');
    }

    const newRoom = await Room.create({
      roomNumber: roomNumber.trim(),
      category,
      floor: parseInt(floor) || 1,
      capacity: parseInt(capacity) || 2,
      pricePerNight: parseFloat(pricePerNight),
      amenities: amenitiesList,
      description: description || '',
      images,
      status: req.body.status || 'Available'
    });

    await logActivity(req, 'ROOM_CREATED', 'Rooms', `Created room #${newRoom.roomNumber}`);
    req.flash('success_msg', `Room ${newRoom.roomNumber} created successfully.`);
    res.redirect(`/rooms/${newRoom._id}`);
  } catch (err) {
    next(err);
  }
};

// View Room Details
exports.getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findOne({ _id: req.params.id, isDeleted: false }).populate('category');
    if (!room) {
      req.flash('error_msg', 'Room not found.');
      return res.redirect('/rooms');
    }

    // Get current/upcoming bookings for this room
    const upcomingBookings = await Booking.find({
      room: room._id,
      status: { $in: ['Confirmed', 'Checked In'] },
      isDeleted: false
    })
      .populate('guest', 'firstName lastName email phone')
      .sort({ checkInDate: 1 })
      .limit(5);

    // Get recent housekeeping logs
    const housekeepingHistory = await Housekeeping.find({ room: room._id })
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.render('rooms/show', {
      title: `Room ${room.roomNumber} | Grand Royale Hotel`,
      path: '/rooms',
      room,
      upcomingBookings,
      housekeepingHistory
    });
  } catch (err) {
    next(err);
  }
};

// Render Edit Room Form
exports.getEditRoom = async (req, res, next) => {
  try {
    const room = await Room.findOne({ _id: req.params.id, isDeleted: false });
    if (!room) {
      req.flash('error_msg', 'Room not found.');
      return res.redirect('/rooms');
    }

    const categories = await RoomCategory.find({ isActive: true });
    res.render('rooms/edit', {
      title: `Edit Room ${room.roomNumber} | Grand Royale Hotel`,
      path: '/rooms',
      room,
      categories
    });
  } catch (err) {
    next(err);
  }
};

// Update Room
exports.updateRoom = async (req, res, next) => {
  try {
    const { roomNumber, category, floor, capacity, pricePerNight, description, amenities, status, imageUrl } = req.body;

    const room = await Room.findOne({ _id: req.params.id, isDeleted: false });
    if (!room) {
      req.flash('error_msg', 'Room not found.');
      return res.redirect('/rooms');
    }

    // Check duplicate room number
    if (roomNumber.trim() !== room.roomNumber) {
      const duplicate = await Room.findOne({ roomNumber: roomNumber.trim(), isDeleted: false });
      if (duplicate) {
        req.flash('error_msg', `Room number "${roomNumber}" is already in use.`);
        return res.redirect(`/rooms/${room._id}/edit`);
      }
    }

    let amenitiesList = room.amenities;
    if (typeof amenities === 'string') {
      amenitiesList = amenities.split(',').map((a) => a.trim()).filter(Boolean);
    } else if (Array.isArray(amenities)) {
      amenitiesList = amenities;
    }

    if (req.file) {
      room.images = [`/uploads/rooms/${req.file.filename}`];
    } else if (imageUrl && imageUrl.trim()) {
      room.images = [imageUrl.trim()];
    }

    room.roomNumber = roomNumber.trim();
    room.category = category;
    room.floor = parseInt(floor) || room.floor;
    room.capacity = parseInt(capacity) || room.capacity;
    room.pricePerNight = parseFloat(pricePerNight);
    room.description = description || '';
    room.amenities = amenitiesList;
    if (status) room.status = status;

    await room.save();
    await logActivity(req, 'ROOM_UPDATED', 'Rooms', `Updated room #${room.roomNumber}`);

    req.flash('success_msg', `Room ${room.roomNumber} updated successfully.`);
    res.redirect(`/rooms/${room._id}`);
  } catch (err) {
    next(err);
  }
};

// Quick Status Update (PATCH)
exports.updateRoomStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const room = await Room.findOne({ _id: req.params.id, isDeleted: false });
    if (!room) {
      req.flash('error_msg', 'Room not found.');
      return res.redirect('/rooms');
    }

    const prevStatus = room.status;
    room.status = status;
    await room.save();

    await logActivity(req, 'ROOM_STATUS_CHANGE', 'Rooms', `Changed Room #${room.roomNumber} status from ${prevStatus} to ${status}`);
    req.flash('success_msg', `Room ${room.roomNumber} status changed to ${status}.`);
    res.redirect(req.header('Referer') || `/rooms/${room._id}`);
  } catch (err) {
    next(err);
  }
};

// Soft Delete Room
exports.deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findOne({ _id: req.params.id, isDeleted: false });
    if (!room) {
      req.flash('error_msg', 'Room not found.');
      return res.redirect('/rooms');
    }

    // Check if there are active bookings
    const activeBooking = await Booking.findOne({
      room: room._id,
      status: { $in: ['Confirmed', 'Checked In'] },
      isDeleted: false
    });

    if (activeBooking) {
      req.flash('error_msg', `Cannot delete room #${room.roomNumber}. It has active or upcoming reservations.`);
      return res.redirect(`/rooms/${room._id}`);
    }

    room.isDeleted = true;
    await room.save();

    await logActivity(req, 'ROOM_DELETED', 'Rooms', `Soft deleted room #${room.roomNumber}`);
    req.flash('success_msg', `Room ${room.roomNumber} has been removed.`);
    res.redirect('/rooms');
  } catch (err) {
    next(err);
  }
};

// Room Categories List & Add
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await RoomCategory.find();
    res.render('rooms/categories', {
      title: 'Room Categories | Grand Royale Hotel',
      path: '/rooms',
      categories
    });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, code, basePrice, maxOccupancy, bedType, sizeSqFt, description, amenities } = req.body;

    let amenitiesList = [];
    if (typeof amenities === 'string') {
      amenitiesList = amenities.split(',').map((a) => a.trim()).filter(Boolean);
    }

    await RoomCategory.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      basePrice: parseFloat(basePrice),
      maxOccupancy: parseInt(maxOccupancy) || 2,
      bedType: bedType || 'Double',
      sizeSqFt: parseInt(sizeSqFt) || 300,
      description: description || '',
      amenities: amenitiesList
    });

    await logActivity(req, 'CATEGORY_CREATED', 'Rooms', `Created category ${name}`);
    req.flash('success_msg', `Category "${name}" added successfully.`);
    res.redirect('/rooms/categories');
  } catch (err) {
    next(err);
  }
};
