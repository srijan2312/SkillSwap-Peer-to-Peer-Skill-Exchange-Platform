const mongoose = require('mongoose');

// A swap request is the heart of SkillSwap: "I will teach you X if you teach me Y".
// Lifecycle: Pending -> Accepted/Rejected -> Completed (or Cancelled at any point).
// Completion is two-sided: sender and receiver each mark their own side done
// (senderCompleted / receiverCompleted); status flips to 'Completed' only when
// both are true. The 'Accepted' rows ARE the active swaps — no extra collection.
const swapRequestSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    offeredSkill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true }, // what the sender teaches
    requestedSkill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true }, // what the sender wants to learn
    message: { type: String, default: '', maxlength: [500, 'Message cannot exceed 500 characters'] },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    // Two-sided completion: each participant marks THEIR OWN side as done.
    // The swap only becomes 'Completed' when BOTH sides are true. There is no
    // separate "Swaps" collection on purpose — an Accepted SwapRequest IS the
    // active swap record, and these flags track per-user completion simply.
    senderCompleted: { type: Boolean, default: false },
    receiverCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Database-level guard against duplicate pending requests for the same
// sender -> receiver + skill pair. The partial filter keeps the uniqueness
// scoped to Pending rows only, so users can send a new request after an old
// one was rejected or completed. The controller also checks this first so the
// API can return a friendly 400 message instead of a raw MongoDB error.
swapRequestSchema.index(
  { sender: 1, receiver: 1, offeredSkill: 1, requestedSkill: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'Pending' } }
);

module.exports = mongoose.model('SwapRequest', swapRequestSchema);
