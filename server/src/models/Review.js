const mongoose = require('mongoose');

// A review can only be written for a Completed swap, by one of its two
// participants, and only once per participant per swap. The controller
// enforces all three rules; the compound index below is the backstop.
const reviewSchema = new mongoose.Schema(
  {
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    swapRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapRequest', required: true },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: { type: String, default: '', maxlength: [500, 'Comment cannot exceed 500 characters'] },
  },
  { timestamps: true }
);

// One review per reviewer per swap — enforced at the database level.
reviewSchema.index({ reviewer: 1, swapRequest: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
