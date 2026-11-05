const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { staffValidation, validateResult } = require('../middleware/validationMiddleware');

router.use(ensureAuthenticated);
router.use(authorizeRoles('Admin'));

router.get('/', staffController.getAllStaff);
router.get('/new', staffController.getNewStaff);
router.post('/', staffValidation, validateResult('/staff/new'), staffController.createStaff);

router.get('/:id', staffController.getStaffById);
router.get('/:id/edit', staffController.getEditStaff);
router.put('/:id', staffController.updateStaff);
router.patch('/:id/status', staffController.toggleStaffStatus);
router.delete('/:id', staffController.deleteStaff);

module.exports = router;
