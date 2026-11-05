const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Guest = require('../models/Guest');
const { logActivity } = require('../services/activityService');

// List all payments
exports.getAllPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, paymentMethod, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } }
      ];
    }

    const totalPayments = await Payment.countDocuments(query);
    const totalPages = Math.ceil(totalPayments / limit) || 1;

    const payments = await Payment.find(query)
      .populate('guest')
      .populate('booking')
      .populate('recordedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Aggregate summary stats
    const totalCollectedAgg = await Payment.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalCollected = totalCollectedAgg.length > 0 ? totalCollectedAgg[0].total : 0;

    res.render('payments/index', {
      title: 'Billing & Payments | Grand Royale Hotel',
      path: '/payments',
      payments,
      currentPage: page,
      totalPages,
      totalPayments,
      totalCollected,
      selectedStatus: status || 'all',
      selectedMethod: paymentMethod || 'all',
      searchQuery: search || ''
    });
  } catch (err) {
    next(err);
  }
};

// Render Payment Form
exports.getNewPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.query;
    let selectedBooking = null;

    if (bookingId) {
      selectedBooking = await Booking.findById(bookingId).populate('guest').populate('room');
    }

    // Get active bookings with outstanding balances
    const activeBookings = await Booking.find({
      status: { $in: ['Confirmed', 'Checked In'] },
      isDeleted: false
    })
      .populate('guest')
      .populate('room')
      .sort({ createdAt: -1 });

    res.render('payments/create', {
      title: 'Record Payment | Grand Royale Hotel',
      path: '/payments',
      selectedBooking,
      activeBookings
    });
  } catch (err) {
    next(err);
  }
};

// Record New Payment
exports.createPayment = async (req, res, next) => {
  try {
    const { bookingId, amount, paymentMethod, transactionId, notes } = req.body;

    const booking = await Booking.findOne({ _id: bookingId, isDeleted: false });
    if (!booking) {
      req.flash('error_msg', 'Booking not found.');
      return res.redirect('/payments/new');
    }

    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      req.flash('error_msg', 'Please enter a valid payment amount.');
      return res.redirect(`/payments/new?bookingId=${bookingId}`);
    }

    const invNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const payment = await Payment.create({
      invoiceNumber: invNumber,
      booking: booking._id,
      guest: booking.guest,
      amount: payAmount,
      paymentMethod,
      transactionId: transactionId || `TXN-${Date.now()}`,
      status: 'Paid',
      notes: notes || '',
      recordedBy: req.session && req.session.user ? req.session.user._id : null
    });

    // Update booking's paid amount & payment status
    booking.paidAmount = (booking.paidAmount || 0) + payAmount;
    if (booking.paidAmount >= booking.totalPrice) {
      booking.paymentStatus = 'Paid';
    } else {
      booking.paymentStatus = 'Partially Paid';
    }
    await booking.save();

    await logActivity(req, 'PAYMENT_RECORDED', 'Payments', `Recorded payment of $${payAmount} (${invNumber}) for booking ${booking.bookingNumber}`);
    req.flash('success_msg', `Payment of $${payAmount.toFixed(2)} recorded successfully.`);
    res.redirect(`/payments/${payment._id}/invoice`);
  } catch (err) {
    next(err);
  }
};

// View Invoice / Receipt
exports.getInvoice = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('guest')
      .populate({
        path: 'booking',
        populate: [
          { path: 'room', populate: { path: 'category' } },
          { path: 'guest' }
        ]
      })
      .populate('recordedBy', 'name');

    if (!payment) {
      req.flash('error_msg', 'Payment or invoice record not found.');
      return res.redirect('/payments');
    }

    res.render('payments/invoice', {
      title: `Invoice #${payment.invoiceNumber} | Grand Royale Hotel`,
      path: '/payments',
      payment,
      booking: payment.booking,
      guest: payment.guest
    });
  } catch (err) {
    next(err);
  }
};

// Update Payment Status (PATCH)
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const payment = await Payment.findById(req.params.id).populate('booking');
    if (!payment) {
      req.flash('error_msg', 'Payment record not found.');
      return res.redirect('/payments');
    }

    const prevStatus = payment.status;
    payment.status = status;
    await payment.save();

    // If refunded, reduce booking's paidAmount
    if (status === 'Refunded' && prevStatus === 'Paid' && payment.booking) {
      payment.booking.paidAmount = Math.max(0, (payment.booking.paidAmount || 0) - payment.amount);
      if (payment.booking.paidAmount === 0) {
        payment.booking.paymentStatus = 'Refunded';
      } else {
        payment.booking.paymentStatus = 'Partially Paid';
      }
      await payment.booking.save();
    }

    await logActivity(req, 'PAYMENT_STATUS_CHANGE', 'Payments', `Updated payment ${payment.invoiceNumber} to ${status}`);
    req.flash('success_msg', `Payment status updated to ${status}.`);
    res.redirect(`/payments`);
  } catch (err) {
    next(err);
  }
};
