const express = require('express');
const router = express.Router();
const passport = require('passport');
const { authenticateJWT } = require('../middleware/auth');
const authController = require('../controllers/authController');
const RateLimitingService = require('../middleware/rateLimiting');
const { isValidFounderInvite } = require('../utils/founderInvite');

// Hosts the OAuth round-trip may return to (guards against open redirects).
const ALLOWED_OAUTH_HOSTS = new Set(['localhost', 'leads.localhost', 'nexa.mk', 'www.nexa.mk', 'leads.nexa.mk']);
function resolveClientUrl(rawState) {
  let clientURL = process.env.CLIENT_URL || 'http://localhost:3000';
  try {
    const origin = new URLSearchParams(rawState || '').get('origin') || '';
    if (origin) {
      const u = new URL(origin);
      if (ALLOWED_OAUTH_HOSTS.has(u.hostname)) clientURL = u.origin;
    }
  } catch (_) { /* keep fallback */ }
  return clientURL;
}

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
    authController.recordAuthEvent(req, req.user._id, 'login', { method: 'email' });

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

// First-login onboarding: choose Basic vs Pro. Google users never see the
// signup-form chooser, so we ask once on first terminal entry. Runs only while
// needsTierOnboarding is true (not a general account-type switcher).
router.post('/choose-account-type', authenticateJWT, authController.chooseAccountType);

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
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) {
        console.error('Google OAuth error:', err);
        return res.redirect(`${resolveClientUrl(req.query.state)}/login?error=oauth_failed`);
      }
      if (!user) {
        // Rejected BEFORE any account was created — e.g. a leads signup without a
        // valid founder invite. Bounce back to the originating host's login with
        // a flag so the UI explains access is invite-only.
        const flag = info?.code === 'INVITE_REQUIRED' ? 'needInvite=1' : 'error=oauth_failed';
        return res.redirect(`${resolveClientUrl(req.query.state)}/login?${flag}`);
      }
      req.user = user;
      return next();
    })(req, res, next);
  },
  async (req, res) => {
    try {
      // State carries the post-login redirect + the storefront the user signed
      // up from. New format: `sf=leads&redirect=/x`. Legacy: a bare redirect URL.
      const rawState = req.query.state || '';
      let redirect = '';
      let sf = 'main';
      let origin = '';
      let chosenPlan = '';   // identity the user picked in the signup UI
      let lic = '';          // lawyer licence / ЕМБС (Pro signups only)
      let invite = '';       // founder invite token (leads.* instant-Pro)
      let code = '';         // promo code from a /redeem campaign link
      if (rawState.includes('sf=') || rawState.includes('redirect=') || rawState.includes('origin=')) {
        const sp = new URLSearchParams(rawState);
        redirect = sp.get('redirect') || '';
        sf = sp.get('sf') || 'main';
        origin = sp.get('origin') || '';
        chosenPlan = sp.get('plan') || '';
        lic = sp.get('lic') || '';
        invite = sp.get('invite') || '';
        code = sp.get('code') || '';
      } else {
        redirect = rawState;
      }

      // Return to the storefront host the user started from (so the Pro shell
      // shows on leads.*); validated against an allowlist to avoid open redirects.
      const clientURL = resolveClientUrl(rawState);

      // Brand-new Google account (no subscription, or 'none') → provision:
      //  - main (nexa.mk)  → free-forever Basic immediately.
      //  - leads (Pro)     → a valid founder invite grants INSTANT active Pro
      //    (the strategy already rejected leads signups without one). The locked
      //    path is only a defensive fallback and is effectively unreachable now.
      let user = req.user;
      try {
        const sub = req.app.locals.subscriptionService;
        const st = user.subscription?.status;
        if (sub && (!st || st === 'none')) {
          const { isValidPlan } = require('../constants/roles');
          const explicit = isValidPlan(chosenPlan);
          const plan = explicit ? chosenPlan : (sf === 'leads' ? 'pro' : 'basic');
          const hasFounderInvite = sf === 'leads' && isValidFounderInvite(invite);
          const codeTrim = String(code || '').trim();
          if (plan === 'pro' && hasFounderInvite) {
            // Reuse the proven activation path (role→admin_user, plan→pro,
            // status→active, Founding-20 cap enforced). No code, no locked step.
            try {
              await sub.redeemPromo(user._id, { plan: 'pro', cycle: 'quarterly', code: 'FOUNDER-INVITE', durationDays: 180 });
            } catch (e) {
              console.error('founder-invite Pro activation warning:', e.message);
              await sub.initLocked(user._id);
            }
          } else if (sf === 'leads' && codeTrim) {
            // Promo-code campaign link (/redeem?code=…). Redeem SERVER-SIDE here so
            // the account is already Pro before any redirect — otherwise the code,
            // stashed in leads.* localStorage, is stranded when the canonical
            // redirect sends a still-locked account to nexa.mk. Invalid → locked.
            try {
              const promoSvc = req.app.locals.promoCodeService;
              const codeDoc = await promoSvc.claim(codeTrim, user._id);
              await sub.redeemPromo(user._id, {
                plan: codeDoc.plan, cycle: codeDoc.cycle, code: codeDoc.code,
                durationDays: codeDoc.promoDays || 90
              });
            } catch (e) {
              console.error('promo-code Pro activation (google) failed:', e.message);
              await sub.initLocked(user._id);
            }
          } else if (plan === 'pro') {
            await sub.initLocked(user._id); // defensive fallback (no valid invite/code)
          } else {
            await sub.initFreeBasic(user._id);
          }
          if (plan === 'pro' && String(lic || '').trim()) {
            try {
              await req.app.locals.db.collection('users').updateOne(
                { _id: user._id },
                { $set: { proVerification: { license: String(lic).trim(), status: 'pending', submittedAt: new Date() } } }
              );
            } catch (e) { console.error('proVerification set (google) warning:', e.message); }
          }
          const UserService = require('../services/userService');
          const fresh = await new UserService(req.app.locals.db).findById(user._id);
          if (fresh) user = fresh;
        }
      } catch (e) {
        console.error('subscription init after Google signup warning:', e.message);
      }

      const token = authController.generateToken(user);
      try { await new UserService(req.app.locals.db).updateLastLogin(user._id); } catch (e) { /* best-effort */ }
      authController.recordAuthEvent(req, user._id, 'login', { method: 'google' });
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
