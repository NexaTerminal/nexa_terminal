// server/middleware/creditMiddleware.js

const creditConfig = require('../config/creditConfig');
const { ROLES } = require('../constants/roles');

/**
 * Resolve the "credit bearer" — for sub-seats, that's the parent admin_user;
 * for everyone else, that's the user themselves. The bearer's _id is what
 * we check / deduct against.
 *
 * Falls back to the caller's own _id on any error so that we never accidentally
 * block a real user because of a misconfigured parent linkage.
 */
async function resolveCreditBearerId(user, db) {
  if (!user) return null;
  if (user.role !== ROLES.SUB_SEAT) return user._id;
  if (!user.parentSuperUserId) return user._id;
  try {
    const { ObjectId } = require('mongodb');
    const parent = await db.collection('users').findOne(
      { _id: user.parentSuperUserId instanceof ObjectId ? user.parentSuperUserId : new ObjectId(user.parentSuperUserId) },
      { projection: { _id: 1, role: 1 } }
    );
    return parent ? parent._id : user._id;
  } catch (e) {
    console.error('[creditMiddleware] resolveCreditBearerId failed:', e.message);
    return user._id;
  }
}

/**
 * Credit Middleware
 *
 * Provides middleware functions for checking and deducting credits
 * during API requests. Used to enforce credit limits on premium features.
 */

/**
 * Check if user has sufficient credits before processing request
 * @param {number} cost - Number of credits required (default: 1)
 * @returns {Function} Express middleware function
 */
const checkCredits = (cost = 1) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const creditService = req.app.locals.creditService;

      if (!creditService) {
        console.error('[creditMiddleware] CreditService not initialized');
        return res.status(500).json({
          error: 'Credit system temporarily unavailable',
          code: 'CREDIT_SERVICE_UNAVAILABLE'
        });
      }

      // For sub_seat users, redirect credit ops to the parent admin_user's pool.
      const userId = await resolveCreditBearerId(req.user, req.app.locals.database || req.app.locals.db);
      req.creditBearerId = userId;
      req.creditPooled = String(userId) !== String(req.user._id);

      // Check if user has sufficient credits
      const hasCredits = await creditService.checkBalance(userId, cost);

      if (!hasCredits) {
        const credits = await creditService.getUserCredits(userId);

        return res.status(402).json({
          error: 'Insufficient credits',
          code: 'INSUFFICIENT_CREDITS',
          required: cost,
          available: credits.balance,
          nextResetDate: credits.nextResetDate,
          message: `You need ${cost} credit(s) but only have ${credits.balance}. Credits reset every Monday at 7:00 AM.`
        });
      }

      // Store cost in request for later deduction
      req.creditCost = cost;
      req.creditsChecked = true;

      next();
    } catch (error) {
      console.error('[creditMiddleware] Error checking credits:', error);
      res.status(500).json({
        error: 'Error checking credits',
        code: 'CREDIT_CHECK_ERROR',
        message: error.message
      });
    }
  };
};

/**
 * Deduct credits after successful request completion
 * @param {string} type - Transaction type (DOCUMENT_GENERATION, AI_QUESTION, LHC_REPORT)
 * @returns {Function} Express middleware function
 */
const deductCredits = (type) => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send.bind(res);
    const originalJson = res.json.bind(res);

    // Track if credits were deducted
    let creditsDeducted = false;
    let transactionId = null;

    // Wrap send function to deduct credits on successful response
    const deductAndSend = async (body) => {
      if (!creditsDeducted && req.creditsChecked && res.statusCode < 400) {
        try {
          // Honor the credit-bearer resolution from checkCredits (sub-seats → parent's pool).
          const userId = req.creditBearerId || req.user._id;
          const cost = req.creditCost || 1;
          const creditService = req.app.locals.creditService;

          const metadata = {
            documentType: req.body?.documentType || req.params?.documentType,
            endpoint: req.originalUrl,
            ipAddress: req.ip || req.connection.remoteAddress
          };

          // Add conversation ID for chatbot questions
          if (type === 'AI_QUESTION' && req.body?.conversationId) {
            metadata.conversationId = req.body.conversationId;
          }

          // Add assessment ID for LHC reports
          if (type === 'LHC_REPORT' && body?.assessmentId) {
            metadata.assessmentId = body.assessmentId;
          }

          const result = await creditService.deductCredits(userId, cost, type, metadata);

          creditsDeducted = true;
          transactionId = result.transaction._id;

          console.log('[creditMiddleware] ✅ Credits deducted:', {
            userId: userId.toString(),
            cost,
            newBalance: result.newBalance,
            type
          });

          // Attach credit info to response body ONLY if it's JSON (not binary data)
          if (typeof body === 'object' && body !== null && !Buffer.isBuffer(body)) {
            try {
              const bodyObj = typeof body === 'string' ? JSON.parse(body) : body;
              bodyObj.creditsRemaining = result.newBalance;
              bodyObj.creditsUsed = cost;
              body = JSON.stringify(bodyObj);
            } catch (e) {
              // If parsing fails, skip attaching credit info
            }
          }

          req.creditTransactionId = transactionId;
          req.creditDeducted = true;

        } catch (error) {
          console.error('[creditMiddleware] Error deducting credits:', error);
          // Don't fail the request if credit deduction fails
          // Log for manual review
        }
      }

      return body;
    };

    // Override send methods
    res.send = async function(body) {
      const processedBody = await deductAndSend(body);
      return originalSend(processedBody);
    };

    res.json = async function(body) {
      const processedBody = await deductAndSend(JSON.stringify(body));
      return originalJson(JSON.parse(processedBody));
    };

    next();
  };
};

/**
 * Combined middleware: check AND deduct credits in one step
 * Use this for simple endpoints that don't need separate check/deduct
 * @param {number} cost - Number of credits required
 * @param {string} type - Transaction type
 * @returns {Array<Function>} Array of middleware functions
 */
const requireCredits = (cost, type) => {
  return [checkCredits(cost), deductCredits(type)];
};

/**
 * Refund credits if operation fails
 * Use this middleware BEFORE request processing to set up error handling
 * @returns {Function} Express middleware function
 */
const refundOnError = () => {
  return async (req, res, next) => {
    // Store original error handler
    const originalSend = res.send.bind(res);
    const originalJson = res.json.bind(res);

    // Wrap response methods to detect errors
    const checkAndRefund = async (body, statusCode) => {
      if (statusCode >= 400 && req.creditDeducted && req.creditTransactionId) {
        try {
          const creditService = req.app.locals.creditService;
          const userId = req.creditBearerId || req.user._id;

          const errorMessage = typeof body === 'object' && body.error
            ? body.error
            : 'Request failed';

          await creditService.refundCredits(
            userId,
            req.creditTransactionId,
            `Refund for failed operation: ${errorMessage}`
          );

          console.log(`[creditMiddleware] Refunded credits for failed request: ${req.originalUrl}`);

        } catch (error) {
          console.error('[creditMiddleware] Error refunding credits:', error);
        }
      }
    };

    res.send = async function(body) {
      await checkAndRefund(body, res.statusCode);
      return originalSend(body);
    };

    res.json = async function(body) {
      await checkAndRefund(body, res.statusCode);
      return originalJson(body);
    };

    next();
  };
};

/**
 * Get user's current credit balance
 * Adds credit info to req.credits
 * @returns {Function} Express middleware function
 */
const attachCredits = () => {
  return async (req, res, next) => {
    try {
      if (req.user && req.user._id) {
        const creditService = req.app.locals.creditService;
        if (creditService) {
          req.credits = await creditService.getUserCredits(req.user._id);
        }
      }
      next();
    } catch (error) {
      console.error('[creditMiddleware] Error attaching credits:', error);
      // Don't fail the request
      next();
    }
  };
};

module.exports = {
  checkCredits,
  deductCredits,
  requireCredits,
  refundOnError,
  attachCredits
};
