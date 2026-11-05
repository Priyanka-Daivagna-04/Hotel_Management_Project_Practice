const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Guest = require('../models/Guest');
const Payment = require('../models/Payment');
const RoomCategory = require('../models/RoomCategory');
const Housekeeping = require('../models/Housekeeping');
const { logActivity } = require('../services/activityService');
const {
  isRoomAvailable,
  findAvailableRooms,
  generateBookingNumber,
  calculateNights
} = require('../services/bookingService');
const mongoose = require('mongoose');

// List all bookings
exports.getAllBookings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, search, startDate, endDate } = req.query;
    const query = { isDeleted: false };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (startDate && endDate) {
      query.checkInDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (search) {
      // Find matching guest IDs
      const matchingGuests = await Guest.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      const guestIds = matchingGuests.map((g) => g._id);

      query.$or = [
        { bookingNumber: { $regex: search, $options: 'i' } },
        { guest: { $in: guestIds } }
      ];
    }

    const totalBookings = await Booking.countDocuments(query);
    const totalPages = Math.ceil(totalBookings / limit) || 1;

    const bookings = await Booking.find(query)
      .populate('guest')
      .populate({
        path: 'room',
        populate: { path: 'category' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render('bookings/index', {
      title: 'Reservations & Bookings | Grand Royale Hotel',
      path: '/bookings',
      bookings,
      currentPage: page,
      totalPages,
      totalBookings,
      selectedStatus: status || 'all',
      searchQuery: search || '',
      startDate: startDate || '',
      endDate: endDate || ''
    });
  } catch (err) {
    next(err);
  }
};

// Render New Booking Form / Step 1 Availability check
exports.getNewBooking = async (req, res, next) => {
  try {
    const { checkInDate, checkOutDate, adults, children, categoryId } = req.query;
    const categories = await RoomCategory.find({ isActive: true });
    const guests = await Guest.find({ isDeleted: false }).sort({ firstName: 1 });

    let availableRooms = [];
    let searched = false;

    if (checkInDate && checkOutDate) {
      searched = true;
      const totalGuests = (parseInt(adults) || 1) + (parseInt(children) || 0);
      availableRooms = await findAvailableRooms(checkInDate, checkOutDate, totalGuests, categoryId);
    }

    res.render('bookings/create', {
      title: 'Create Reservation | Grand Royale Hotel',
      path: '/bookings',
      categories,
      guests,
      availableRooms,
      searched,
      query: req.query
    });
  } catch (err) {
    next(err);
  }
};

// Create Booking
exports.createBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  let transactionStarted = false;

  try {
    // Attempt transaction if supported (replica set)
    try {
      session.startTransaction();
      transactionStarted = true;
    } catch (txErr) {
      transactionStarted = false;
    }

    const {
      guestType,
      guestId,
      newGuestName,
      newGuestFirstName,
      newGuestLastName,
      newGuestEmail,
      newGuestPhone,
      newGuestIdType,
      newGuestIdNumber,
      newGuestCity,
      newGuestState,
      roomId,
      checkInDate,
      checkOutDate,
      adults,
      children,
      specialRequests,
      initialPaymentAmount,
      paymentMethod
    } = req.body;

    // Validate dates
    const inDate = new Date(checkInDate);
    const outDate = new Date(checkOutDate);

    if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
      req.flash('error_msg', 'Invalid check-in or check-out date.');
      return res.redirect('/bookings/new');
    }

    if (inDate >= outDate) {
      req.flash('error_msg', 'Check-out date must be after check-in date.');
      return res.redirect('/bookings/new');
    }

    // Determine guest: existing or create on the fly
    let finalGuestId = guestId;
    const isNewGuest = guestType === 'new' || guestId === 'new' || !guestId;

    if (isNewGuest) {
      const fName = (newGuestFirstName || (newGuestName ? newGuestName.trim().split(' ')[0] : '')).trim();
      const lName = (newGuestLastName || (newGuestName ? newGuestName.trim().split(' ').slice(1).join(' ') : '') || '-').trim();
      const email = (newGuestEmail || '').trim().toLowerCase();
      const phone = (newGuestPhone || '').trim();

      if (!fName || !email || !phone) {
        req.flash('error_msg', 'Please provide First Name, Email, and Phone Number for the new guest.');
        return res.redirect('/bookings/new');
      }

      // Check if guest already exists by email or phone to reduce complexity and avoid duplicates
      let guest = await Guest.findOne({
        isDeleted: false,
        $or: [{ email }, { phone }]
      });

      if (!guest) {
        const [createdGuest] = await Guest.create(
          [
            {
              firstName: fName,
              lastName: lName,
              email,
              phone,
              idType: newGuestIdType || 'Aadhaar Card',
              idNumber: newGuestIdNumber ? newGuestIdNumber.trim() : '',
              nationality: 'Indian',
              address: {
                city: newGuestCity ? newGuestCity.trim() : '',
                state: newGuestState ? newGuestState.trim() : '',
                country: 'India'
              }
            }
          ],
          transactionStarted ? { session } : {}
        );
        guest = createdGuest;
      } else {
        // If existing record was found, enrich ID details if newly provided
        if (newGuestIdNumber && !guest.idNumber) {
          guest.idType = newGuestIdType || guest.idType;
          guest.idNumber = newGuestIdNumber.trim();
          await guest.save(transactionStarted ? { session } : {});
        }
      }
      finalGuestId = guest._id;
    }

    // Verify room availability
    const available = await isRoomAvailable(roomId, checkInDate, checkOutDate);
    if (!available) {
      if (transactionStarted) await session.abortTransaction();
      req.flash('error_msg', 'Selected room is no longer available for the specified dates.');
      return res.redirect('/bookings/new');
    }

    const room = await Room.findById(roomId);
    if (!room) {
      if (transactionStarted) await session.abortTransaction();
      req.flash('error_msg', 'Room not found.');
      return res.redirect('/bookings/new');
    }

    const nights = calculateNights(checkInDate, checkOutDate);
    const totalPrice = nights * room.pricePerNight;
    const initialPaid = parseFloat(initialPaymentAmount) || 0;

    let paymentStatus = 'Pending';
    if (initialPaid >= totalPrice) {
      paymentStatus = 'Paid';
    } else if (initialPaid > 0) {
      paymentStatus = 'Partially Paid';
    }

    const bookingNumber = generateBookingNumber();

    const [booking] = await Booking.create(
      [
        {
          bookingNumber,
          guest: finalGuestId,
          room: room._id,
          checkInDate: inDate,
          checkOutDate: outDate,
          adults: parseInt(adults) || 1,
          children: parseInt(children) || 0,
          nights,
          pricePerNight: room.pricePerNight,
          totalPrice,
          paidAmount: initialPaid,
          status: 'Confirmed',
          paymentStatus,
          specialRequests: specialRequests || '',
          bookedBy: req.session && req.session.user ? req.session.user._id : null
        }
      ],
      transactionStarted ? { session } : {}
    );

    // If initial payment was provided, create Payment record
    if (initialPaid > 0) {
      const invNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      await Payment.create(
        [
          {
            invoiceNumber: invNumber,
            booking: booking._id,
            guest: finalGuestId,
            amount: initialPaid,
            paymentMethod: paymentMethod || 'Cash',
            status: 'Paid',
            notes: 'Initial deposit at booking creation',
            recordedBy: req.session && req.session.user ? req.session.user._id : null
          }
        ],
        transactionStarted ? { session } : {}
      );
    }

    // If check-in is today, set room status to Reserved
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDay = new Date(inDate);
    bookingDay.setHours(0, 0, 0, 0);

    if (bookingDay.getTime() === today.getTime() && room.status === 'Available') {
      room.status = 'Reserved';
      await room.save(transactionStarted ? { session } : {});
    }

    if (transactionStarted) {
      await session.commitTransaction();
    }

    await logActivity(req, 'BOOKING_CREATED', 'Bookings', `Created reservation #${booking.bookingNumber} for room #${room.roomNumber}`);
    req.flash('success_msg', `Reservation #${booking.bookingNumber} successfully created!`);
    res.redirect(`/bookings/${booking._id}`);
  } catch (err) {
    if (transactionStarted) {
      await session.abortTransaction();
    }
    next(err);
  } finally {
    session.endSession();
  }
};

// View Booking Voucher / Details
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false })
      .populate('guest')
      .populate({
        path: 'room',
        populate: { path: 'category' }
      })
      .populate('bookedBy', 'name');

    if (!booking) {
      req.flash('error_msg', 'Booking not found.');
      return res.redirect('/bookings');
    }

    // Get payments associated with this booking
    const payments = await Payment.find({ booking: booking._id })
      .populate('recordedBy', 'name')
      .sort({ createdAt: -1 });

    res.render('bookings/show', {
      title: `Reservation ${booking.bookingNumber} | Grand Royale Hotel`,
      path: '/bookings',
      booking,
      payments
    });
  } catch (err) {
    next(err);
  }
};

// Render Edit Booking Form
exports.getEditBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false })
      .populate('guest')
      .populate('room');

    if (!booking) {
      req.flash('error_msg', 'Booking not found.');
      return res.redirect('/bookings');
    }

    const rooms = await Room.find({ isDeleted: false }).populate('category');

    res.render('bookings/edit', {
      title: `Edit Reservation ${booking.bookingNumber} | Grand Royale Hotel`,
      path: '/bookings',
      booking,
      rooms
    });
  } catch (err) {
    next(err);
  }
};

// Update Booking
exports.updateBooking = async (req, res, next) => {
  try {
    const { roomId, checkInDate, checkOutDate, adults, children, specialRequests, status } = req.body;

    const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false });
    if (!booking) {
      req.flash('error_msg', 'Booking not found.');
      return res.redirect('/bookings');
    }

    const inDate = new Date(checkInDate);
    const outDate = new Date(checkOutDate);

    // If dates or room changed, check availability
    const roomChanged = roomId && roomId !== booking.room.toString();
    const datesChanged =
      inDate.getTime() !== booking.checkInDate.getTime() ||
      outDate.getTime() !== booking.checkOutDate.getTime();

    const targetRoomId = roomId || booking.room;

    if (roomChanged || datesChanged) {
      const available = await isRoomAvailable(targetRoomId, inDate, outDate, booking._id);
      if (!available) {
        req.flash('error_msg', 'The selected room is not available for these dates.');
        return res.redirect(`/bookings/${booking._id}/edit`);
      }
    }

    const targetRoom = await Room.findById(targetRoomId);
    const nights = calculateNights(inDate, outDate);
    const totalPrice = nights * targetRoom.pricePerNight;

    booking.room = targetRoom._id;
    booking.checkInDate = inDate;
    booking.checkOutDate = outDate;
    booking.adults = parseInt(adults) || booking.adults;
    booking.children = parseInt(children) || booking.children;
    booking.nights = nights;
    booking.pricePerNight = targetRoom.pricePerNight;
    booking.totalPrice = totalPrice;
    booking.specialRequests = specialRequests || '';

    // Re-evaluate payment status
    if (booking.paidAmount >= totalPrice) {
      booking.paymentStatus = 'Paid';
    } else if (booking.paidAmount > 0) {
      booking.paymentStatus = 'Partially Paid';
    } else {
      booking.paymentStatus = 'Pending';
    }

    if (status) {
      booking.status = status;
    }

    await booking.save();
    await logActivity(req, 'BOOKING_UPDATED', 'Bookings', `Updated reservation #${booking.bookingNumber}`);

    req.flash('success_msg', 'Reservation updated successfully.');
    res.redirect(`/bookings/${booking._id}`);
  } catch (err) {
    next(err);
  }
};

// Receptionist Check-in Action
exports.checkInGuest = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false }).populate('room');
    if (!booking) {
      req.flash('error_msg', 'Booking not found.');
      return res.redirect('/bookings');
    }

    if (booking.status === 'Checked In') {
      req.flash('error_msg', 'Guest is already checked in.');
      return res.redirect(`/bookings/${booking._id}`);
    }

    booking.status = 'Checked In';
    booking.actualCheckIn = new Date();
    await booking.save();

    // Update room status to Occupied
    if (booking.room) {
      await Room.findByIdAndUpdate(booking.room._id, { status: 'Occupied' });
    }

    await logActivity(req, 'CHECK_IN', 'Bookings', `Checked in guest for reservation #${booking.bookingNumber}`);
    req.flash('success_msg', `Guest successfully checked in to Room ${booking.room.roomNumber}!`);
    res.redirect(`/bookings/${booking._id}`);
  } catch (err) {
    next(err);
  }
};

// Receptionist Check-out Action
exports.checkOutGuest = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false }).populate('room');
    if (!booking) {
      req.flash('error_msg', 'Booking not found.');
      return res.redirect('/bookings');
    }

    // Check outstanding balance
    const balance = (booking.totalPrice || 0) - (booking.paidAmount || 0);
    if (balance > 0 && req.body.force !== 'true') {
      req.flash(
        'error_msg',
        `Cannot check out. Outstanding balance is $${balance.toFixed(2)}. Please record payment first or confirm settlement.`
      );
      return res.redirect(`/bookings/${booking._id}`);
    }

    booking.status = 'Checked Out';
    booking.actualCheckOut = new Date();
    await booking.save();

    // Update room status to Maintenance for housekeeping cleaning
    if (booking.room) {
      await Room.findByIdAndUpdate(booking.room._id, { status: 'Maintenance' });

      // Automatically create a housekeeping task for checkout cleaning
      await Housekeeping.create({
        room: booking.room._id,
        taskType: 'Checkout Clean',
        priority: 'High',
        status: 'Pending',
        remarks: `Room vacated after checkout (${booking.bookingNumber}). Thorough sanitization and restocking required.`
      });
    }

    await logActivity(req, 'CHECK_OUT', 'Bookings', `Checked out guest for reservation #${booking.bookingNumber}`);
    req.flash('success_msg', `Check-out completed. Room ${booking.room.roomNumber} set to Maintenance for housekeeping.`);
    res.redirect(`/bookings/${booking._id}`);
  } catch (err) {
    next(err);
  }
};

// Quick Status Update (PATCH)
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false }).populate('room');
    if (!booking) {
      req.flash('error_msg', 'Booking not found.');
      return res.redirect('/bookings');
    }

    booking.status = status;
    if (status === 'Cancelled') {
      booking.cancellationReason = req.body.cancellationReason || 'Cancelled by staff';
      if (booking.room && booking.room.status === 'Reserved') {
        await Room.findByIdAndUpdate(booking.room._id, { status: 'Available' });
      }
    }

    await booking.save();
    await logActivity(req, 'BOOKING_STATUS_CHANGE', 'Bookings', `Changed reservation #${booking.bookingNumber} status to ${status}`);

    req.flash('success_msg', `Reservation status changed to ${status}.`);
    res.redirect(`/bookings/${booking._id}`);
  } catch (err) {
    next(err);
  }
};

// Cancel / Soft Delete Booking
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false }).populate('room');
    if (!booking) {
      req.flash('error_msg', 'Booking not found.');
      return res.redirect('/bookings');
    }

    booking.status = 'Cancelled';
    booking.cancellationReason = req.body.cancellationReason || 'Cancelled by user';
    await booking.save();

    if (booking.room && (booking.room.status === 'Reserved' || booking.room.status === 'Occupied')) {
      await Room.findByIdAndUpdate(booking.room._id, { status: 'Available' });
    }

    await logActivity(req, 'BOOKING_CANCELLED', 'Bookings', `Cancelled reservation #${booking.bookingNumber}`);
    req.flash('success_msg', `Reservation #${booking.bookingNumber} has been cancelled.`);
    res.redirect('/bookings');
  } catch (err) {
    next(err);
  }
};
