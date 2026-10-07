const Skill = require('../models/Skill');
const { asyncHandler } = require('../utils/helpers');

// GET /api/skills?category= — the master skill list used by filters and forms.
const getSkills = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  const skills = await Skill.find(filter).sort({ name: 1 });
  res.json(skills);
});

// POST /api/skills — add a new skill to the catalog (e.g. from the profile
// page when the skill a user teaches isn't listed yet). Names are unique:
// a case-insensitive duplicate returns 409 instead of creating a second row.
const createSkill = asyncHandler(async (req, res) => {
  const { name, category } = req.body;

  const trimmed = (name || '').trim();
  if (!trimmed) {
    return res.status(400).json({ message: 'Skill name is required' });
  }

  // Escape regex special chars in the name (skills like "C++" would otherwise
  // break the pattern) before the case-insensitive exact-match duplicate check.
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const existing = await Skill.findOne({ name: new RegExp(`^${escaped}$`, 'i') });
  if (existing) {
    return res.status(409).json({ message: 'This skill already exists', skill: existing });
  }

  const skill = await Skill.create({ name: trimmed, category: category || 'Other' });
  res.status(201).json(skill);
});

module.exports = { getSkills, createSkill };
