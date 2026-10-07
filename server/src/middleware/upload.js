const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ALLOWED_MIMES.includes(file.mimetype) && ALLOWED_EXTS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, png, webp, gif)'));
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});