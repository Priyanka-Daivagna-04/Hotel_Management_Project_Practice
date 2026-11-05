const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const roomUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'rooms');
const avatarUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'avatars');

if (!fs.existsSync(roomUploadDir)) fs.mkdirSync(roomUploadDir, { recursive: true });
if (!fs.existsSync(avatarUploadDir)) fs.mkdirSync(avatarUploadDir, { recursive: true });

// Common file filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|gif/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = allowedExtensions.test(file.mimetype);
  const extCheck = allowedExtensions.test(ext);

  if (mime && extCheck) {
    return cb(null, true);
  }
  cb(new Error('Only image files (JPEG, PNG, WEBP, GIF) are allowed.'));
};

// Storage for Rooms
const roomStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, roomUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'room-' + uniqueSuffix + ext);
  }
});

// Storage for Avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const uploadRoom = multer({
  storage: roomStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
  fileFilter
});

module.exports = uploadRoom;
module.exports.uploadRoom = uploadRoom;
module.exports.uploadAvatar = uploadAvatar;
