const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const { requireVerifiedCompany } = require('../middleware/verificationMiddleware');
const generate = require('../controllers/autoDocuments/consentForPersonalDataProcessingController');
const terminationAgreementController = require('../controllers/autoDocuments/terminationAgreementController');
const annualLeaveDecisionController = require('../controllers/autoDocuments/annualLeaveDecisionController');
const confirmationOfEmploymentController = require('../controllers/autoDocuments/confirmationOfEmploymentController');
const employmentAgreementController = require('../controllers/autoDocuments/employmentAgreementController');
const disciplinaryActionController = require('../controllers/autoDocuments/disciplinaryActionController');
const terminationDecisionDueToDurationController = require('../controllers/autoDocuments/terminationDecisionDueToDurationController');
const terminationWarningController = require('../controllers/autoDocuments/terminationWarningController');
const employmentAnnexController = require('../controllers/autoDocuments/employmentAnnexController');
const warningLetterController = require('../controllers/autoDocuments/warningLetterController');
const rentAgreementController = require('../controllers/autoDocuments/rentAgreementController');
const terminationPersonalReasonsController = require('../controllers/autoDocuments/terminationPersonalReasonsController');
const terminationDueToFaultController = require('../controllers/autoDocuments/terminationDueToFaultController');
const terminationByEmployeeRequestController = require('../controllers/autoDocuments/terminationByEmployeeRequestController');
const bonusPaymentController = require('../controllers/autoDocuments/bonusPaymentController');
const employeeDamagesStatementController = require('../controllers/autoDocuments/employeeDamagesStatementController');
const terminationDueToAgeLimitController = require('../controllers/autoDocuments/terminationDueToAgeLimitController');
const organizationActController = require('../controllers/autoDocuments/organizationActController');
const mandatoryBonusController = require('../controllers/autoDocuments/mandatoryBonusController');
const ndaController = require('../controllers/autoDocuments/ndaController');
const vehicleSalePurchaseAgreementController = require('../controllers/autoDocuments/vehicleSalePurchaseAgreementController');
const personalDataRulebookController = require('../controllers/autoDocuments/personalDataRulebookController');

// Consent for Personal Data Processing
router.post('/consent-for-personal-data', authenticateJWT, requireVerifiedCompany, generate);

// Employment
// Confirmation of Employment (Потврда за вработување)
router.post('/confirmation-of-employment', authenticateJWT, requireVerifiedCompany, confirmationOfEmploymentController);

// Termination Agreement (Спогодба за престанок на работен однос)
router.post('/termination-agreement', authenticateJWT, requireVerifiedCompany, terminationAgreementController);

// Annual Leave Decision (Решение за годишен одмор)
router.post('/annual-leave-decision', authenticateJWT, requireVerifiedCompany, annualLeaveDecisionController);

// Employment Agreement (Договор за вработување)
router.post('/employment-agreement', authenticateJWT, requireVerifiedCompany, employmentAgreementController);

// Disciplinary Action (Дисциплинска мерка)
router.post('/disciplinary-action', authenticateJWT, requireVerifiedCompany, disciplinaryActionController);

// Termination Decision Due to Duration (Одлука за престанок поради истек на времето)
router.post('/termination-decision-due-to-duration', authenticateJWT, requireVerifiedCompany, terminationDecisionDueToDurationController);

// Termination Warning (Предупредување пред откажување на договор за вработување)
router.post('/termination-warning', authenticateJWT, requireVerifiedCompany, terminationWarningController);

// Employment Annex (Анекс на договор за вработување)
router.post('/employment-annex', authenticateJWT, requireVerifiedCompany, employmentAnnexController);

// Warning Letter to Employee (Опомена до вработен)
router.post('/warning-letter', authenticateJWT, requireVerifiedCompany, warningLetterController);

// Termination Decision Due to Personal Reasons (Одлука за престанок поради лични причини)
router.post('/termination-personal-reasons', authenticateJWT, requireVerifiedCompany, terminationPersonalReasonsController);

// Termination Decision Due to Fault by Employee (Одлука за престанок поради вина на работникот)
router.post('/termination-due-to-fault', authenticateJWT, requireVerifiedCompany, terminationDueToFaultController);

// Termination by Employee Request (Решение за престанок по барање на работникот)
router.post('/termination-by-employee-request', authenticateJWT, requireVerifiedCompany, terminationByEmployeeRequestController);

// Bonus Payment Decision (Одлука за бонус плаќање)
router.post('/bonus-payment', authenticateJWT, requireVerifiedCompany, bonusPaymentController);

// Employee Damages Statement (Изјава за согласност за намалување на плата поради предизвикана штета)
router.post('/employee-damages-statement', authenticateJWT, requireVerifiedCompany, employeeDamagesStatementController);

// Termination Due to Age Limit (Решение за престанок поради возраст)
router.post('/termination-due-to-age-limit', authenticateJWT, requireVerifiedCompany, terminationDueToAgeLimitController);

// Organization Act (Акт за систематизација на работните места)
router.post('/organization-act', authenticateJWT, requireVerifiedCompany, organizationActController);

// Mandatory Bonus - Multi Document (Задолжителен бонус - Мултидокумент)
router.post('/mandatory-bonus', authenticateJWT, requireVerifiedCompany, mandatoryBonusController);

// Contracts
// Rent Agreement (Договор за закуп на недвижен имот)
router.post('/rent-agreement', authenticateJWT, requireVerifiedCompany, rentAgreementController);

// NDA (Договор за доверливост на информации)
router.post('/nda', authenticateJWT, requireVerifiedCompany, ndaController);

// Vehicle Sale-Purchase Agreement (Договор за продажба-купување на возило)
router.post('/vehicle-sale-purchase-agreement', authenticateJWT, requireVerifiedCompany, vehicleSalePurchaseAgreementController);

// Rulebooks
// Personal Data Rulebook (Правилник за заштита на личните податоци)
router.post('/personal-data-rulebook', authenticateJWT, requireVerifiedCompany, personalDataRulebookController);

// Add more document routes here as needed

module.exports = router; 