const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    // select: false means the password is NEVER returned by queries unless we
    // explicitly ask for it with .select('+password') (only done at login).
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: { type: String, default: '' }, // optional image URL; UI falls back to initials
    bio: { type: String, default: '', maxlength: [500, 'Bio cannot exceed 500 characters'] },
    location: { type: String, default: '', maxlength: [100, 'Location cannot exceed 100 characters'] },
    experienceLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    availability: {
      type: String,
      enum: ['Weekdays', 'Weekends', 'Evenings', 'Flexible'],
      default: 'Flexible',
    },
    // References to Skill documents (not embedded strings). This is a real
    // MongoDB relationship: a user's skills stay consistent if a skill is
    // renamed, and we can populate() them into full objects in one query.
    skillsToTeach: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
    skillsToLearn: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
    // Denormalized average rating — recalculated from Review documents every
    // time a review is created, so profile reads stay a single cheap query.
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Hash the password with bcrypt before saving. The isModified check matters:
// without it, every profile edit would re-hash the already-hashed password
// and the user would be locked out.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare a plain-text login password against the stored bcrypt hash.
userSchema.methods.matchPassword = function (enteredPassword) {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
