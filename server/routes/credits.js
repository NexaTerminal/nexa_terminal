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
 * Bulletproof getCreditService. The /credits/* endpoints must always work
 * as long as the database is connected — they should NEVER 503 just
 * because some other init step (chatbot, marketplace, etc.) crashed.
 *
 * Resolution order:
 *   1. Reuse app.locals.creditService if already built.
 *   2. If only db is available, lazy-build userService too, then creditService.
 *   3. Only if even db is missing do we 503 — that means the entire DB
 *      connection failed and nothing in the app can work anyway.
 */
function getCreditService(req, res) {
  let creditService = req.app.locals.creditService;
  if (creditService) return creditService;

  const db = req.app.locals.db;
  if (!db) {
    console.error('❌ [Credits] app.locals.db is missing — DB connection failed');
    res.status(503).json({
      error: 'Database unavailable',
      code: 'DB_UNAVAILABLE',
      message: 'Please try again in a moment'
    });
    return null;
  }

  try {
    let userService = req.app.locals.userService;
    if (!userService) {
      console.warn('⚠️  [Credits] userService missing on app.locals — lazy-building');
      const UserService = require('../services/userService');
      userService = new UserService(db);
      req.app.locals.userService = userService;
    }

    console.warn('⚠️  [Credits] creditService missing on app.locals — lazy-building');
    const CreditService = require('../services/creditService');
    creditService = new CreditService(db, userService);
    req.app.locals.creditService = creditService;

    // Best-effort missed-reset catch-up, fire-and-forget so the request
    // doesn't wait on it.
    creditService.checkAndPerformMissedResets().catch(err =>
      console.error('[Credits] lazy missed-reset check failed:', err.message)
    );

    return creditService;
  } catch (err) {
    console.error('❌ [Credits] lazy build failed:', err.message);
    console.error(err.stack);
    res.status(500).json({
      error: 'Credit system error',
      code: 'CREDIT_SERVICE_ERROR',
      message: err.message
    });
    return null;
  }
}

// ============ DIAGNOSTICS ============

/**
 * GET /api/credits/_diagnostics
 * Public endpoint to verify which build is running and what's initialized.
 * Returns no user data — safe to expose.
 */
router.get('/_diagnostics', (req, res) => {
  // Try to require each suspect module so failures surface in diagnostics
  // instead of being buried in Railway startup logs.
  const probes = {};
  const probeModule = (label, path) => {
    try {
      require(path);
      probes[label] = 'ok';
    } catch (err) {
      probes[label] = `FAIL: ${err.message}`;
    }
  };
  probeModule('chatbot/ChatBotService', '../chatbot/ChatBotService');
  probeModule('chatbot/LegalDataHunterService', '../chatbot/LegalDataHunterService');
  probeModule('chatbot/MarketingBotService', '../chatbot/MarketingBotService');
  probeModule('routes/chatbot', './chatbot');
  probeModule('routes/marketing-bot', './marketing-bot');
  probeModule('routes/contractAnalysis', './contractAnalysis');
  probeModule('contractAnalysis/ContractAnalysisService', '../contractAnalysis/ContractAnalysisService');

  res.json({
    build: 'lazy-init-v3',
    initialized: {
      db: !!req.app.locals.db,
      userService: !!req.app.locals.userService,
      creditService: !!req.app.locals.creditService,
      referralService: !!req.app.locals.referralService,
      chatBotService: !!req.app.locals.chatBotService,
      marketingBotService: !!req.app.locals.marketingBotService,
      contractAnalysisService: !!req.app.locals.contractAnalysisService,
    },
    moduleProbes: probes,
    nodeVersion: process.version,
    env: {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasQdrant: !!process.env.QDRANT_URL,
      hasLDH: !!process.env.LDH_API_KEY,
    },
    timestamp: new Date().toISOString(),
  });
});

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
