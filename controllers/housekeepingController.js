const Housekeeping = require('../models/Housekeeping');
const Room = require('../models/Room');
const User = require('../models/User');
const { logActivity } = require('../services/activityService');

// List all housekeeping tasks
exports.getAllTasks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, priority, taskType } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (taskType && taskType !== 'all') {
      query.taskType = taskType;
    }

    // If current logged-in user is Housekeeping Staff, optionally show their tasks or all
    if (req.session.user.role === 'Housekeeping Staff' && req.query.view === 'mine') {
      query.assignedTo = req.session.user._id;
    }

    const totalTasks = await Housekeeping.countDocuments(query);
    const totalPages = Math.ceil(totalTasks / limit) || 1;

    const tasks = await Housekeeping.find(query)
      .populate('room')
      .populate('assignedTo', 'name email')
      .populate('verifiedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Summary counts
    const pendingCount = await Housekeeping.countDocuments({ status: 'Pending' });
    const inProgressCount = await Housekeeping.countDocuments({ status: 'In Progress' });
    const completedCount = await Housekeeping.countDocuments({ status: 'Completed' });

    // Rooms currently needing cleaning / in maintenance
    const dirtyRooms = await Room.find({
      status: { $in: ['Maintenance', 'Occupied'] },
      isDeleted: false
    });

    const staffMembers = await User.find({
      role: { $in: ['Housekeeping Staff', 'Receptionist', 'Admin'] },
      isActive: true
    });

    res.render('housekeeping/index', {
      title: 'Housekeeping & Maintenance | Grand Royale Hotel',
      path: '/housekeeping',
      tasks,
      currentPage: page,
      totalPages,
      totalTasks,
      pendingCount,
      inProgressCount,
      completedCount,
      dirtyRooms,
      staffMembers,
      selectedStatus: status || 'all',
      selectedPriority: priority || 'all',
      selectedType: taskType || 'all',
      viewMode: req.query.view || 'all'
    });
  } catch (err) {
    next(err);
  }
};

// Render Create Task Form
exports.getNewTask = async (req, res, next) => {
  try {
    const rooms = await Room.find({ isDeleted: false }).sort({ roomNumber: 1 });
    const staffMembers = await User.find({
      role: { $in: ['Housekeeping Staff', 'Admin'] },
      isActive: true
    });

    res.render('housekeeping/create', {
      title: 'Schedule Housekeeping Task | Grand Royale Hotel',
      path: '/housekeeping',
      rooms,
      staffMembers,
      selectedRoomId: req.query.roomId || null
    });
  } catch (err) {
    next(err);
  }
};

// Create Housekeeping Task
exports.createTask = async (req, res, next) => {
  try {
    const { room, assignedTo, taskType, priority, remarks, scheduledDate } = req.body;

    const task = await Housekeeping.create({
      room,
      assignedTo: assignedTo || null,
      taskType: taskType || 'Daily Cleaning',
      priority: priority || 'Medium',
      remarks: remarks || '',
      scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
      status: 'Pending'
    });

    const populatedRoom = await Room.findById(room);
    await logActivity(req, 'HOUSEKEEPING_CREATED', 'Housekeeping', `Task (${task.taskType}) created for Room #${populatedRoom ? populatedRoom.roomNumber : room}`);

    req.flash('success_msg', 'Housekeeping task scheduled successfully.');
    res.redirect('/housekeeping');
  } catch (err) {
    next(err);
  }
};

// Update Task Status (PATCH)
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const task = await Housekeeping.findById(req.params.id).populate('room');
    if (!task) {
      req.flash('error_msg', 'Task not found.');
      return res.redirect('/housekeeping');
    }

    task.status = status;
    if (remarks) {
      task.remarks = remarks;
    }

    if (status === 'Completed') {
      task.completedAt = new Date();
      task.verifiedBy = req.session && req.session.user ? req.session.user._id : null;

      // If the room was under maintenance due to cleaning, set it to Available!
      if (task.room && task.room.status === 'Maintenance') {
        task.room.status = 'Available';
        await task.room.save();
      }
    }

    await task.save();
    await logActivity(req, 'HOUSEKEEPING_STATUS', 'Housekeeping', `Task #${task._id.toString().slice(-4)} set to ${status}`);

    req.flash('success_msg', `Task status updated to ${status}.`);
    res.redirect('/housekeeping');
  } catch (err) {
    next(err);
  }
};

// Delete Housekeeping Task
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Housekeeping.findByIdAndDelete(req.params.id);
    if (!task) {
      req.flash('error_msg', 'Task not found.');
      return res.redirect('/housekeeping');
    }

    await logActivity(req, 'HOUSEKEEPING_DELETED', 'Housekeeping', `Deleted housekeeping task`);
    req.flash('success_msg', 'Task removed successfully.');
    res.redirect('/housekeeping');
  } catch (err) {
    next(err);
  }
};
