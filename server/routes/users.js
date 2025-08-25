const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Get user profile
router.get('/profile', authenticateJWT, userController.getProfile);

// Update user profile
router.put('/profile', authenticateJWT, userController.updateProfile);

// Update user credentials (username and password)
router.put('/credentials', authenticateJWT, userController.updateCredentials);

// Create or update company profile
router.post('/company', authenticateJWT, userController.createOrUpdateCompany);

// Update company profile
router.put('/company', authenticateJWT, userController.createOrUpdateCompany);

module.exports = router;
