const SwapRequest = require('../models/SwapRequest');
const Skill = require('../models/Skill');
const User = require('../models/User');
const { asyncHandler, PUBLIC_USER_FIELDS } = require('../utils/helpers');

const SKILL_FIELDS = 'name category';

// Populate a swap so the frontend gets names/avatars without extra requests.
const populateSwap = (query) =>
  query
    .populate('sender', PUBLIC_USER_FIELDS)
    .populate('receiver', PUBLIC_USER_FIELDS)
    .populate('offeredSkill', SKILL_FIELDS)
    .populate('requestedSkill', SKILL_FIELDS);

// GET /api/swaps?status= — every swap where I am the sender OR the receiver.
const getSwaps = asyncHandler(async (req, res) => {
  const filter = { $or: [{ sender: req.user.id }, { receiver: req.user.id }] };
  if (req.query.status) filter.status = req.query.status;
  const swaps = await populateSwap(SwapRequest.find(filter).sort({ updatedAt: -1 }));
  res.json(swaps);
});

// POST /api/swaps — send a new skill swap request.
const createSwap = asyncHandler(async (req, res) => {
  const { receiver, offeredSkill, requestedSkill, message } = req.body;

  // You can't swap skills with yourself.
  if (receiver === req.user.id) {
    return res.status(400).json({ message: 'You cannot send a swap request to yourself' });
  }

  // All three references must exist. We also load the sender so we can check
  // that both skills are ones the two users actually listed on their profiles.
  const [receiverUser, senderUser, offered, requested] = await Promise.all([
    User.findById(receiver),
    User.findById(req.user.id),
    Skill.findById(offeredSkill),
    Skill.findById(requestedSkill),
  ]);
  if (!receiverUser) return res.status(404).json({ message: 'Receiver not found' });
  if (!offered || !requested) return res.status(400).json({ message: 'Invalid skill selected' });

  // Rule: you can only OFFER a skill you listed in "skills I can teach".
  const senderTeachIds = (senderUser.skillsToTeach || []).map(String);
  if (!senderTeachIds.includes(String(offeredSkill))) {
    return res.status(400).json({ message: 'You can only offer a skill you teach' });
  }

  // Rule: you can only REQUEST a skill the other person listed in "skills they can teach".
  const receiverTeachIds = (receiverUser.skillsToTeach || []).map(String);
  if (!receiverTeachIds.includes(String(requestedSkill))) {
    return res.status(400).json({ message: 'You can only request a skill they teach' });
  }

  // One pending request per sender -> receiver + skill pair. (A unique partial
  // index on the model backs this up at the database level too.)
  const duplicate = await SwapRequest.findOne({
    sender: req.user.id,
    receiver,
    offeredSkill,
    requestedSkill,
    status: 'Pending',
  });
  if (duplicate) {
    return res.status(400).json({ message: 'You already have a pending request with these skills' });
  }

  const swap = await SwapRequest.create({
    sender: req.user.id,
    receiver,
    offeredSkill,
    requestedSkill,
    message: message || '',
  });

  res.status(201).json(await populateSwap(SwapRequest.findById(swap._id)));
});

// PUT /api/swaps/:id — accept / reject / complete / cancel.
// Only the receiver can accept or reject; cancelling is open to either
// participant. Completing is two-sided: each participant marks only THEIR OWN
// side via senderCompleted / receiverCompleted, and status becomes 'Completed'
// only once BOTH sides are done. Invalid transitions are rejected with 400.
const updateSwap = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const swap = await SwapRequest.findById(req.params.id);

  if (!swap) return res.status(404).json({ message: 'Swap request not found' });

  const isSender = String(swap.sender) === req.user.id;
  const isReceiver = String(swap.receiver) === req.user.id;

  // Authorization: strangers can't touch someone else's swap.
  if (!isSender && !isReceiver) {
    return res.status(403).json({ message: 'You are not part of this swap request' });
  }

  const from = swap.status;

  // Role check: only the receiver can accept or reject a request.
  if ((status === 'Accepted' || status === 'Rejected') && !isReceiver) {
    return res.status(403).json({ message: 'Only the receiver can accept or reject this request' });
  }

  // Two-sided completion: mark the caller's own side, flip to Completed when
  // both sides are done. Marking your side twice is a 400, not a silent no-op.
  if (status === 'Completed') {
    if (from !== 'Accepted') {
      return res.status(400).json({
        message: `Cannot change status from ${from} to Completed`,
      });
    }
    if (isSender && swap.senderCompleted) {
      return res.status(400).json({ message: 'You have already marked this swap as completed' });
    }
    if (isReceiver && swap.receiverCompleted) {
      return res.status(400).json({ message: 'You have already marked this swap as completed' });
    }
    if (isSender) swap.senderCompleted = true;
    if (isReceiver) swap.receiverCompleted = true;
    if (swap.senderCompleted && swap.receiverCompleted) {
      swap.status = 'Completed';
    }
    await swap.save();
    return res.json(await populateSwap(SwapRequest.findById(swap._id)));
  }

  // Transition check for the remaining statuses.
  const validTransition =
    ((status === 'Accepted' || status === 'Rejected') && from === 'Pending') ||
    (status === 'Cancelled' && ['Pending', 'Accepted'].includes(from));

  if (!validTransition) {
    return res.status(400).json({
      message: `Cannot change status from ${from} to ${status || 'unknown'}`,
    });
  }

  swap.status = status;
  await swap.save();
  res.json(await populateSwap(SwapRequest.findById(swap._id)));
});

// DELETE /api/swaps/:id — the sender can delete their own request while it is
// still Pending (or already Rejected/Cancelled). Completed history is kept.
const deleteSwap = asyncHandler(async (req, res) => {
  const swap = await SwapRequest.findById(req.params.id);
  if (!swap) return res.status(404).json({ message: 'Swap request not found' });

  if (String(swap.sender) !== req.user.id) {
    return res.status(403).json({ message: 'Only the sender can delete this request' });
  }
  if (!['Pending', 'Rejected', 'Cancelled'].includes(swap.status)) {
    return res.status(400).json({ message: 'Only pending requests can be deleted' });
  }

  await swap.deleteOne();
  res.json({ message: 'Swap request deleted' });
});

module.exports = { getSwaps, createSwap, updateSwap, deleteSwap };
