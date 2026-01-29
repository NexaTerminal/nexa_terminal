const express = require('express');
const router = express.Router();
const marketingController = require('../controllers/mhc/marketingController');
const { authenticateJWT } = require('../middleware/auth');
const { requireVerification } = require('../middleware/verification');
const { checkCredits, deductCredits } = require('../middleware/creditMiddleware');

// All MHC routes require authentication and company verification
router.use(authenticateJWT);
router.use(requireVerification);

// Get available industries
router.get('/industries', marketingController.getIndustries);

// Marketing Health Check Routes
router.get('/questions', marketingController.getQuestions);
router.post('/evaluate', checkCredits(1), deductCredits('MHC_REPORT'), marketingController.evaluateMarketing);
router.get('/history', marketingController.getAssessmentHistory);
router.get('/assessment/:id', marketingController.getAssessmentById);

module.exports = router;
