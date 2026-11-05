const Guest = require('../models/Guest');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { logActivity } = require('../services/activityService');

// List all guests
exports.getAllGuests = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { search } = req.query;

    const query = { isDeleted: false };
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { idNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const totalGuests = await Guest.countDocuments(query);
    const totalPages = Math.ceil(totalGuests / limit) || 1;

    const guests = await Guest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render('guests/index', {
      title: 'Guest Directory | Grand Royale Hotel',
      path: '/guests',
      guests,
      currentPage: page,
      totalPages,
      totalGuests,
      searchQuery: search || ''
    });
  } catch (err) {
    next(err);
  }
};

// Render New Guest Form
exports.getNewGuest = (req, res) => {
  res.render('guests/create', {
    title: 'Register New Guest | Grand Royale Hotel',
    path: '/guests',
    guest: {}
  });
};

// Create Guest
exports.createGuest = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, idType, idNumber, nationality, street, city, state, country, zipCode, specialRequests } = req.body;

    const guest = await Guest.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      idType: idType || 'Passport',
      idNumber: idNumber || '',
      nationality: nationality || '',
      address: {
        street: street || '',
        city: city || '',
        state: state || '',
        country: country || '',
        zipCode: zipCode || ''
      },
      specialRequests: specialRequests || ''
    });

    await logActivity(req, 'GUEST_CREATED', 'Guests', `Registered guest ${guest.fullName}`);
    req.flash('success_msg', `Guest ${guest.fullName} registered successfully.`);
    res.redirect(`/guests/${guest._id}`);
  } catch (err) {
    next(err);
  }
};

// View Guest Details (with bookings & payments history)
exports.getGuestById = async (req, res, next) => {
  try {
    const guest = await Guest.findOne({ _id: req.params.id, isDeleted: false });
    if (!guest) {
      req.flash('error_msg', 'Guest not found.');
      return res.redirect('/guests');
    }

    const bookings = await Booking.find({ guest: guest._id, isDeleted: false })
      .populate('room')
      .sort({ createdAt: -1 });

    const payments = await Payment.find({ guest: guest._id })
      .populate('booking')
      .sort({ createdAt: -1 });

    res.render('guests/show', {
      title: `${guest.fullName} | Guest Profile`,
      path: '/guests',
      guest,
      bookings,
      payments
    });
  } catch (err) {
    next(err);
  }
};

// Render Edit Guest Form
exports.getEditGuest = async (req, res, next) => {
  try {
    const guest = await Guest.findOne({ _id: req.params.id, isDeleted: false });
    if (!guest) {
      req.flash('error_msg', 'Guest not found.');
      return res.redirect('/guests');
    }

    res.render('guests/edit', {
      title: `Edit Guest: ${guest.fullName} | Grand Royale Hotel`,
      path: '/guests',
      guest
    });
  } catch (err) {
    next(err);
  }
};

// Update Guest
exports.updateGuest = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, idType, idNumber, nationality, street, city, state, country, zipCode, specialRequests } = req.body;

    const guest = await Guest.findOne({ _id: req.params.id, isDeleted: false });
    if (!guest) {
      req.flash('error_msg', 'Guest not found.');
      return res.redirect('/guests');
    }

    guest.firstName = firstName.trim();
    guest.lastName = lastName.trim();
    guest.email = email.trim().toLowerCase();
    guest.phone = phone.trim();
    guest.idType = idType || guest.idType;
    guest.idNumber = idNumber || guest.idNumber;
    guest.nationality = nationality || guest.nationality;
    guest.address = {
      street: street || '',
      city: city || '',
      state: state || '',
      country: country || '',
      zipCode: zipCode || ''
    };
    guest.specialRequests = specialRequests || guest.specialRequests;

    await guest.save();
    await logActivity(req, 'GUEST_UPDATED', 'Guests', `Updated guest ${guest.fullName}`);

    req.flash('success_msg', `Guest ${guest.fullName} updated successfully.`);
    res.redirect(`/guests/${guest._id}`);
  } catch (err) {
    next(err);
  }
};

// Delete Guest
exports.deleteGuest = async (req, res, next) => {
  try {
    const guest = await Guest.findOne({ _id: req.params.id, isDeleted: false });
    if (!guest) {
      req.flash('error_msg', 'Guest not found.');
      return res.redirect('/guests');
    }

    // Check if active bookings exist
    const activeBooking = await Booking.findOne({
      guest: guest._id,
      status: { $in: ['Confirmed', 'Checked In'] },
      isDeleted: false
    });

    if (activeBooking) {
      req.flash('error_msg', `Cannot remove guest ${guest.fullName} while an active booking exists.`);
      return res.redirect(`/guests/${guest._id}`);
    }

    guest.isDeleted = true;
    await guest.save();

    await logActivity(req, 'GUEST_DELETED', 'Guests', `Soft deleted guest ${guest.fullName}`);
    req.flash('success_msg', `Guest ${guest.fullName} has been removed.`);
    res.redirect('/guests');
  } catch (err) {
    next(err);
  }
};
