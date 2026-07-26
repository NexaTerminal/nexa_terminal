const express = require('express');
const router = express.Router();
const employmentPart1Controller = require('../controllers/lhc/employmentPart1Controller');
const employmentPart2Controller = require('../controllers/lhc/employmentPart2Controller');
const employmentPart3Controller = require('../controllers/lhc/employmentPart3Controller');
const employmentPart4Controller = require('../controllers/lhc/employmentPart4Controller');
const healthAndSafetyController = require('../controllers/lhc/healthAndSafetyController');
const gdprController = require('../controllers/lhc/gdprController');
const generalController = require('../controllers/lhc/generalController');
const archivesController = require('../controllers/lhc/archivesController');
const protectionRescueController = require('../controllers/lhc/protectionRescueController');
const wasteManagementController = require('../controllers/lhc/wasteManagementController');
const taxProfitController = require('../controllers/lhc/taxProfitController');
const taxVatController = require('../controllers/lhc/taxVatController');
const taxPayrollController = require('../controllers/lhc/taxPayrollController');
const taxGeneralController = require('../controllers/lhc/taxGeneralController');
const { authenticateJWT } = require('../middleware/auth');
const { requireVerification } = require('../middleware/verification');
const { checkCredits, deductCredits } = require('../middleware/creditMiddleware');

// All LHC routes require authentication and company verification
router.use(authenticateJWT);
router.use(requireVerification);

// (Legacy 84-question /employment module retired — replaced by Part 1–4 below.
//  Its data file is still used by the General pool.)

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

// Archives Law Routes (Архивски и канцелариско работење)
router.get('/archives/questions', archivesController.getQuestions);
router.post('/archives/evaluate', checkCredits(1), deductCredits('LHC_REPORT'), archivesController.evaluateCompliance);
router.get('/archives/history', archivesController.getAssessmentHistory);
router.get('/archives/assessment/:id', archivesController.getAssessmentById);

// Protection, Rescue & Fire Prevention Routes (Заштита, спасување и превенција на пожари)
router.get('/protection-rescue/questions', protectionRescueController.getQuestions);
router.post('/protection-rescue/evaluate', checkCredits(1), deductCredits('LHC_REPORT'), protectionRescueController.evaluateCompliance);
router.get('/protection-rescue/history', protectionRescueController.getAssessmentHistory);
router.get('/protection-rescue/assessment/:id', protectionRescueController.getAssessmentById);

// Waste, Packaging & Batteries Routes (Управување со отпад, пакување и батерии)
router.get('/waste-management/questions', wasteManagementController.getQuestions);
router.post('/waste-management/evaluate', checkCredits(1), deductCredits('LHC_REPORT'), wasteManagementController.evaluateCompliance);
router.get('/waste-management/history', wasteManagementController.getAssessmentHistory);
router.get('/waste-management/assessment/:id', wasteManagementController.getAssessmentById);

// Даночна усогласеност — Под-модул 1: Данок на добивка (tax_profit)
router.get('/tax-profit/questions', taxProfitController.getQuestions);
router.post('/tax-profit/evaluate', checkCredits(1), deductCredits('LHC_REPORT'), taxProfitController.evaluateCompliance);
router.get('/tax-profit/history', taxProfitController.getAssessmentHistory);
router.get('/tax-profit/assessment/:id', taxProfitController.getAssessmentById);

// Даночна усогласеност — Под-модул 2: ДДВ (tax_vat)
router.get('/tax-vat/questions', taxVatController.getQuestions);
router.post('/tax-vat/evaluate', checkCredits(1), deductCredits('LHC_REPORT'), taxVatController.evaluateCompliance);
router.get('/tax-vat/history', taxVatController.getAssessmentHistory);
router.get('/tax-vat/assessment/:id', taxVatController.getAssessmentById);

// Даночна усогласеност — Под-модул 3: Плати, придонеси и персонален данок (tax_payroll)
router.get('/tax-payroll/questions', taxPayrollController.getQuestions);
router.post('/tax-payroll/evaluate', checkCredits(1), deductCredits('LHC_REPORT'), taxPayrollController.evaluateCompliance);
router.get('/tax-payroll/history', taxPayrollController.getAssessmentHistory);
router.get('/tax-payroll/assessment/:id', taxPayrollController.getAssessmentById);

// Даночна усогласеност — Под-модул 4: Општа даночна дисциплина (tax_general)
router.get('/tax-general/questions', taxGeneralController.getQuestions);
router.post('/tax-general/evaluate', checkCredits(1), deductCredits('LHC_REPORT'), taxGeneralController.evaluateCompliance);
router.get('/tax-general/history', taxGeneralController.getAssessmentHistory);
router.get('/tax-general/assessment/:id', taxGeneralController.getAssessmentById);

// Future routes for other categories
// router.get('/trade/questions', tradeController.getQuestions);
// router.get('/mobbing/questions', mobbingController.getQuestions);

module.exports = router;
