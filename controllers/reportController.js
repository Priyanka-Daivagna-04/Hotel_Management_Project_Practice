const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Room = require('../models/Room');
const Guest = require('../models/Guest');
const Housekeeping = require('../models/Housekeeping');

// Helper to escape CSV fields
const escapeCSV = (value) => {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
};

// Render Reports Dashboard
exports.getReports = async (req, res, next) => {
  try {
    const reportType = req.query.type || 'revenue';
    const now = new Date();
    
    // Default: current month
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    const startDate = req.query.startDate || defaultStart;
    const endDate = req.query.endDate || defaultEnd;

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let reportData = {
      summary: {},
      rows: []
    };

    if (reportType === 'revenue') {
      // Payment aggregation by date
      const payments = await Payment.find({
        status: 'Paid',
        createdAt: { $gte: start, $lte: end }
      })
        .populate('guest', 'firstName lastName')
        .populate('booking', 'bookingNumber')
        .sort({ createdAt: -1 });

      const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
      const totalTransactions = payments.length;

      // Group by payment method
      const byMethod = {};
      payments.forEach((p) => {
        byMethod[p.paymentMethod] = (byMethod[p.paymentMethod] || 0) + p.amount;
      });

      reportData = {
        summary: {
          totalRevenue,
          totalTransactions,
          byMethod
        },
        rows: payments
      };
    } else if (reportType === 'occupancy') {
      const totalRooms = await Room.countDocuments({ isDeleted: false });
      const availableRooms = await Room.countDocuments({ status: 'Available', isDeleted: false });
      const occupiedRooms = await Room.countDocuments({ status: 'Occupied', isDeleted: false });
      const reservedRooms = await Room.countDocuments({ status: 'Reserved', isDeleted: false });
      const maintenanceRooms = await Room.countDocuments({ status: 'Maintenance', isDeleted: false });

      const rooms = await Room.find({ isDeleted: false }).populate('category');

      reportData = {
        summary: {
          totalRooms,
          availableRooms,
          occupiedRooms,
          reservedRooms,
          maintenanceRooms,
          occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
        },
        rows: rooms
      };
    } else if (reportType === 'bookings') {
      const bookings = await Booking.find({
        checkInDate: { $gte: start, $lte: end },
        isDeleted: false
      })
        .populate('guest', 'firstName lastName email phone')
        .populate('room', 'roomNumber pricePerNight')
        .sort({ checkInDate: -1 });

      const totalBookings = bookings.length;
      const totalValue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const totalNights = bookings.reduce((sum, b) => sum + (b.nights || 0), 0);

      reportData = {
        summary: {
          totalBookings,
          totalValue,
          totalNights,
          avgLengthOfStay: totalBookings > 0 ? (totalNights / totalBookings).toFixed(1) : 0
        },
        rows: bookings
      };
    } else if (reportType === 'checkin_checkout') {
      const checkIns = await Booking.find({
        checkInDate: { $gte: start, $lte: end },
        isDeleted: false
      }).populate('guest').populate('room');

      const checkOuts = await Booking.find({
        checkOutDate: { $gte: start, $lte: end },
        isDeleted: false
      }).populate('guest').populate('room');

      reportData = {
        summary: {
          checkInsCount: checkIns.length,
          checkOutsCount: checkOuts.length
        },
        checkIns,
        checkOuts
      };
    } else if (reportType === 'guests') {
      const guests = await Guest.find({
        createdAt: { $gte: start, $lte: end },
        isDeleted: false
      }).sort({ createdAt: -1 });

      reportData = {
        summary: {
          totalNewGuests: guests.length
        },
        rows: guests
      };
    }

    res.render('reports/index', {
      title: 'Analytics & Management Reports | Grand Royale Hotel',
      path: '/reports',
      reportType,
      startDate,
      endDate,
      reportData
    });
  } catch (err) {
    next(err);
  }
};

// Export CSV
exports.exportCSV = async (req, res, next) => {
  try {
    const { type, startDate, endDate } = req.query;
    const start = new Date(startDate || '2000-01-01');
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate || new Date());
    end.setHours(23, 59, 59, 999);

    let filename = `hotel-${type}-report.csv`;
    let headers = [];
    let rows = [];

    if (type === 'revenue' || type === 'payments') {
      filename = `revenue-report-${startDate}-to-${endDate}.csv`;
      headers = ['Invoice Number', 'Date', 'Guest Name', 'Booking Ref', 'Payment Method', 'Amount (INR)', 'Status', 'Transaction ID'];

      const payments = await Payment.find({
        status: 'Paid',
        createdAt: { $gte: start, $lte: end }
      })
        .populate('guest', 'firstName lastName')
        .populate('booking', 'bookingNumber');

      rows = payments.map((p) => [
        p.invoiceNumber,
        new Date(p.createdAt).toLocaleDateString('en-IN'),
        p.guest ? `${p.guest.firstName} ${p.guest.lastName}` : 'N/A',
        p.booking ? p.booking.bookingNumber : 'N/A',
        p.paymentMethod,
        p.amount.toFixed(2),
        p.status,
        p.transactionId
      ]);
    } else if (type === 'bookings') {
      filename = `bookings-report-${startDate}-to-${endDate}.csv`;
      headers = ['Booking Number', 'Guest Name', 'Room', 'Check-In', 'Check-Out', 'Nights', 'Total (INR)', 'Paid (INR)', 'Status', 'Payment Status'];

      const bookings = await Booking.find({
        checkInDate: { $gte: start, $lte: end },
        isDeleted: false
      })
        .populate('guest', 'firstName lastName')
        .populate('room', 'roomNumber');

      rows = bookings.map((b) => [
        b.bookingNumber,
        b.guest ? `${b.guest.firstName} ${b.guest.lastName}` : 'N/A',
        b.room ? b.room.roomNumber : 'N/A',
        new Date(b.checkInDate).toISOString().slice(0, 10),
        new Date(b.checkOutDate).toISOString().slice(0, 10),
        b.nights,
        b.totalPrice.toFixed(2),
        b.paidAmount.toFixed(2),
        b.status,
        b.paymentStatus
      ]);
    } else if (type === 'occupancy') {
      filename = `room-occupancy-report.csv`;
      headers = ['Room Number', 'Category', 'Floor', 'Capacity', 'Rate/Night (INR)', 'Status'];

      const rooms = await Room.find({ isDeleted: false }).populate('category');

      rows = rooms.map((r) => [
        r.roomNumber,
        r.category ? r.category.name : 'Standard',
        r.floor,
        r.capacity,
        r.pricePerNight.toFixed(2),
        r.status
      ]);
    } else if (type === 'guests') {
      filename = `guests-report.csv`;
      headers = ['Full Name', 'Email', 'Phone', 'ID Type', 'ID Number', 'Nationality', 'Registered On'];

      const guests = await Guest.find({ isDeleted: false }).sort({ createdAt: -1 });

      rows = guests.map((g) => [
        `${g.firstName} ${g.lastName}`,
        g.email,
        g.phone,
        g.idType,
        g.idNumber,
        g.nationality,
        new Date(g.createdAt).toLocaleDateString()
      ]);
    }

    // Construct CSV String
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(','))
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};
