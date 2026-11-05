const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(ensureAuthenticated);
router.use(authorizeRoles('Admin', 'Receptionist'));

router.get('/', reportController.getReports);
router.get('/export', reportController.exportCSV);

module.exports = router;
