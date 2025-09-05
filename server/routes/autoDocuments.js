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

// Contracts
// Rent Agreement (Договор за закуп на недвижен имот)
router.post('/rent-agreement', authenticateJWT, requireVerifiedCompany, rentAgreementController);

// Add more document routes here as needed

module.exports = router; 