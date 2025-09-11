const { createDocumentController, validators } = require('../../utils/baseDocumentController');
const generateTerminationAgreementDoc = require('../../document_templates/employment/terminationAgreement');

/**
 * Termination Agreement Controller
 * Updated to use baseDocumentController for proper company data mapping
 */

// Define required fields
const REQUIRED_FIELDS = [];
/**
 * Custom validation function
 */
const validateFunction = null;
// Create the controller using the base factory
const terminationAgreementController = createDocumentController({
  templateFunction: generateTerminationAgreementDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'termination-agreement',
  validateFunction: null
});

module.exports = terminationAgreementController; 