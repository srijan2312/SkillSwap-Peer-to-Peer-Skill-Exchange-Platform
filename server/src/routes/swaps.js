const express = require('express');
const { body, param } = require('express-validator');
const { getSwaps, createSwap, updateSwap, deleteSwap } = require('../controllers/swapController');
const { protect } = require('../middleware/auth');
const { validate } = require('../utils/helpers');

const router = express.Router();

router.use(protect);

// GET /api/swaps
router.get('/', getSwaps);

// POST /api/swaps
router.post(
  '/',
  [
    body('receiver').isMongoId().withMessage('Invalid receiver id'),
    body('offeredSkill').isMongoId().withMessage('Invalid offered skill'),
    body('requestedSkill').isMongoId().withMessage('Invalid requested skill'),
    body('message').optional().isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters'),
  ],
  validate,
  createSwap
);

// PUT /api/swaps/:id
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid swap id'),
    body('status')
      .isIn(['Accepted', 'Rejected', 'Completed', 'Cancelled'])
      .withMessage('Invalid status'),
  ],
  validate,
  updateSwap
);

// DELETE /api/swaps/:id
router.delete('/:id', [param('id').isMongoId().withMessage('Invalid swap id')], validate, deleteSwap);

module.exports = router;
