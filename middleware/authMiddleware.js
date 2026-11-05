const ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash('error_msg', 'Please sign in to access this page.');
  req.session.returnTo = req.originalUrl;
  res.redirect('/auth/login');
};

const ensureGuest = (req, res, next) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  next();
};

module.exports = {
  ensureAuthenticated,
  ensureGuest
};
