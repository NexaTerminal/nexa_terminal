// server/routes/credits.js

const express = require('express');
const router = express.Router();
const { authenticateJWT, isAdmin } = require('../middleware/auth');

/**
 * Credit System Routes
 *
 * Provides API endpoints for users to view their credit balance,
 * transaction history, usage statistics, and for admins to manage credits.
 */

/**
 * Helper function to get creditService with validation
 */
function getCreditService(req, res) {
  const creditService = req.app.locals.creditService;
  if (!creditService) {
    console.error('❌ CreditService not initialized - app.locals.creditService is undefined');
    res.status(503).json({
      error: 'Credit system temporarily unavailable',
      code: 'CREDIT_SERVICE_UNAVAILABLE',
      message: 'Please try again in a moment'
    });
    return null;
  }
  return creditService;
}

// ============ USER ENDPOINTS ============

/**
 * GET /api/credits/balance
 * Get current user's credit balance and allocation
 */
router.get('/balance', authenticateJWT, async (req, res) => {
  try {
    console.log(`[Credits] Fetching balance for user: ${req.user._id}`);

    const creditService = getCreditService(req, res);
    if (!creditService) {
      console.error('[Credits] CreditService not available');
      return;
    }

    const credits = await creditService.getUserCredits(req.user._id);
    console.log(`[Credits] Retrieved credits for user ${req.user._id}:`, credits);

    res.json({
      success: true,
      credits
    });
  } catch (error) {
    console.error('[Credits] Error fetching credit balance:', error);
    console.error('[Credits] Stack:', error.stack);
    res.status(500).json({
      error: 'Failed to fetch credit balance',
      message: error.message
    });
  }
});

/**
 * GET /api/credits/transactions
 * Get user's credit transaction history
 * Query params: limit, offset, type, startDate, endDate
 */
router.get('/transactions', authenticateJWT, async (req, res) => {
  try {
    const creditService = getCreditService(req, res);
    if (!creditService) return;

    const {
      limit = 50,
      offset = 0,
      type,
      startDate,
      endDate
    } = req.query;

    const result = await creditService.getTransactionHistory(req.user._id, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      type,
      startDate,
      endDate
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({
      error: 'Failed to fetch transaction history',
      message: error.message
    });
  }
});

/**
 * GET /api/credits/stats
 * Get weekly usage statistics for current user
 */
router.get('/stats', authenticateJWT, async (req, res) => {
  try {
    const creditService = getCreditService(req, res);
    if (!creditService) return;

    const stats = await creditService.getWeeklyUsageStats(req.user._id);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({
      error: 'Failed to fetch usage statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/credits/info
 * Get credit system information and configuration
 */
router.get('/info', authenticateJWT, async (req, res) => {
  try {
    const creditConfig = require('../config/creditConfig');
    const creditService = getCreditService(req, res);
    if (!creditService) return;

    const userCredits = await creditService.getUserCredits(req.user._id);

    res.json({
      success: true,
      config: {
        weeklyAllocation: creditConfig.WEEKLY_ALLOCATION,
        resetDay: creditConfig.RESET_DAY,
        resetHour: creditConfig.RESET_HOUR,
        costs: creditConfig.CREDIT_COSTS,
        referralBonus: creditConfig.REFERRAL_CONFIG.BONUS_CREDITS,
        minInvitesForBonus: creditConfig.REFERRAL_CONFIG.MIN_INVITES_FOR_BONUS,
        nextResetDate: creditConfig.getNextResetDate()
      },
      userCredits
    });
  } catch (error) {
    console.error('Error fetching credit info:', error);
    res.status(500).json({
      error: 'Failed to fetch credit information',
      message: error.message
    });
  }
});

// ============ ADMIN ENDPOINTS ============

/**
 * POST /api/credits/adjust
 * Manually adjust user credits (admin only)
 * Body: { userId, amount, reason }
 */
router.post('/adjust', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;

    if (!userId || amount === undefined || !reason) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userId', 'amount', 'reason']
      });
    }

    const creditService = getCreditService(req, res);
    if (!creditService) return;

    const result = await creditService.adjustCredits(
      userId,
      parseInt(amount),
      req.user._id,
      reason
    );

    res.json({
      success: true,
      message: 'Credits adjusted successfully',
      transaction: result.transaction,
      newBalance: result.newBalance
    });
  } catch (error) {
    console.error('Error adjusting credits:', error);
    res.status(500).json({
      error: 'Failed to adjust credits',
      message: error.message
    });
  }
});

/**
 * GET /api/credits/all-users
 * Get all users' credit information (admin only)
 * Query params: page, limit, sortBy
 */
router.get('/all-users', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, sortBy = 'balance' } = req.query;

    const creditService = getCreditService(req, res);
    if (!creditService) return;

    const result = await creditService.getAllUserCredits({
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching all user credits:', error);
    res.status(500).json({
      error: 'Failed to fetch user credits',
      message: error.message
    });
  }
});

/**
 * GET /api/credits/system-stats
 * Get system-wide credit statistics (admin only)
 */
router.get('/system-stats', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const creditService = getCreditService(req, res);
    if (!creditService) return;

    const stats = await creditService.getSystemStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({
      error: 'Failed to fetch system statistics',
      message: error.message
    });
  }
});

/**
 * POST /api/credits/reset-user
 * Manually reset credits for a specific user (admin only)
 * Body: { userId }
 */
router.post('/reset-user', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    const creditService = getCreditService(req, res);
    if (!creditService) return;

    await creditService.resetWeeklyCredits(userId);

    const updatedCredits = await creditService.getUserCredits(userId);

    res.json({
      success: true,
      message: 'Credits reset successfully',
      credits: updatedCredits
    });
  } catch (error) {
    console.error('Error resetting user credits:', error);
    res.status(500).json({
      error: 'Failed to reset user credits',
      message: error.message
    });
  }
});

/**
 * POST /api/credits/reset-all
 * Manually trigger weekly reset for all users (admin only)
 * Use with caution - should only be used for testing or emergency resets
 */
router.post('/reset-all', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const creditService = getCreditService(req, res);
    if (!creditService) return;

    const result = await creditService.resetAllUserCredits();

    res.json({
      success: true,
      message: 'All user credits reset successfully',
      ...result
    });
  } catch (error) {
    console.error('Error resetting all credits:', error);
    res.status(500).json({
      error: 'Failed to reset all credits',
      message: error.message
    });
  }
});

module.exports = router;
