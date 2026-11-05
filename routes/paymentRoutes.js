const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { paymentValidation, validateResult } = require('../middleware/validationMiddleware');

router.use(ensureAuthenticated);
router.use(authorizeRoles('Admin', 'Receptionist'));

router.get('/', paymentController.getAllPayments);
router.get('/new', paymentController.getNewPayment);
router.post('/', paymentValidation, validateResult('/payments/new'), paymentController.createPayment);

router.get('/:id/invoice', paymentController.getInvoice);
router.patch('/:id/status', authorizeRoles('Admin'), paymentController.updatePaymentStatus);

module.exports = router;
