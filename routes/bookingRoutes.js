const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(ensureAuthenticated);
router.use(authorizeRoles('Admin', 'Receptionist'));

// List & Create
router.get('/', bookingController.getAllBookings);
router.get('/new', bookingController.getNewBooking);
router.post('/', bookingController.createBooking);

// Receptionist quick operations
router.post('/:id/checkin', bookingController.checkInGuest);
router.post('/:id/checkout', bookingController.checkOutGuest);

// Detail & Edit
router.get('/:id', bookingController.getBookingById);
router.get('/:id/edit', bookingController.getEditBooking);
router.put('/:id', bookingController.updateBooking);

// Status Patch
router.patch('/:id/status', bookingController.updateBookingStatus);

// Cancellation / Delete
router.delete('/:id', bookingController.cancelBooking);

module.exports = router;
