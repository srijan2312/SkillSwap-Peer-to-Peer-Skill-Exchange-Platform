const User = require('../models/User');
const SwapRequest = require('../models/SwapRequest');
const Review = require('../models/Review');
const { asyncHandler, PUBLIC_USER_FIELDS } = require('../utils/helpers');
const { computeMatches } = require('../utils/match');

const SKILL_FIELDS = 'name category';

// GET /api/dashboard — one call that powers the whole dashboard page:
// stats, top 5 recommended partners, and the 5 most recent activity events.
const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const me = await User.findById(userId)
    .populate('skillsToTeach', SKILL_FIELDS)
    .populate('skillsToLearn', SKILL_FIELDS);
  if (!me) return res.status(404).json({ message: 'User not found' });

  const [pendingIncoming, pendingSent, activeSwaps, completedSwaps] = await Promise.all([
    SwapRequest.countDocuments({ receiver: userId, status: 'Pending' }),
    SwapRequest.countDocuments({ sender: userId, status: 'Pending' }),
    SwapRequest.countDocuments({
      status: 'Accepted',
      $or: [{ sender: userId }, { receiver: userId }],
    }),
    SwapRequest.countDocuments({
      status: 'Completed',
      $or: [{ sender: userId }, { receiver: userId }],
    }),
  ]);

  const stats = {
    skillsToTeach: me.skillsToTeach.length,
    skillsToLearn: me.skillsToLearn.length,
    pendingIncoming,
    pendingSent,
    activeSwaps,
    completedSwaps,
  };

  // Reuse the same matching algorithm as GET /api/matches — top 5 for the dashboard.
  const candidates = await User.find({ _id: { $ne: userId } })
    .populate('skillsToTeach', SKILL_FIELDS)
    .populate('skillsToLearn', SKILL_FIELDS);
  const topMatches = computeMatches(me, candidates, 5).map((m) => {
    const user = m.user.toObject();
    delete user.password;
    delete user.email;
    return { ...m, user };
  });

  // Recent activity: the latest swaps involving me, turned into human-readable
  // sentences, plus the latest reviews I received. Newest first, max 5.
  const recentSwaps = await SwapRequest.find({ $or: [{ sender: userId }, { receiver: userId }] })
    .populate('sender', 'name')
    .populate('receiver', 'name')
    .sort({ updatedAt: -1 })
    .limit(5);

  const recentReviews = await Review.find({ reviewedUser: userId })
    .populate('reviewer', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

  const events = [];

  for (const swap of recentSwaps) {
    const iAmSender = String(swap.sender._id) === userId;
    const other = iAmSender ? swap.receiver.name : swap.sender.name;
    let text;
    switch (swap.status) {
      case 'Pending':
        text = iAmSender ? `You sent a swap request to ${other}` : `${other} sent you a swap request`;
        break;
      case 'Accepted':
        text = iAmSender ? `${other} accepted your swap request` : `You accepted ${other}'s swap request`;
        break;
      case 'Rejected':
        text = iAmSender ? `${other} declined your swap request` : `You declined ${other}'s swap request`;
        break;
      case 'Completed':
        text = `You completed a skill swap with ${other}`;
        break;
      case 'Cancelled':
        text = `A swap request with ${other} was cancelled`;
        break;
      default:
        text = `Swap request with ${other} updated`;
    }
    events.push({ type: 'swap', text, createdAt: swap.updatedAt });
  }

  for (const review of recentReviews) {
    events.push({
      type: 'review',
      text: `${review.reviewer.name} left you a ${review.rating}-star review`,
      createdAt: review.createdAt,
    });
  }

  events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const recentActivity = events.slice(0, 5);

  res.json({ stats, topMatches, recentActivity });
});

module.exports = { getDashboard };
