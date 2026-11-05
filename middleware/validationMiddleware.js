const { body, validationResult } = require('express-validator');

// Generic validator runner that redirects with flash messages
const validateResult = (redirectPath) => {
  return (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors.array().map((err) => err.msg);
      req.flash('error_msg', messages.join('. '));
      const target = typeof redirectPath === 'function' ? redirectPath(req) : redirectPath || 'back';
      return res.redirect(target);
    }
    next();
  };
};

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const roomValidation = [
  body('roomNumber').trim().notEmpty().withMessage('Room number is required'),
  body('category').notEmpty().withMessage('Room category is required'),
  body('floor').isInt({ min: 1 }).withMessage('Floor must be a positive integer'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1 guest'),
  body('pricePerNight').isFloat({ min: 0 }).withMessage('Price per night must be a valid positive number'),
  body('status').optional().isIn(['Available', 'Occupied', 'Reserved', 'Maintenance']).withMessage('Invalid status')
];

const guestValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Phone number is required')
];

const bookingValidation = [
  body('guestId').notEmpty().withMessage('Guest selection is required'),
  body('roomId').notEmpty().withMessage('Room selection is required'),
  body('checkInDate').isISO8601().withMessage('Valid check-in date is required'),
  body('checkOutDate').isISO8601().withMessage('Valid check-out date is required'),
  body('adults').isInt({ min: 1 }).withMessage('At least 1 adult is required')
];

const paymentValidation = [
  body('bookingId').notEmpty().withMessage('Booking reference is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than zero'),
  body('paymentMethod').isIn(['UPI / Google Pay / PhonePe', 'Net Banking', 'Credit Card', 'Debit Card', 'Cash', 'NEFT / RTGS']).withMessage('Invalid payment method')
];

const staffValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('role').isIn(['Admin', 'Receptionist', 'Housekeeping Staff']).withMessage('Valid role is required'),
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('designation').trim().notEmpty().withMessage('Designation is required')
];

const housekeepingValidation = [
  body('room').notEmpty().withMessage('Room is required'),
  body('taskType').isIn(['Daily Cleaning', 'Deep Clean', 'Checkout Clean', 'Maintenance Repair', 'Inspection']).withMessage('Invalid task type'),
  body('priority').isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Invalid priority')
];

module.exports = {
  validateResult,
  loginValidation,
  roomValidation,
  guestValidation,
  bookingValidation,
  paymentValidation,
  staffValidation,
  housekeepingValidation
};
