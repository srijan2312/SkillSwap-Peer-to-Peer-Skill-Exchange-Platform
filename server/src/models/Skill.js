const mongoose = require('mongoose');

// The fixed set of skill categories. Exported so routes can validate against
// the exact same list the schema enforces — one source of truth.
const SKILL_CATEGORIES = [
  'Frontend',
  'Backend',
  'Database',
  'Cloud',
  'DevOps',
  'Programming',
  'Design',
  'Marketing',
  'Other',
];

// A skill is its own collection (instead of a plain string on the user)
// so that matching, searching and filtering can work on stable references.
// Users link to skills via ObjectId in skillsToTeach / skillsToLearn.
const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      unique: true,
      trim: true,
      maxlength: [60, 'Skill name cannot exceed 60 characters'],
    },
    category: {
      type: String,
      enum: SKILL_CATEGORIES,
      default: 'Other',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Skill', skillSchema);
module.exports.SKILL_CATEGORIES = SKILL_CATEGORIES;
