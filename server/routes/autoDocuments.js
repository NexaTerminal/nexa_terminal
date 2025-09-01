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

// Add more document routes here as needed

module.exports = router; 