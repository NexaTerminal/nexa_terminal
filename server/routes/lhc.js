const express = require('express');
const router = express.Router();
const employmentController = require('../controllers/lhc/employmentController');
const employmentPart1Controller = require('../controllers/lhc/employmentPart1Controller');
const employmentPart2Controller = require('../controllers/lhc/employmentPart2Controller');
const employmentPart3Controller = require('../controllers/lhc/employmentPart3Controller');
const employmentPart4Controller = require('../controllers/lhc/employmentPart4Controller');
const healthAndSafetyController = require('../controllers/lhc/healthAndSafetyController');
const gdprController = require('../controllers/lhc/gdprController');
const generalController = require('../controllers/lhc/generalController');
const { authenticateJWT } = require('../middleware/auth');
const { requireVerification } = require('../middleware/verification');
const { checkCredits, deductCredits } = require('../middleware/creditMiddleware');

// All LHC routes require authentication and company verification
router.use(authenticateJWT);
router.use(requireVerification);

// Employment Relations Routes (Legacy - all 84 questions)
router.get('/employment/questions', employmentController.getQuestions);
router.post('/employment/evaluate', checkCredits(1), deductCredits('LHC_REPORT'), employmentController.evaluateCompliance);
router.get('/employment/history', employmentController.getAssessmentHistory);
router.get('/employment/assessment/:id', employmentController.getAssessmentById);

// Employment Part 1: Вработување и договори (30 questions)
router.get('/employment-part1/questions', employmentPart1Controller.getQuestions);
router.post('/employment-part1/evaluate', checkCredits(1), deductCredits('LHC_REPORT'), employmentPart1Controller.evaluateCompliance);
router.get('/employment-part1/history', employmentPart1Controller.getAssessmentHistory);
router.get('/employment-part1/assessment/:id', employmentPart1Controller.getAssessmentById);

// Employment Part 2: Заштита и престанок (18 questions)
router.get('/employment-part2/questions', employmentPart2Controller.getQuestions);
router.post('/employment-part2/evaluate', checkCredits(1), deductCredits('LHC_REPORT'), employmentPart2Controller.evaluateCompliance);
router.get('/employment-part2/history', employmentPart2Controller.getAssessmentHistory);
router.get('/employment-part2/assessment/:id', employmentPart2Controller.getAssessmentById);

// Employment Part 3: Работно време и одмор (29 questions)
router.get('/employment-part3/questions', employmentPart3Controller.getQuestions);
router.post('/employment-part3/evaluate', checkCredits(1), deductCredits('LHC_REPORT'), employmentPart3Controller.evaluateCompliance);
router.get('/employment-part3/history', employmentPart3Controller.getAssessmentHistory);
router.get('/employment-part3/assessment/:id', employmentPart3Controller.getAssessmentById);

// Employment Part 4: Посебна заштита (7 questions)
router.get('/employment-part4/questions', employmentPart4Controller.getQuestions);
router.post('/employment-part4/evaluate', checkCredits(1), deductCredits('LHC_REPORT'), employmentPart4Controller.evaluateCompliance);
router.get('/employment-part4/history', employmentPart4Controller.getAssessmentHistory);
router.get('/employment-part4/assessment/:id', employmentPart4Controller.getAssessmentById);

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
