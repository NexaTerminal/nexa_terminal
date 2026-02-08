const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hhc/hrController');
const { authenticateJWT } = require('../middleware/auth');
const { requireVerification } = require('../middleware/verification');
const { checkCredits, deductCredits } = require('../middleware/creditMiddleware');

// All HHC routes require authentication and company verification
router.use(authenticateJWT);
router.use(requireVerification);

// HR & Operational Health Check Routes
router.get('/hr/questions', hrController.getQuestions);
router.post('/hr/evaluate', checkCredits(1), deductCredits('HHC_REPORT'), hrController.evaluateCompliance);
router.get('/hr/history', hrController.getAssessmentHistory);
router.get('/hr/assessment/:id', hrController.getAssessmentById);

module.exports = router;
