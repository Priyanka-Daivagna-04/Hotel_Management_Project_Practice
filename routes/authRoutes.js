const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { ensureAuthenticated, ensureGuest } = require('../middleware/authMiddleware');
const { loginValidation, validateResult } = require('../middleware/validationMiddleware');
const { uploadAvatar } = require('../middleware/uploadMiddleware');

// Guest only routes
router.get('/login', ensureGuest, authController.getLogin);
router.post('/login', ensureGuest, loginValidation, validateResult('/auth/login'), authController.postLogin);

// Authenticated routes
router.get('/logout', ensureAuthenticated, authController.logout);
router.post('/logout', ensureAuthenticated, authController.logout);

// User Profile & Avatar Upload
router.get('/profile', ensureAuthenticated, authController.getProfile);
router.put('/profile', ensureAuthenticated, uploadAvatar.single('avatar'), authController.updateProfile);
router.put('/change-password', ensureAuthenticated, authController.changePassword);

module.exports = router;
