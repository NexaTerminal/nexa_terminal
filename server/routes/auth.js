const express = require('express');
const router = express.Router();
const passport = require('passport');
const { authenticateJWT } = require('../middleware/auth');
const authController = require('../controllers/authController');
const RateLimitingService = require('../middleware/rateLimiting');

// Admin user creation route (gated by ADMIN_SETUP_KEY in the controller; rate-limited)
router.post('/create-admin', RateLimitingService.createLoginLimiter(), authController.createAdmin);

// Register new user with simplified username/password signup
router.post('/register', RateLimitingService.createRegistrationLimiter(), authController.register);

// Verify the 6-digit code sent during registration → issues JWT (account stays
// locked until a redeem code or paid plan grants access).
router.post('/verify-email', authController.verifyEmail);

// Resend the verification code (60-second cooldown enforced server-side).
router.post('/resend-verification', authController.resendVerification);

// Login with username/password (for simplified signup users)
router.post('/login-username', RateLimitingService.createLoginLimiter(), authController.loginUsername);

// Login with email/password (legacy for existing users)
router.post('/login', RateLimitingService.createLoginLimiter(), passport.authenticate('local', { session: false }), (req, res) => {
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
  async (req, res) => {
    try {
      // State carries the post-login redirect + the storefront the user signed
      // up from. New format: `sf=leads&redirect=/x`. Legacy: a bare redirect URL.
      const rawState = req.query.state || '';
      let redirect = '';
      let sf = 'main';
      let origin = '';
      if (rawState.includes('sf=') || rawState.includes('redirect=') || rawState.includes('origin=')) {
        const sp = new URLSearchParams(rawState);
        redirect = sp.get('redirect') || '';
        sf = sp.get('sf') || 'main';
        origin = sp.get('origin') || '';
      } else {
        redirect = rawState;
      }

      // Return to the storefront host the user started from (so the Pro shell
      // shows on leads.*). Validated against an allowlist to avoid open redirects;
      // otherwise fall back to the configured CLIENT_URL.
      const ALLOWED_HOSTS = new Set(['localhost', 'leads.localhost', 'nexa.mk', 'www.nexa.mk', 'leads.nexa.mk']);
      let clientURL = process.env.CLIENT_URL || 'http://localhost:3000';
      if (origin) {
        try {
          const u = new URL(origin);
          if (ALLOWED_HOSTS.has(u.hostname)) clientURL = u.origin;
        } catch (_) { /* keep fallback */ }
      }

      // Brand-new Google account (no subscription, or 'none') → start the 8-day
      // free trial for the plan matching the storefront. initTrial is idempotent
      // and reloads role, so we re-issue the token from the fresh user doc.
      let user = req.user;
      try {
        const sub = req.app.locals.subscriptionService;
        const st = user.subscription?.status;
        if (sub && (!st || st === 'none')) {
          const plan = sf === 'leads' ? 'pro' : 'basic';
          await sub.initTrial(user._id, { plan });
          const UserService = require('../services/userService');
          const fresh = await new UserService(req.app.locals.db).findById(user._id);
          if (fresh) user = fresh;
        }
      } catch (e) {
        console.error('initTrial after Google signup warning:', e.message);
      }

      const token = authController.generateToken(user);
      const redirectUrl = redirect
        ? `${clientURL}/auth/callback?token=${token}&redirect=${encodeURIComponent(redirect)}`
        : `${clientURL}/auth/callback?token=${token}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }
  }
);

module.exports = router;
