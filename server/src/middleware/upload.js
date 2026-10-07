const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Avatars are stored on the server's own disk under server/uploads/avatars/
// and served back via express.static('/uploads'). No cloud storage, no new
// services — the folder is gitignored and re-created automatically here.
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'avatars');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Never trust the client's filename: build a safe, unique name from the
    // logged-in user's id + a timestamp + a whitelisted extension.
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const fileFilter = (req, file, cb) => {
  // Check BOTH the mimetype and the extension: the mimetype comes from the
  // client and can be spoofed, so the extension is a cheap second gate.
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIMES.includes(file.mimetype) && ALLOWED_EXTS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, png, webp, gif)'));
  }
};

// 2MB cap keeps avatars small; bigger files are rejected with a 400.
module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});
