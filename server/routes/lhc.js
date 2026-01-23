const express = require('express');
const router = express.Router();
const employmentController = require('../controllers/lhc/employmentController');
const healthAndSafetyController = require('../controllers/lhc/healthAndSafetyController');
const gdprController = require('../controllers/lhc/gdprController');
const generalController = require('../controllers/lhc/generalController');
const { authenticateJWT } = require('../middleware/auth');
const { requireVerification } = require('../middleware/verification');
const { checkCredits, deductCredits } = require('../middleware/creditMiddleware');

// All LHC routes require authentication and company verification
router.use(authenticateJWT);
router.use(requireVerification);

// Employment Relations Routes
router.get('/employment/questions', employmentController.getQuestions);
router.post('/employment/evaluate', checkCredits(1), deductCredits('LHC_REPORT'), employmentController.evaluateCompliance);
router.get('/employment/history', employmentController.getAssessmentHistory);
router.get('/employment/assessment/:id', employmentController.getAssessmentById);

// Health and Safety Routes (Безбедност и здравје при работа)
router.get('/health-safety/questions', healthAndSafetyController.getQuestions);
router.post('/health-safety/evaluate', checkCredits(1), deductCredits('LHC_REPORT'), healthAndSafetyController.evaluateCompliance);
router.get('/health-safety/history', healthAndSafetyController.getAssessmentHistory);
router.get('/health-safety/assessment/:id', healthAndSafetyController.getAssessmentById);

// GDPR / Personal Data Protection Routes (Лични податоци)
router.get('/gdpr/questions', gdprController.getQuestions);
router.post('/gdpr/evaluate', checkCredits(1), deductCredits('LHC_REPORT'), gdprController.evaluateCompliance);
router.get('/gdpr/history', gdprController.getAssessmentHistory);
router.get('/gdpr/assessment/:id', gdprController.getAssessmentById);

// General LHC Routes (Општ правен здравствен преглед - 20 случајни прашања)
router.get('/general/questions', generalController.getQuestions);
router.post('/general/evaluate', checkCredits(1), deductCredits('LHC_REPORT'), generalController.evaluateCompliance);
router.get('/general/history', generalController.getAssessmentHistory);
router.get('/general/assessment/:id', generalController.getAssessmentById);

// Future routes for other categories
// router.get('/trade/questions', tradeController.getQuestions);
// router.get('/mobbing/questions', mobbingController.getQuestions);

module.exports = router;
