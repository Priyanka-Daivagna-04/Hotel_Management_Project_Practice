const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { roomValidation, validateResult } = require('../middleware/validationMiddleware');

router.use(ensureAuthenticated);

// List & Categories
router.get('/', roomController.getAllRooms);
router.get('/categories', authorizeRoles('Admin'), roomController.getCategories);
router.post('/categories', authorizeRoles('Admin'), roomController.createCategory);

// Add Room
router.get('/new', authorizeRoles('Admin'), roomController.getNewRoom);
router.post(
  '/',
  authorizeRoles('Admin'),
  upload.single('image'),
  roomValidation,
  validateResult('/rooms/new'),
  roomController.createRoom
);

// Individual Room
router.get('/:id', roomController.getRoomById);
router.get('/:id/edit', authorizeRoles('Admin'), roomController.getEditRoom);
router.put(
  '/:id',
  authorizeRoles('Admin'),
  upload.single('image'),
  roomValidation,
  validateResult((req) => `/rooms/${req.params.id}/edit`),
  roomController.updateRoom
);

// Status Patch (Allowed for Admin, Receptionist, Housekeeping Staff)
router.patch('/:id/status', authorizeRoles('Admin', 'Receptionist', 'Housekeeping Staff'), roomController.updateRoomStatus);

// Delete Room (Admin only)
router.delete('/:id', authorizeRoles('Admin'), roomController.deleteRoom);

module.exports = router;
