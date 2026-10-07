const User = require('../models/User');
const Skill = require('../models/Skill');
const SwapRequest = require('../models/SwapRequest');
const Review = require('../models/Review');
const cloudinary = require('cloudinary').v2;
const { asyncHandler, PUBLIC_USER_FIELDS } = require('../utils/helpers');

const SKILL_FIELDS = 'name category';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const populateUser = (query) =>
  query.populate('skillsToTeach', SKILL_FIELDS).populate('skillsToLearn', SKILL_FIELDS);

// Strip private fields before sending a user to another user.
// Your own profile keeps your email; everyone else's hides it.
const sanitizeUser = (userDoc, viewerId) => {
  const user = userDoc.toObject();

  delete user.password;

  if (String(user._id) !== String(viewerId)) {
    delete user.email;
  }

  return user;
};

// Upload an avatar buffer to Cloudinary.
//
// We use the user's ID as the public_id so that updating the avatar
// replaces the previous image instead of creating a new image every time.
const uploadAvatarToCloudinary = (buffer, userId) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'skillswap/avatars',
        public_id: String(userId),
        overwrite: true,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });

// Delete the user's Cloudinary avatar.
// This is best-effort — account deletion should not fail just because
// the Cloudinary image is already missing.
const deleteCloudinaryAvatar = async (userId) => {
  if (!userId) return;

  try {
    await cloudinary.uploader.destroy(
      `skillswap/avatars/${String(userId)}`,
      {
        resource_type: 'image',
      }
    );
  } catch (_) {
    // Ignore Cloudinary deletion errors.
  }
};

// GET /api/users?search=&skill=&category=&experienceLevel=&availability=
const getUsers = asyncHandler(async (req, res) => {
  const {
    search,
    skill,
    category,
    experienceLevel,
    availability,
  } = req.query;

  const filter = {
    _id: { $ne: req.user.id },
  };

  if (experienceLevel) {
    filter.experienceLevel = experienceLevel;
  }

  if (availability) {
    filter.availability = availability;
  }

  // Skill-name / category search:
  // find matching skill IDs first, then find users linked to them.
  const orClauses = [];

  if (skill || category) {
    const skillFilter = {};

    if (skill) {
      skillFilter.name = new RegExp(skill.trim(), 'i');
    }

    if (category) {
      skillFilter.category = category;
    }

    const skills = await Skill.find(skillFilter).select('_id');
    const skillIds = skills.map((s) => s._id);

    orClauses.push(
      { skillsToTeach: { $in: skillIds } },
      { skillsToLearn: { $in: skillIds } }
    );
  }

  // Name search across the user's name.
  if (search) {
    orClauses.push({
      name: new RegExp(search.trim(), 'i'),
    });
  }

  // A user matches when ANY search clause matches.
  if (orClauses.length > 0) {
    filter.$or = orClauses;
  }

  const users = await populateUser(
    User.find(filter).sort({ createdAt: -1 })
  );

  res.json(
    users.map((u) => sanitizeUser(u, req.user.id))
  );
});

// GET /api/users/:id — public profile view.
// Email is hidden unless it belongs to the logged-in user.
const getUserById = asyncHandler(async (req, res) => {
  const user = await populateUser(
    User.findById(req.params.id)
  );

  if (!user) {
    return res.status(404).json({
      message: 'User not found',
    });
  }

  const completedSwaps = await SwapRequest.countDocuments({
    status: 'Completed',
    $or: [
      { sender: user._id },
      { receiver: user._id },
    ],
  });

  const result = sanitizeUser(user, req.user.id);
  result.completedSwaps = completedSwaps;

  res.json(result);
});

// PUT /api/users/:id — only your own profile.
//
// Accepts BOTH JSON and multipart/form-data.
// When an avatar image is uploaded, multer stores it temporarily
// in memory and we upload that buffer directly to Cloudinary.
const updateUser = asyncHandler(async (req, res) => {
  // Authorization:
  // the ID in the token must match the ID in the URL.
  if (req.params.id !== req.user.id) {
    return res.status(403).json({
      message: 'You can only update your own profile',
    });
  }

  // Whitelist updatable fields.
  const allowed = [
    'name',
    'bio',
    'location',
    'avatar',
    'experienceLevel',
    'availability',
    'skillsToTeach',
    'skillsToLearn',
  ];

  const updates = {};

  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  // If validation fails after multer has processed an image,
  // there is no local file to clean up because multer uses memoryStorage.
  const reject = (status, message) => {
    return res.status(status).json({ message });
  };

  // Every referenced skill ID must point to a real Skill document.
  for (const field of ['skillsToTeach', 'skillsToLearn']) {
    if (updates[field] !== undefined) {
      if (!Array.isArray(updates[field])) {
        return reject(
          400,
          `${field} must be an array of skill ids`
        );
      }

      const cleaned = [
        ...new Set(
          updates[field]
            .filter(Boolean)
            .map(String)
        ),
      ];

      let count;

      try {
        count = await Skill.countDocuments({
          _id: { $in: cleaned },
        });
      } catch (_) {
        return reject(
          400,
          `One or more skills in ${field} are invalid`
        );
      }

      if (count !== cleaned.length) {
        return reject(
          400,
          `One or more skills in ${field} are invalid`
        );
      }

      updates[field] = cleaned;
    }
  }

  // Avatar handling.
  //
  // If multer received an image:
  //   1. The image is currently in req.file.buffer.
  //   2. Upload it to Cloudinary.
  //   3. Store Cloudinary's secure URL in MongoDB.
  //
  // Cloudinary uses the user's ID as the public_id, so a new avatar
  // replaces the previous avatar automatically.
  if (req.file) {
    try {
      const result = await uploadAvatarToCloudinary(
        req.file.buffer,
        req.user.id
      );

      updates.avatar = result.secure_url;
    } catch (error) {
      console.error('Cloudinary avatar upload failed:', error);

      return reject(
        500,
        'Avatar upload failed. Please try again.'
      );
    }
  } else if (
    updates.avatar !== undefined &&
    updates.avatar !== ''
  ) {
    // If a raw avatar string is sent, only allow a valid HTTP(S) URL.
    const isRemoteUrl = /^https?:\/\/.+\..+/.test(
      updates.avatar
    );

    if (!isRemoteUrl) {
      return reject(
        400,
        'Avatar must be a valid image URL'
      );
    }
  }

  const user = await populateUser(
    User.findByIdAndUpdate(
      req.user.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    )
  );

  if (!user) {
    return res.status(404).json({
      message: 'User not found',
    });
  }

  res.json(
    sanitizeUser(user, req.user.id)
  );
});

// PUT /api/users/:id/password — change your own password.
const changePassword = asyncHandler(async (req, res) => {
  if (req.params.id !== req.user.id) {
    return res.status(403).json({
      message: 'You can only change your own password',
    });
  }

  const {
    currentPassword,
    newPassword,
  } = req.body;

  const user = await User.findById(req.user.id)
    .select('+password');

  if (!user) {
    return res.status(404).json({
      message: 'User not found',
    });
  }

  const correct = await user.matchPassword(
    currentPassword || ''
  );

  if (!correct) {
    return res.status(401).json({
      message: 'Current password is incorrect',
    });
  }

  user.password = newPassword;

  // The pre-save hook on the User model bcrypt-hashes it.
  await user.save();

  res.json({
    message: 'Password changed successfully',
  });
});

// DELETE /api/users/:id — delete your own account.
//
// Removes:
// - swap requests
// - reviews
// - Cloudinary avatar
// - user account
const deleteAccount = asyncHandler(async (req, res) => {
  if (req.params.id !== req.user.id) {
    return res.status(403).json({
      message: 'You can only delete your own account',
    });
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      message: 'User not found',
    });
  }

  // All swap requests where this user is sender OR receiver.
  await SwapRequest.deleteMany({
    $or: [
      { sender: user._id },
      { receiver: user._id },
    ],
  });

  // All reviews they gave or received.
  // Then repair the average rating of every OTHER user they reviewed.
  const reviews = await Review.find({
    $or: [
      { reviewer: user._id },
      { reviewedUser: user._id },
    ],
  }).select('reviewedUser');

  const affectedIds = [
    ...new Set(
      reviews.map((r) => String(r.reviewedUser))
    ),
  ].filter(
    (id) => id !== String(user._id)
  );

  await Review.deleteMany({
    _id: {
      $in: reviews.map((r) => r._id),
    },
  });

  for (const uid of affectedIds) {
    const remaining = await Review.find({
      reviewedUser: uid,
    });

    const avg = remaining.length
      ? remaining.reduce(
          (sum, r) => sum + r.rating,
          0
        ) / remaining.length
      : 0;

    await User.findByIdAndUpdate(
      uid,
      {
        rating: avg,
        ratingCount: remaining.length,
      }
    );
  }

  // Delete the user's Cloudinary avatar.
  await deleteCloudinaryAvatar(user._id);

  await user.deleteOne();

  res.json({
    message: 'Account deleted',
  });
});

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  changePassword,
  deleteAccount,
};