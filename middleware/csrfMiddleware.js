const crypto = require('crypto');

const csrfProtection = (req, res, next) => {
  // Exclude in automated test environment if desired
  if (process.env.NODE_ENV === 'test' && !req.headers['x-test-csrf-enforce']) {
    req.csrfToken = () => 'test-csrf-token';
    res.locals.csrfToken = 'test-csrf-token';
    return next();
  }

  // Ensure session has a token
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = crypto.randomBytes(32).toString('hex');
  }

  const token = req.session.csrfSecret;
  req.csrfToken = () => token;
  res.locals.csrfToken = token;

  // Safe HTTP methods don't require CSRF validation
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Look for token in body, query, or headers
  const submittedToken =
    (req.body && req.body._csrf) ||
    (req.query && req.query._csrf) ||
    req.headers['csrf-token'] ||
    req.headers['x-csrf-token'] ||
    req.headers['x-xsrf-token'];

  if (!submittedToken || submittedToken !== token) {
    const error = new Error('Invalid or missing CSRF token. Please refresh and try again.');
    error.code = 'EBADCSRFTOKEN';
    error.status = 403;
    return next(error);
  }

  next();
};

module.exports = csrfProtection;
