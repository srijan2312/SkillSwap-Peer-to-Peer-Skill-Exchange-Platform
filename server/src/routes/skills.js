const express = require('express');
const { body } = require('express-validator');
const { getSkills, createSkill } = require('../controllers/skillController');
const { SKILL_CATEGORIES } = require('../models/Skill');
const { protect } = require('../middleware/auth');
const { validate } = require('../utils/helpers');

const router = express.Router();

router.use(protect); // the skill catalog powers logged-in forms and filters

// GET /api/skills
router.get('/', getSkills);

// POST /api/skills — add a missing skill to the catalog from the profile page
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Skill name is required')
      .isLength({ max: 60 }).withMessage('Skill name cannot exceed 60 characters'),
    body('category').optional().isIn(SKILL_CATEGORIES).withMessage('Invalid category'),
  ],
  validate,
  createSkill
);

module.exports = router;
