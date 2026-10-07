const express = require('express');
const { getMatches } = require('../controllers/matchController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/matches — ranked skill partners for the logged-in user
router.get('/', protect, getMatches);

module.exports = router;
