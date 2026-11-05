const express = require('express');
const router = express.Router();
const housekeepingController = require('../controllers/housekeepingController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(ensureAuthenticated);

router.get('/', housekeepingController.getAllTasks);
router.get('/new', authorizeRoles('Admin', 'Receptionist'), housekeepingController.getNewTask);
router.post('/', authorizeRoles('Admin', 'Receptionist'), housekeepingController.createTask);

// Status Patch
router.patch('/:id/status', housekeepingController.updateTaskStatus);

// Delete task
router.delete('/:id', authorizeRoles('Admin'), housekeepingController.deleteTask);

module.exports = router;
