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

// Google OAuth Routes
// Initiate Google OAuth flow
router.get('/google', (req, res, next) => {
  // Extract and preserve the state parameter (redirect URL)
  const state = req.query.state;

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state: state || '' // Pass state to OAuth flow
  })(req, res, next);
});

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = authController.generateToken(req.user);

      // Extract state parameter (redirect URL) from query
      const state = req.query.state;

      // Redirect to client with token and optional state
      const clientURL = process.env.CLIENT_URL || 'http://localhost:3000';
      const redirectUrl = state
        ? `${clientURL}/auth/callback?token=${token}&redirect=${encodeURIComponent(state)}`
        : `${clientURL}/auth/callback?token=${token}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }
  }
);

module.exports = router;
