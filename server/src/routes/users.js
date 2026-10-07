const express = require('express');
const { body, param } = require('express-validator');
const { getUsers, getUserById, updateUser, changePassword, deleteAccount } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { validate } = require('../utils/helpers');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect); // every user route requires a valid JWT

// GET /api/users
router.get('/', getUsers);

// GET /api/users/:id
router.get('/:id', [param('id').isMongoId().withMessage('Invalid user id')], validate, getUserById);

// Run multer for the single 'avatar' file field. Multer errors (too large,
// wrong file type) become a clean 400 instead of an HTML error page.
const handleAvatarUpload = (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Avatar image must be smaller than 2MB' });
      }
      return res.status(400).json({ message: err.message || 'Avatar upload failed' });
    }
    next();
  });
};

// With multipart/form-data, multer delivers every text field as a string —
// the two skill lists arrive JSON-encoded. Parse them back into arrays so the
// same controller and validators work for both JSON and multipart requests.
// If parsing fails we leave the value alone and the isArray check rejects it.
const parseSkillFields = (req, res, next) => {
  for (const field of ['skillsToTeach', 'skillsToLearn']) {
    if (typeof req.body[field] === 'string') {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch (_) {
        /* validated below */
      }
    }
  }
  next();
};

// PUT /api/users/:id
// Middleware order matters: multer + skill parsing run BEFORE the validators,
// because with multipart/form-data req.body is empty until multer has parsed it.
router.put(
  '/:id',
  handleAvatarUpload,
  parseSkillFields,
  [
    param('id').isMongoId().withMessage('Invalid user id'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
    body('location').optional().isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
    body('experienceLevel')
      .optional()
      .isIn(['Beginner', 'Intermediate', 'Advanced'])
      .withMessage('Invalid experience level'),
    body('availability')
      .optional()
      .isIn(['Weekdays', 'Weekends', 'Evenings', 'Flexible'])
      .withMessage('Invalid availability'),
    body('skillsToTeach').optional().isArray().withMessage('skillsToTeach must be an array'),
    body('skillsToLearn').optional().isArray().withMessage('skillsToLearn must be an array'),
  ],
  validate,
  updateUser
);

// PUT /api/users/:id/password — change your own password
router.put(
  '/:id/password',
  [
    param('id').isMongoId().withMessage('Invalid user id'),
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  validate,
  changePassword
);

// DELETE /api/users/:id — delete your own account (cascades to swaps/reviews)
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid user id')],
  validate,
  deleteAccount
);

module.exports = router;
