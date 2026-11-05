const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Guest = require('../models/Guest');
const Payment = require('../models/Payment');
const Housekeeping = require('../models/Housekeeping');
const RoomCategory = require('../models/RoomCategory');
const ActivityLog = require('../models/ActivityLog');

exports.getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Room Status Counts
    const totalRooms = await Room.countDocuments({ isDeleted: false });
    const availableRooms = await Room.countDocuments({ status: 'Available', isDeleted: false });
    const occupiedRooms = await Room.countDocuments({ status: 'Occupied', isDeleted: false });
    const reservedRooms = await Room.countDocuments({ status: 'Reserved', isDeleted: false });
    const maintenanceRooms = await Room.countDocuments({ status: 'Maintenance', isDeleted: false });

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // 2. Today's Check-ins & Check-outs
    const todayCheckIns = await Booking.countDocuments({
      checkInDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['Confirmed', 'Checked In'] },
      isDeleted: false
    });

    const todayCheckOuts = await Booking.countDocuments({
      checkOutDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['Confirmed', 'Checked In'] },
      isDeleted: false
    });

    // 3. Total Guests
    const totalGuests = await Guest.countDocuments({ isDeleted: false });

    // 4. Total Revenue
    const revenueAgg = await Payment.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // 5. Recent Bookings
    const recentBookings = await Booking.find({ isDeleted: false })
      .populate('guest', 'firstName lastName email phone')
      .populate('room', 'roomNumber pricePerNight')
      .sort({ createdAt: -1 })
      .limit(6);

    // 6. Recent Activity Logs
    const recentActivities = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(6);

    // 7. Housekeeping Summary
    const pendingHousekeeping = await Housekeeping.countDocuments({ status: 'Pending' });
    const inProgressHousekeeping = await Housekeeping.countDocuments({ status: 'In Progress' });

    // 8. Monthly Revenue for Current Year (for Chart.js)
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const monthlyRevenueRaw = await Payment.aggregate([
      {
        $match: {
          status: 'Paid',
          createdAt: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Build array of 12 months with 0 default
    const monthlyRevenue = Array(12).fill(0);
    monthlyRevenueRaw.forEach(item => {
      if (item._id >= 1 && item._id <= 12) {
        monthlyRevenue[item._id - 1] = item.revenue;
      }
    });

    // 9. Room Category Distribution (for Chart.js)
    const categoryDistributionRaw = await Room.aggregate([
      { $match: { isDeleted: false } },
      {
        $lookup: {
          from: 'roomcategories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$categoryInfo.name',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryLabels = categoryDistributionRaw.map(c => c._id);
    const categoryCounts = categoryDistributionRaw.map(c => c.count);

    // 10. Booking Status Distribution (for Chart.js)
    const bookingStatusRaw = await Booking.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const bookingStatusMap = { Confirmed: 0, 'Checked In': 0, 'Checked Out': 0, Cancelled: 0 };
    bookingStatusRaw.forEach(item => {
      bookingStatusMap[item._id] = item.count;
    });

    res.render('dashboard/index', {
      title: 'Executive Dashboard | Grand Royale Hotel',
      path: '/dashboard',
      stats: {
        totalRooms,
        availableRooms,
        occupiedRooms,
        reservedRooms,
        maintenanceRooms,
        occupancyRate,
        todayCheckIns,
        todayCheckOuts,
        totalGuests,
        totalRevenue,
        pendingHousekeeping,
        inProgressHousekeeping
      },
      recentBookings,
      recentActivities,
      chartData: {
        monthlyRevenue,
        categoryLabels,
        categoryCounts,
        bookingStatusMap
      }
    });
  } catch (err) {
    next(err);
  }
};
