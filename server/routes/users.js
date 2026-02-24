const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticateJWT } = require('../middleware/auth');
const userController = require('../controllers/userController');

// IP-level rate limiter for the company join endpoint
const joinRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many join attempts from this IP, please try again later.' },
  handler: (req, res) => res.status(429).json({ message: 'Too many join attempts from this IP, please try again later.' })
});

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

// Join a company using a 5-digit code
router.post('/companies/join', authenticateJWT, joinRateLimiter, userController.joinCompany);

// Regenerate company code (company admins only)
router.post('/companies/regenerate-code', authenticateJWT, userController.regenerateCompanyCode);

module.exports = router;
