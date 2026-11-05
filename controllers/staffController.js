const Staff = require('../models/Staff');
const User = require('../models/User');
const { logActivity } = require('../services/activityService');
const bcrypt = require('bcryptjs');

// List all staff members
exports.getAllStaff = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { department, role, search } = req.query;
    const staffQuery = {};

    if (department && department !== 'all') {
      staffQuery.department = department;
    }

    const totalStaff = await Staff.countDocuments(staffQuery);
    const totalPages = Math.ceil(totalStaff / limit) || 1;

    let staffList = await Staff.find(staffQuery)
      .populate('user')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Apply memory/search filters if search term or role filter is applied
    if (search || (role && role !== 'all')) {
      staffList = staffList.filter((s) => {
        if (!s.user) return false;
        let match = true;
        if (role && role !== 'all') {
          match = match && s.user.role === role;
        }
        if (search) {
          const q = search.toLowerCase();
          const userMatch =
            s.user.name.toLowerCase().includes(q) ||
            s.user.email.toLowerCase().includes(q) ||
            s.employeeId.toLowerCase().includes(q) ||
            s.designation.toLowerCase().includes(q);
          match = match && userMatch;
        }
        return match;
      });
    }

    res.render('staff/index', {
      title: 'Staff Management | Grand Royale Hotel',
      path: '/staff',
      staffList,
      currentPage: page,
      totalPages,
      totalStaff,
      selectedDepartment: department || 'all',
      selectedRole: role || 'all',
      searchQuery: search || ''
    });
  } catch (err) {
    next(err);
  }
};

// Render Add Staff Form
exports.getNewStaff = (req, res) => {
  res.render('staff/create', {
    title: 'Add Staff Member | Grand Royale Hotel',
    path: '/staff',
    staff: {},
    userData: {}
  });
};

// Create Staff Member
exports.createStaff = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      employeeId,
      department,
      designation,
      shift,
      salary,
      emergencyName,
      emergencyRelation,
      emergencyPhone
    } = req.body;

    // Check existing email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      req.flash('error_msg', 'A user with this email address already exists.');
      return res.redirect('/staff/new');
    }

    // Check existing employee ID
    const existingEmp = await Staff.findOne({ employeeId: employeeId.trim().toUpperCase() });
    if (existingEmp) {
      req.flash('error_msg', 'Employee ID is already in use.');
      return res.redirect('/staff/new');
    }

    // Create User account
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password || 'Hotel@12345',
      role: role || 'Receptionist',
      phone: phone || ''
    });

    // Create Staff Profile
    const staff = await Staff.create({
      user: user._id,
      employeeId: employeeId.trim().toUpperCase(),
      department: department || 'Front Desk',
      designation: designation.trim(),
      shift: shift || 'Morning',
      salary: parseFloat(salary) || 0,
      emergencyContact: {
        name: emergencyName || '',
        relation: emergencyRelation || '',
        phone: emergencyPhone || ''
      }
    });

    await logActivity(req, 'STAFF_CREATED', 'Staff', `Added staff member ${user.name} (${staff.employeeId})`);
    req.flash('success_msg', `Staff member ${user.name} added successfully.`);
    res.redirect(`/staff/${staff._id}`);
  } catch (err) {
    next(err);
  }
};

// View Staff Details
exports.getStaffById = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id).populate('user');
    if (!staff) {
      req.flash('error_msg', 'Staff member not found.');
      return res.redirect('/staff');
    }

    res.render('staff/show', {
      title: `${staff.user.name} | Staff Profile`,
      path: '/staff',
      staff
    });
  } catch (err) {
    next(err);
  }
};

// Render Edit Staff Form
exports.getEditStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id).populate('user');
    if (!staff) {
      req.flash('error_msg', 'Staff member not found.');
      return res.redirect('/staff');
    }

    res.render('staff/edit', {
      title: `Edit Staff: ${staff.user.name} | Grand Royale Hotel`,
      path: '/staff',
      staff
    });
  } catch (err) {
    next(err);
  }
};

// Update Staff Member
exports.updateStaff = async (req, res, next) => {
  try {
    const {
      name,
      role,
      phone,
      department,
      designation,
      shift,
      salary,
      emergencyName,
      emergencyRelation,
      emergencyPhone
    } = req.body;

    const staff = await Staff.findById(req.params.id).populate('user');
    if (!staff) {
      req.flash('error_msg', 'Staff member not found.');
      return res.redirect('/staff');
    }

    // Update User details
    if (staff.user) {
      staff.user.name = name ? name.trim() : staff.user.name;
      staff.user.role = role || staff.user.role;
      staff.user.phone = phone || staff.user.phone;
      await staff.user.save();
    }

    // Update Staff details
    staff.department = department || staff.department;
    staff.designation = designation ? designation.trim() : staff.designation;
    staff.shift = shift || staff.shift;
    staff.salary = salary ? parseFloat(salary) : staff.salary;
    staff.emergencyContact = {
      name: emergencyName || '',
      relation: emergencyRelation || '',
      phone: emergencyPhone || ''
    };

    await staff.save();
    await logActivity(req, 'STAFF_UPDATED', 'Staff', `Updated staff member ${staff.user.name}`);

    req.flash('success_msg', 'Staff member updated successfully.');
    res.redirect(`/staff/${staff._id}`);
  } catch (err) {
    next(err);
  }
};

// Activate / Deactivate Staff Member (PATCH)
exports.toggleStaffStatus = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id).populate('user');
    if (!staff) {
      req.flash('error_msg', 'Staff member not found.');
      return res.redirect('/staff');
    }

    staff.isActive = !staff.isActive;
    if (staff.user) {
      staff.user.isActive = staff.isActive;
      await staff.user.save();
    }
    await staff.save();

    const statusText = staff.isActive ? 'activated' : 'deactivated';
    await logActivity(req, 'STAFF_STATUS_CHANGE', 'Staff', `${statusText.toUpperCase()} staff member ${staff.user.name}`);

    req.flash('success_msg', `Staff member ${staff.user.name} has been ${statusText}.`);
    res.redirect(`/staff/${staff._id}`);
  } catch (err) {
    next(err);
  }
};

// Delete Staff Member
exports.deleteStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id).populate('user');
    if (!staff) {
      req.flash('error_msg', 'Staff member not found.');
      return res.redirect('/staff');
    }

    // Prevent deleting self
    if (staff.user && staff.user._id.toString() === req.session.user._id) {
      req.flash('error_msg', 'You cannot delete your own account.');
      return res.redirect(`/staff/${staff._id}`);
    }

    if (staff.user) {
      await User.findByIdAndDelete(staff.user._id);
    }
    await Staff.findByIdAndDelete(staff._id);

    await logActivity(req, 'STAFF_DELETED', 'Staff', `Deleted staff member and linked user account`);
    req.flash('success_msg', 'Staff member deleted successfully.');
    res.redirect('/staff');
  } catch (err) {
    next(err);
  }
};
