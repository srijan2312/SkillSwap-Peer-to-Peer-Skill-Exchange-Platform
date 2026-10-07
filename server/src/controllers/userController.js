const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Skill = require('../models/Skill');
const SwapRequest = require('../models/SwapRequest');
const Review = require('../models/Review');
const { asyncHandler, PUBLIC_USER_FIELDS } = require('../utils/helpers');

const SKILL_FIELDS = 'name category';

const populateUser = (query) =>
  query.populate('skillsToTeach', SKILL_FIELDS).populate('skillsToLearn', SKILL_FIELDS);

// Strip private fields before sending a user to another user.
// Your own profile keeps your email; everyone else's hides it.
const sanitizeUser = (userDoc, viewerId) => {
  const user = userDoc.toObject();
  delete user.password; // belt-and-braces: password is select:false, but never trust that alone
  if (String(user._id) !== String(viewerId)) delete user.email;
  return user;
};

// Remove a locally uploaded avatar file from disk (best-effort).
// path.basename() guards against path traversal, and we only ever delete
// inside our own uploads/avatars folder.
const deleteLocalAvatar = (avatarPath) => {
  if (!avatarPath || !avatarPath.startsWith('/uploads/avatars/')) return;
  const filePath = path.join(
    __dirname,
    '..',
    '..',
    'uploads',
    'avatars',
    path.basename(avatarPath)
  );
  fs.unlink(filePath, () => {}); // ignore errors — the file may already be gone
};

// GET /api/users?search=&skill=&category=&experienceLevel=&availability=
const getUsers = asyncHandler(async (req, res) => {
  const { search, skill, category, experienceLevel, availability } = req.query;
  const filter = { _id: { $ne: req.user.id } }; // never show yourself in discovery

  if (experienceLevel) filter.experienceLevel = experienceLevel;
  if (availability) filter.availability = availability;

  // Skill-name / category search: find matching skill ids first, then the
  // users linked to them via skillsToTeach or skillsToLearn.
  const orClauses = [];
  if (skill || category) {
    const skillFilter = {};
    if (skill) skillFilter.name = new RegExp(skill.trim(), 'i');
    if (category) skillFilter.category = category;
    const skills = await Skill.find(skillFilter).select('_id');
    const skillIds = skills.map((s) => s._id);
    orClauses.push({ skillsToTeach: { $in: skillIds } }, { skillsToLearn: { $in: skillIds } });
  }

  // Name search across the user's name (case-insensitive).
  if (search) {
    orClauses.push({ name: new RegExp(search.trim(), 'i') });
  }

  // A user matches when ANY of the search clauses match (skill OR name).
  if (orClauses.length > 0) filter.$or = orClauses;

  const users = await populateUser(User.find(filter).sort({ createdAt: -1 }));
  res.json(users.map((u) => sanitizeUser(u, req.user.id)));
});

// GET /api/users/:id — public profile view (email hidden unless it's you).
const getUserById = asyncHandler(async (req, res) => {
  const user = await populateUser(User.findById(req.params.id));
  if (!user) return res.status(404).json({ message: 'User not found' });

  const completedSwaps = await SwapRequest.countDocuments({
    status: 'Completed',
    $or: [{ sender: user._id }, { receiver: user._id }],
  });

  const result = sanitizeUser(user, req.user.id);
  result.completedSwaps = completedSwaps;
  res.json(result);
});

// PUT /api/users/:id — only your own profile.
// Accepts BOTH JSON and multipart/form-data (when an avatar image is
// uploaded). With multipart, the two skill lists arrive as JSON strings, so
// the route parses them back into arrays before this runs.
const updateUser = asyncHandler(async (req, res) => {
  // Authorization: the id in the token must match the id in the URL.
  if (req.params.id !== req.user.id) {
    return res.status(403).json({ message: 'You can only update your own profile' });
  }

  // Whitelist updatable fields — role/escalation-style fields can't be sneaked in.
  const allowed = ['name', 'bio', 'location', 'avatar', 'experienceLevel', 'availability', 'skillsToTeach', 'skillsToLearn'];
  const updates = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  // If we reject the request after multer already saved an avatar file,
  // delete that file so it doesn't sit orphaned on disk.
  const reject = (status, message) => {
    if (req.file) deleteLocalAvatar(`/uploads/avatars/${req.file.filename}`);
    return res.status(status).json({ message });
  };

  // Every referenced skill id must point to a real Skill document.
  // Before checking: drop empty/falsy values and de-duplicate, so a client
  // can never save ["", ""] or the same skill twice.
  for (const field of ['skillsToTeach', 'skillsToLearn']) {
    if (updates[field] !== undefined) {
      if (!Array.isArray(updates[field])) {
        return reject(400, `${field} must be an array of skill ids`);
      }
      const cleaned = [...new Set(updates[field].filter(Boolean).map(String))];
      // A malformed ObjectId string would make countDocuments throw a
      // CastError (500) — catch it and answer a clean 400 instead.
      let count;
      try {
        count = await Skill.countDocuments({ _id: { $in: cleaned } });
      } catch (_) {
        return reject(400, `One or more skills in ${field} are invalid`);
      }
      if (count !== cleaned.length) {
        return reject(400, `One or more skills in ${field} are invalid`);
      }
      updates[field] = cleaned;
    }
  }

  // Avatar handling: if multer saved an uploaded image, store its path and
  // delete the previous local file. Otherwise keep the existing value — but
  // if a raw string was sent, it must be a real URL or one of our own
  // /uploads/ paths (never an arbitrary string).
  if (req.file) {
    updates.avatar = `/uploads/avatars/${req.file.filename}`;
  } else if (updates.avatar !== undefined && updates.avatar !== '') {
    const isLocalUpload = updates.avatar.startsWith('/uploads/');
    const isRemoteUrl = /^https?:\/\/.+\..+/.test(updates.avatar);
    if (!isLocalUpload && !isRemoteUrl) {
      return reject(400, 'Avatar must be a valid image URL');
    }
  }

  const previous = await User.findById(req.user.id).select('avatar');
  const user = await populateUser(
    User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true })
  );
  if (!user) return res.status(404).json({ message: 'User not found' });

  // The profile now points at the new file — remove the old local one.
  if (req.file && previous && previous.avatar !== user.avatar) {
    deleteLocalAvatar(previous.avatar);
  }

  res.json(sanitizeUser(user, req.user.id));
});

// PUT /api/users/:id/password — change your own password.
// The current password must be correct (401 if wrong); the new one needs at
// least 6 characters. The pre-save hook on the User model bcrypt-hashes it.
const changePassword = asyncHandler(async (req, res) => {
  if (req.params.id !== req.user.id) {
    return res.status(403).json({ message: 'You can only change your own password' });
  }

  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');
  if (!user) return res.status(404).json({ message: 'User not found' });

  const correct = await user.matchPassword(currentPassword || '');
  if (!correct) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  user.password = newPassword; // hashed automatically by the pre-save hook
  await user.save();
  res.json({ message: 'Password changed successfully' });
});

// DELETE /api/users/:id — delete your own account, with cascade cleanup:
// every swap request you were part of is removed, every review you gave or
// received is removed (and the average rating of anyone you reviewed is
// recomputed), and your uploaded avatar file is deleted from disk.
const deleteAccount = asyncHandler(async (req, res) => {
  if (req.params.id !== req.user.id) {
    return res.status(403).json({ message: 'You can only delete your own account' });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // All swap requests where this user is sender OR receiver.
  await SwapRequest.deleteMany({
    $or: [{ sender: user._id }, { receiver: user._id }],
  });

  // All reviews they gave or received — then repair the average rating of
  // every OTHER user they reviewed, so no stale score is left behind.
  const reviews = await Review.find({
    $or: [{ reviewer: user._id }, { reviewedUser: user._id }],
  }).select('reviewedUser');
  const affectedIds = [
    ...new Set(reviews.map((r) => String(r.reviewedUser))),
  ].filter((id) => id !== String(user._id));
  await Review.deleteMany({ _id: { $in: reviews.map((r) => r._id) } });
  for (const uid of affectedIds) {
    const remaining = await Review.find({ reviewedUser: uid });
    const avg = remaining.length
      ? remaining.reduce((sum, r) => sum + r.rating, 0) / remaining.length
      : 0;
    await User.findByIdAndUpdate(uid, { rating: avg, ratingCount: remaining.length });
  }

  deleteLocalAvatar(user.avatar);
  await user.deleteOne();

  res.json({ message: 'Account deleted' });
});

module.exports = { getUsers, getUserById, updateUser, changePassword, deleteAccount };
