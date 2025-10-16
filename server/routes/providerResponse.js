/**
 * Provider Response Routes - Public API for provider responses
 * No authentication required - security handled through tokens
 */

const express = require('express');
const router = express.Router();
const ProviderResponseController = require('../controllers/providerResponseController');

// Initialize controller with database connection
let providerResponseController;

const initializeController = (req, res, next) => {
  if (!providerResponseController) {
    providerResponseController = new ProviderResponseController(req.app.locals.db);
  }
  next();
};

// Apply controller initialization middleware to all routes
router.use(initializeController);

// Apply rate limiting to all routes
router.use((req, res, next) => {
  if (providerResponseController && typeof providerResponseController.checkRateLimit === 'function') {
    return providerResponseController.checkRateLimit(req, res, next);
  }
  next();
});

/**
 * Health check endpoint
 * GET /api/provider-response/health
 */
router.get('/health', async (req, res) => {
  try {
    await providerResponseController.healthCheck(req, res);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Validate provider response token
 * GET /api/provider-response/validate/:token
 */
router.get('/validate/:token', async (req, res) => {
  try {
    await providerResponseController.validateToken(req, res);
  } catch (error) {
    console.error('Token validation route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Submit provider response
 * POST /api/provider-response/submit/:token
 */
router.post('/submit/:token', async (req, res) => {
  try {
    await providerResponseController.submitResponse(req, res);
  } catch (error) {
    console.error('Response submission route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get response statistics (for monitoring)
 * GET /api/provider-response/statistics
 * Note: This could be protected with admin auth in the future
 */
router.get('/statistics', async (req, res) => {
  try {
    await providerResponseController.getResponseStatistics(req, res);
  } catch (error) {
    console.error('Statistics route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Error handling middleware for this router
router.use((error, req, res, next) => {
  console.error('Provider response route error:', error);

  // Don't expose internal errors to clients
  res.status(500).json({
    success: false,
    message: 'Дојде до неочекувана грешка. Ве молиме обидете се повторно.'
  });
});

module.exports = router;