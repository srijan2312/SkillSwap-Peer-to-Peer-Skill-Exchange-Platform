const User = require('../models/User');
const { asyncHandler } = require('../utils/helpers');
const { computeMatches } = require('../utils/match');

const SKILL_FIELDS = 'name category';

// GET /api/matches?limit=20 — skill partners ranked by the matching algorithm.
// See src/utils/match.js for the documented formula.
const getMatches = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

  const me = await User.findById(req.user.id)
    .populate('skillsToTeach', SKILL_FIELDS)
    .populate('skillsToLearn', SKILL_FIELDS);
  if (!me) return res.status(404).json({ message: 'User not found' });

  const candidates = await User.find({ _id: { $ne: req.user.id } })
    .populate('skillsToTeach', SKILL_FIELDS)
    .populate('skillsToLearn', SKILL_FIELDS);

  // Never leak password or email of other users through the match feed.
  const matches = computeMatches(me, candidates, limit).map((m) => {
    const user = m.user.toObject();
    delete user.password;
    delete user.email;
    return { ...m, user };
  });

  res.json(matches);
});

module.exports = { getMatches };
