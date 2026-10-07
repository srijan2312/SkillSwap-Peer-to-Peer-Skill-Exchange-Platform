const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../utils/helpers');

// Fields we populate on skill references — just the display info.
const SKILL_FIELDS = 'name category';

// Signs a JWT containing only the user id. The secret and lifetime come from
// the environment so they are never hardcoded.
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

// Fetch a user the way the API returns it: skills populated, password never included.
const getPublicUser = (id) =>
  User.findById(id).populate('skillsToTeach', SKILL_FIELDS).populate('skillsToLearn', SKILL_FIELDS);

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // 409 (not 400): the request was valid, but it conflicts with existing data.
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  const user = await User.create({ name, email, password }); // pre('save') hashes the password
  const fullUser = await getPublicUser(user._id);

  res.status(201).json({ token: signToken(user._id), user: fullUser });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // +password: the schema hides it by default (select: false); we need it here
  // for exactly one comparison and never send it back.
  const user = await User.findOne({ email }).select('+password');

  // Same 401 message whether the email or the password was wrong — this avoids
  // leaking which emails have accounts.
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const fullUser = await getPublicUser(user._id);
  res.json({ token: signToken(user._id), user: fullUser });
});

// GET /api/auth/me — lets the frontend restore the session from a stored token.
const getMe = asyncHandler(async (req, res) => {
  const user = await getPublicUser(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

module.exports = { register, login, getMe };
