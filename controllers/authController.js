const User = require('../models/User');
const { logActivity } = require('../services/activityService');
const bcrypt = require('bcryptjs');

// Render Login Page
exports.getLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Sign In | Grand Royale Hotel',
    layout: false
  });
};

// Process Login
exports.postLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      req.flash('error_msg', 'Invalid email address or password.');
      return res.redirect('/auth/login');
    }

    if (!user.isActive) {
      req.flash('error_msg', 'Your account has been deactivated. Please contact the administrator.');
      return res.redirect('/auth/login');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error_msg', 'Invalid email address or password.');
      return res.redirect('/auth/login');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Store in session
    req.session.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar
    };

    await logActivity(req, 'USER_LOGIN', 'Auth', `User ${user.email} signed in successfully.`);

    req.flash('success_msg', `Welcome back, ${user.name}!`);
    const redirectUrl = req.session.returnTo || '/dashboard';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  } catch (err) {
    next(err);
  }
};

// Process Logout
exports.logout = async (req, res, next) => {
  try {
    if (req.session.user) {
      await logActivity(req, 'USER_LOGOUT', 'Auth', `User signed out.`);
    }
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie('connect.sid');
      res.redirect('/auth/login');
    });
  } catch (err) {
    next(err);
  }
};

// Get User Profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) {
      req.flash('error_msg', 'User not found.');
      return res.redirect('/dashboard');
    }

    res.render('profile/index', {
      title: 'My Profile | Grand Royale Hotel',
      currentUser: user,
      path: '/profile'
    });
  } catch (err) {
    next(err);
  }
};

// Update Profile & Avatar Photo
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatarUrl } = req.body;
    const user = await User.findById(req.session.user._id);
    if (!user) {
      req.flash('error_msg', 'User not found.');
      return res.redirect('/auth/login');
    }

    user.name = name ? name.trim() : user.name;
    user.phone = phone ? phone.trim() : user.phone;

    // Handle Profile Photo Upload
    if (req.file) {
      user.avatar = `/uploads/avatars/${req.file.filename}`;
    } else if (avatarUrl && avatarUrl.trim()) {
      user.avatar = avatarUrl.trim();
    }

    await user.save();

    // Update Session user details so header and sidebar reflect immediately
    req.session.user.name = user.name;
    req.session.user.phone = user.phone;
    req.session.user.avatar = user.avatar;

    await logActivity(req, 'PROFILE_UPDATED', 'Auth', `User profile updated photo and info.`);
    req.flash('success_msg', 'Profile and avatar photo updated successfully!');
    res.redirect('/auth/profile');
  } catch (err) {
    next(err);
  }
};

// Change Password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      req.flash('error_msg', 'New passwords do not match.');
      return res.redirect('/auth/profile');
    }

    if (newPassword.length < 6) {
      req.flash('error_msg', 'New password must be at least 6 characters.');
      return res.redirect('/auth/profile');
    }

    const user = await User.findById(req.session.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      req.flash('error_msg', 'Current password is incorrect.');
      return res.redirect('/auth/profile');
    }

    user.password = newPassword;
    await user.save();

    await logActivity(req, 'PASSWORD_CHANGED', 'Auth', `User changed password.`);
    req.flash('success_msg', 'Password changed successfully.');
    res.redirect('/auth/profile');
  } catch (err) {
    next(err);
  }
};
