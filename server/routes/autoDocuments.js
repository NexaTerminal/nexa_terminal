const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const generate = require('../controllers/autoDocuments/consentForPersonalDataProcessingController');
const terminationAgreementController = require('../controllers/autoDocuments/terminationAgreementController');
const annualLeaveDecisionController = require('../controllers/autoDocuments/annualLeaveDecisionController');
const confirmationOfEmploymentController = require('../controllers/autoDocuments/confirmationOfEmploymentController');

// Consent for Personal Data Processing
router.post('/consent-for-personal-data', authenticateJWT, generate);

// Employment
// Confirmation of Employment (Потврда за вработување)
router.post('/confirmation-of-employment', authenticateJWT, confirmationOfEmploymentController);

// Termination Agreement (Спогодба за престанок на работен однос)
router.post('/termination-agreement', authenticateJWT, terminationAgreementController);

// Annual Leave Decision (Решение за годишен одмор)
router.post('/annual-leave-decision', authenticateJWT, annualLeaveDecisionController);

// Add more document routes here as needed

module.exports = router; 