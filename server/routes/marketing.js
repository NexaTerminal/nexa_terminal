const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const marketingController = require('../controllers/marketingController');

// Add a new marketing post (admin only)
router.post('/', authenticateJWT, marketingController.create);

// Get latest marketing posts
router.get('/', marketingController.getLatest);

module.exports = router; 