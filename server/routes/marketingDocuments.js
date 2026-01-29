const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const { requireVerifiedCompany } = require('../middleware/verificationMiddleware');
const { checkCredits, deductCredits } = require('../middleware/creditMiddleware');

// Marketing Document Controllers
const marketingPerformanceReportController = require('../controllers/marketingDocuments/marketingPerformanceReportController');

/**
 * Marketing Documents Routes
 * All routes are protected by authentication and company verification
 * Each document generation costs 1 credit
 */

// Marketing Performance Report
router.post(
  '/performance-report',
  authenticateJWT,
  requireVerifiedCompany,
  checkCredits(1),
  deductCredits('DOCUMENT_GENERATION'),
  marketingPerformanceReportController
);

// Add more marketing document routes here as needed

module.exports = router;
