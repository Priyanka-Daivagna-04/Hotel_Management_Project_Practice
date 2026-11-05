const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { guestValidation, validateResult } = require('../middleware/validationMiddleware');

router.use(ensureAuthenticated);
router.use(authorizeRoles('Admin', 'Receptionist'));

router.get('/', guestController.getAllGuests);
router.get('/new', guestController.getNewGuest);
router.post('/', guestValidation, validateResult('/guests/new'), guestController.createGuest);

router.get('/:id', guestController.getGuestById);
router.get('/:id/edit', guestController.getEditGuest);
router.put('/:id', guestValidation, validateResult((req) => `/guests/${req.params.id}/edit`), guestController.updateGuest);
router.delete('/:id', authorizeRoles('Admin'), guestController.deleteGuest);

module.exports = router;
