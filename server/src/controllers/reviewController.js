const Review = require('../models/Review');
const SwapRequest = require('../models/SwapRequest');
const User = require('../models/User');
const { asyncHandler, PUBLIC_USER_FIELDS } = require('../utils/helpers');

// POST /api/reviews — leave a rating + comment after a swap is completed.
const createReview = asyncHandler(async (req, res) => {
  const { swapRequest: swapId, rating, comment } = req.body;

  const swap = await SwapRequest.findById(swapId);
  if (!swap) return res.status(404).json({ message: 'Swap request not found' });

  // Rule 1: only a participant of the swap can review it.
  const isSender = String(swap.sender) === req.user.id;
  const isReceiver = String(swap.receiver) === req.user.id;
  if (!isSender && !isReceiver) {
    return res.status(403).json({ message: 'You can only review your own swaps' });
  }

  // Rule 2: the swap must be completed — no reviewing a swap that never happened.
  if (swap.status !== 'Completed') {
    return res.status(400).json({ message: 'You can only review a completed swap' });
  }

  // The person being reviewed is always the OTHER participant.
  const reviewedUserId = isSender ? swap.receiver : swap.sender;

  // Rule 3: one review per participant per swap (also enforced by a unique index).
  const existing = await Review.findOne({ reviewer: req.user.id, swapRequest: swapId });
  if (existing) {
    return res.status(400).json({ message: 'You have already reviewed this swap' });
  }

  const review = await Review.create({
    reviewer: req.user.id,
    reviewedUser: reviewedUserId,
    swapRequest: swapId,
    rating,
    comment: comment || '',
  });

  // Recompute the reviewed user's average rating from all their reviews so the
  // profile page can show it with a single cheap read.
  const reviews = await Review.find({ reviewedUser: reviewedUserId });
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await User.findByIdAndUpdate(reviewedUserId, {
    rating: Math.round(avg * 10) / 10, // one decimal place, e.g. 4.8
    ratingCount: reviews.length,
  });

  const populated = await review.populate('reviewer', PUBLIC_USER_FIELDS);
  res.status(201).json(populated);
});

// GET /api/reviews/user/:userId — all reviews written about a user.
const getUserReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewedUser: req.params.userId })
    .populate('reviewer', PUBLIC_USER_FIELDS)
    .sort({ createdAt: -1 });
  res.json(reviews);
});

module.exports = { createReview, getUserReviews };
