const express = require('express');
const router = express.Router();
const passport = require('passport');
const { authenticateJWT } = require('../middleware/auth');
const authController = require('../controllers/authController');
const RateLimitingService = require('../middleware/rateLimiting');

// Admin user creation route
router.post('/create-admin', authController.createAdmin);

// Register new user with simplified username/password signup
router.post('/register', RateLimitingService.createRegistrationLimiter(), authController.register);

// Login with username/password (for simplified signup users)
router.post('/login-username', RateLimitingService.createLoginLimiter(), authController.loginUsername);

// Login with email/password (legacy for existing users)
router.post('/login', passport.authenticate('local', { session: false }), (req, res) => {
  try {
    // Generate JWT token
    const token = authController.generateToken(req.user);
    
    res.json({
      success: true,
      token,
      user: authController.formatUserResponse(req.user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Direct login for testing (bypasses Passport)
router.post('/direct-login', authController.directLogin);

// Token validation endpoint
router.get('/validate', authenticateJWT, authController.validateToken);

// Update user profile
router.put('/update-profile', authenticateJWT, authController.updateProfile);

// Password Reset Routes
router.post('/forgot-password', RateLimitingService.createPasswordResetLimiter(), authController.forgotPassword);
router.get('/validate-reset-token', RateLimitingService.createTokenValidationLimiter(), authController.validateResetToken);
router.post('/reset-password', RateLimitingService.createTokenValidationLimiter(), authController.resetPassword);

// Password Change Route (for authenticated users)
router.post('/change-password', authenticateJWT, RateLimitingService.createPasswordChangeLimiter(), authController.changePassword);

// Logout endpoint
router.post('/logout', authenticateJWT, authController.logout);

module.exports = router;
