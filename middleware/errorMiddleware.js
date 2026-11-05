const notFoundHandler = (req, res, next) => {
  res.status(404);
  if (req.accepts('html')) {
    return res.render('layouts/error', {
      title: '404 - Page Not Found',
      errorCode: 404,
      errorMessage: 'The page or resource you requested could not be found.',
      user: req.session ? req.session.user : null
    });
  }
  if (req.accepts('json')) {
    return res.json({ error: 'Not found' });
  }
  res.type('txt').send('404 Not Found');
};

const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Application Error:', err);

  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'An unexpected internal server error occurred.';

  // Handle CSRF Token Errors
  if (err.code === 'EBADCSRFTOKEN') {
    statusCode = 403;
    message = 'Form session expired or invalid CSRF token. Please refresh the page and try again.';
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join('. ');
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'record';
    message = `A record with this ${field} already exists.`;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid resource identifier: ${err.value}`;
  }

  res.status(statusCode);

  if (req.accepts('html')) {
    return res.render('layouts/error', {
      title: `${statusCode} - Error`,
      errorCode: statusCode,
      errorMessage: message,
      errorStack: process.env.NODE_ENV === 'development' ? err.stack : null,
      user: req.session ? req.session.user : null
    });
  }

  res.json({
    success: false,
    status: statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};
