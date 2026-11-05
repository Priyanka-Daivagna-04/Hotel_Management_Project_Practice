const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      req.flash('error_msg', 'Authentication required.');
      return res.redirect('/auth/login');
    }

    const userRole = req.session.user.role;
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    req.flash('error_msg', `Access denied: Role "${userRole}" is not authorized to access this resource.`);
    return res.status(403).redirect('/dashboard');
  };
};

module.exports = {
  authorizeRoles
};
