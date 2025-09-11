const { createDocumentController, validators } = require('../../utils/baseDocumentController');
const generateConsentForPersonalDataProcessingDoc = require('../../document_templates/personalDataProtection/consentForPersonalDataProcessing');

/**
 * Consent for Personal Data Processing Controller
 * Updated to use baseDocumentController for proper company data mapping
 */

// Define required fields
const REQUIRED_FIELDS = [];
/**
 * Custom validation function
 */
const validateFunction = null;
// Create the controller using the base factory
const consentController = createDocumentController({
  templateFunction: generateConsentForPersonalDataProcessingDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'consent-for-personal-data',
  validateFunction: null
});

module.exports = consentController; 