const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/statsController');

// System statistics route
router.get('/', getDashboardStats);

module.exports = router;
