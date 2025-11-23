// server/routes/referrals.js

const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');

/**
 * Referral System Routes
 *
 * Provides API endpoints for users to manage their referral codes,
 * send invitations, track referrals, and view referral statistics.
 */

// ============ REFERRAL CODE MANAGEMENT ============

/**
 * GET /api/referrals/my-code
 * Get or create the current user's referral code
 */
router.get('/my-code', authenticateJWT, async (req, res) => {
  try {
    const referralService = req.app.locals.referralService;
    const referralCode = await referralService.createReferralCode(req.user._id);

    res.json({
      success: true,
      referralCode,
      referralLink: `${process.env.CLIENT_URL || 'http://localhost:3000'}/register?ref=${referralCode}`
    });
  } catch (error) {
    console.error('Error getting referral code:', error);
    res.status(500).json({
      error: 'Failed to get referral code',
      message: error.message
    });
  }
});

/**
 * GET /api/referrals/stats
 * Get referral statistics for current user
 */
router.get('/stats', authenticateJWT, async (req, res) => {
  try {
    const referralService = req.app.locals.referralService;
    const stats = await referralService.getReferralStats(req.user._id);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.status(500).json({
      error: 'Failed to fetch referral statistics',
      message: error.message
    });
  }
});

// ============ INVITATION MANAGEMENT ============

/**
 * POST /api/referrals/invite
 * Send invitation emails to new users
 * Body: { emails: ['email1@example.com', 'email2@example.com'] }
 */
router.post('/invite', authenticateJWT, async (req, res) => {
  try {
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Please provide an array of email addresses'
      });
    }

    console.log(`[Referrals] Sending ${emails.length} invitation(s) for user ${req.user._id}`);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(email => !emailRegex.test(email));

    if (invalidEmails.length > 0) {
      return res.status(400).json({
        error: 'Invalid email addresses',
        invalidEmails
      });
    }

    // Limit to 10 emails per request
    if (emails.length > 10) {
      return res.status(400).json({
        error: 'Too many emails',
        message: 'Maximum 10 email addresses per request'
      });
    }

    const referralService = req.app.locals.referralService;
    const results = await referralService.sendInvitations(req.user._id, emails);

    console.log(`[Referrals] Sent: ${results.sent.length}, Failed: ${results.failed.length}`);

    res.json({
      success: true,
      message: `Invitations sent to ${results.sent.length} of ${emails.length} emails`,
      results
    });
  } catch (error) {
    console.error('[Referrals] Error sending invitations:', error.message);
    res.status(500).json({
      error: 'Failed to send invitations',
      message: error.message
    });
  }
});

/**
 * GET /api/referrals/validate/:code
 * Validate a referral code
 * Public endpoint - no authentication required
 */
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const userService = req.app.locals.userService;
    const referrer = await userService.findByReferralCode(code);

    if (!referrer) {
      return res.status(404).json({
        valid: false,
        message: 'Invalid referral code'
      });
    }

    res.json({
      valid: true,
      referrerInfo: {
        companyName: referrer.companyInfo?.companyName || 'Nexa Terminal User',
        isVerified: referrer.isVerified
      }
    });
  } catch (error) {
    console.error('Error validating referral code:', error);
    res.status(500).json({
      error: 'Failed to validate referral code',
      message: error.message
    });
  }
});

module.exports = router;
