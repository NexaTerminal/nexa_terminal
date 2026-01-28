/**
 * Cyber Security Health Check Routes
 *
 * All routes require JWT authentication and company verification
 */

const express = require('express');
const router = express.Router();
const cyberController = require('../controllers/chc/cyberController');
const { authenticateJWT } = require('../middleware/auth');
const { requireVerification } = require('../middleware/verification');
const { checkCredits, deductCredits } = require('../middleware/creditMiddleware');

// All CHC routes require authentication and company verification
router.use(authenticateJWT);
router.use(requireVerification);

// Get list of industries
router.get('/industries', cyberController.getIndustries);

// Get questions for specific industry
router.get('/questions', cyberController.getQuestions);

// Submit assessment for evaluation (costs 1 credit)
router.post(
  '/evaluate',
  checkCredits(1),
  deductCredits('CHC_REPORT'),
  cyberController.evaluateMarketing
);

// Get user's assessment history
router.get('/history', cyberController.getAssessmentHistory);

// Get specific assessment by ID
router.get('/assessment/:id', cyberController.getAssessmentById);

module.exports = router;
