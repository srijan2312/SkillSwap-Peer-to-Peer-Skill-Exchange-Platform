const express = require('express');
const { getDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard — stats + top matches + recent activity in one call
router.get('/', protect, getDashboard);

module.exports = router;
