const express = require('express');
const { body, param } = require('express-validator');
const { createReview, getUserReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { validate } = require('../utils/helpers');

const router = express.Router();

router.use(protect);

// POST /api/reviews
router.post(
  '/',
  [
    body('swapRequest').isMongoId().withMessage('Invalid swap request id'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be a whole number between 1 and 5'),
    body('comment').optional().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
  ],
  validate,
  createReview
);

// GET /api/reviews/user/:userId
router.get(
  '/user/:userId',
  [param('userId').isMongoId().withMessage('Invalid user id')],
  validate,
  getUserReviews
);

module.exports = router;
