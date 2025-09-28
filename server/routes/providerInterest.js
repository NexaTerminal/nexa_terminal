/**
 * Provider Interest Routes - Interest expression workflow endpoints
 * Handles provider interest expressions, token validation, and admin management
 */

const express = require('express');
const router = express.Router();
const ProviderInterestController = require('../controllers/providerInterestController');
const { authenticateJWT } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// Initialize controller (will be done in server.js)
let providerInterestController;

const initializeController = (database) => {
  providerInterestController = new ProviderInterestController(database);
};

// ==================== PUBLIC PROVIDER ENDPOINTS ====================

/**
 * GET /provider-interest/:token/form
 * Get interest expression form by token
 * Public endpoint - no authentication required
 * Used by providers clicking unique links in emails
 */
router.get('/:token/form', async (req, res) => {
  try {
    if (!providerInterestController) {
      return res.status(500).json({
        success: false,
        message: 'Серверот не е иницијализиран правилно'
      });
    }
    await providerInterestController.getInterestExpressionForm(req, res);
  } catch (error) {
    console.error('Route error in get interest form:', error);
    res.status(500).json({
      success: false,
      message: 'Серверска грешка при добивање на формуларот'
    });
  }
});

/**
 * POST /provider-interest/:token/submit
 * Submit provider interest expression
 * Public endpoint - no authentication required
 * Body: { availability, budgetAlignment, proposal, portfolio?, preferredContact?, nextSteps? }
 */
router.post('/:token/submit', async (req, res) => {
  try {
    if (!providerInterestController) {
      return res.status(500).json({
        success: false,
        message: 'Серверот не е иницијализиран правилно'
      });
    }
    await providerInterestController.submitProviderInterest(req, res);
  } catch (error) {
    console.error('Route error in submit interest:', error);
    res.status(500).json({
      success: false,
      message: 'Серверска грешка при поднесување на интересот'
    });
  }
});

// ==================== ADMIN MANAGEMENT ENDPOINTS ====================

/**
 * GET /provider-interest/admin
 * Get all provider interests for admin management
 * Requires: Authentication, Admin
 * Query params: status, providerId, viewedByClient, page, limit
 */
router.get('/admin',
  authenticateJWT,
  requireAdmin,
  async (req, res) => {
    try {
      if (!providerInterestController) {
        return res.status(500).json({
          success: false,
          message: 'Серверот не е иницијализиран правилно'
        });
      }
      await providerInterestController.getAllInterests(req, res);
    } catch (error) {
      console.error('Route error in get all interests:', error);
      res.status(500).json({
        success: false,
        message: 'Серверска грешка при добивање на интересите'
      });
    }
  }
);

/**
 * GET /provider-interest/admin/request/:requestId
 * Get interests for specific request
 * Requires: Authentication, Admin
 */
router.get('/admin/request/:requestId',
  authenticateJWT,
  requireAdmin,
  async (req, res) => {
    try {
      if (!providerInterestController) {
        return res.status(500).json({
          success: false,
          message: 'Серверот не е иницијализиран правилно'
        });
      }
      await providerInterestController.getInterestsByRequest(req, res);
    } catch (error) {
      console.error('Route error in get interests by request:', error);
      res.status(500).json({
        success: false,
        message: 'Серверска грешка при добивање на интересите'
      });
    }
  }
);

/**
 * PUT /provider-interest/admin/:interestId/mark-viewed
 * Mark interest as viewed by client
 * Requires: Authentication, Admin
 */
router.put('/admin/:interestId/mark-viewed',
  authenticateJWT,
  requireAdmin,
  async (req, res) => {
    try {
      if (!providerInterestController) {
        return res.status(500).json({
          success: false,
          message: 'Серверот не е иницијализиран правилно'
        });
      }
      await providerInterestController.markInterestAsViewed(req, res);
    } catch (error) {
      console.error('Route error in mark interest viewed:', error);
      res.status(500).json({
        success: false,
        message: 'Серверска грешка при означување на интересот'
      });
    }
  }
);

/**
 * GET /provider-interest/admin/statistics
 * Get interest statistics for admin dashboard
 * Requires: Authentication, Admin
 */
router.get('/admin/statistics',
  authenticateJWT,
  requireAdmin,
  async (req, res) => {
    try {
      if (!providerInterestController) {
        return res.status(500).json({
          success: false,
          message: 'Серверот не е иницијализиран правилно'
        });
      }
      await providerInterestController.getInterestStatistics(req, res);
    } catch (error) {
      console.error('Route error in get interest statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Серверска грешка при добивање на статистиките'
      });
    }
  }
);

/**
 * POST /provider-interest/admin/cleanup-expired
 * Cleanup expired tokens (admin utility)
 * Requires: Authentication, Admin
 */
router.post('/admin/cleanup-expired',
  authenticateJWT,
  requireAdmin,
  async (req, res) => {
    try {
      if (!providerInterestController) {
        return res.status(500).json({
          success: false,
          message: 'Серверот не е иницијализиран правилно'
        });
      }
      await providerInterestController.cleanupExpiredTokens(req, res);
    } catch (error) {
      console.error('Route error in cleanup expired tokens:', error);
      res.status(500).json({
        success: false,
        message: 'Серверска грешка при чистење на токените'
      });
    }
  }
);

// ==================== CLIENT NOTIFICATION ENDPOINTS ====================

/**
 * POST /provider-interest/admin/notify-client
 * Send client notification about provider interest
 * Requires: Authentication, Admin
 * Body: { requestId, providerId, customMessage? }
 */
router.post('/admin/notify-client',
  authenticateJWT,
  requireAdmin,
  async (req, res) => {
    try {
      if (!providerInterestController) {
        return res.status(500).json({
          success: false,
          message: 'Серверот не е иницијализиран правилно'
        });
      }
      await providerInterestController.sendClientNotification(req, res);
    } catch (error) {
      console.error('Route error in send client notification:', error);
      res.status(500).json({
        success: false,
        message: 'Серверска грешка при пратење на известувањето'
      });
    }
  }
);

// ==================== QUALITY & ANALYTICS ENDPOINTS ====================

/**
 * GET /provider-interest/admin/quality-metrics
 * Get provider response quality metrics
 * Requires: Authentication, Admin
 * Query params: providerId?
 */
router.get('/admin/quality-metrics',
  authenticateJWT,
  requireAdmin,
  async (req, res) => {
    try {
      if (!providerInterestController) {
        return res.status(500).json({
          success: false,
          message: 'Серверот не е иницијализиран правилно'
        });
      }
      await providerInterestController.getResponseQualityMetrics(req, res);
    } catch (error) {
      console.error('Route error in get quality metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Серверска грешка при добивање на метриките'
      });
    }
  }
);

// ==================== ERROR HANDLING MIDDLEWARE ====================

router.use((error, req, res, next) => {
  console.error('Provider Interest Routes Error:', error);
  res.status(500).json({
    success: false,
    message: 'Неочекувана серверска грешка'
  });
});

module.exports = { router, initializeController };