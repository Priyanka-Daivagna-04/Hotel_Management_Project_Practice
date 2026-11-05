const ActivityLog = require('../models/ActivityLog');

const logActivity = async (req, action, module, details) => {
  try {
    const userId = req.session && req.session.user ? req.session.user._id : null;
    const userName = req.session && req.session.user ? req.session.user.name : 'System';
    const ipAddress = req.ip || req.connection.remoteAddress || '';

    await ActivityLog.create({
      user: userId,
      userName,
      action,
      module,
      details,
      ipAddress
    });
  } catch (err) {
    console.error('Failed to write activity log:', err.message);
  }
};

module.exports = { logActivity };
