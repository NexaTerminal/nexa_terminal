const { createDocumentController, validators } = require('../../utils/baseDocumentController');
const generateTerminationDecisionDueToDurationDoc = require('../../document_templates/employment/terminationDecisionDueToDuration');

/**
 * Termination Decision Due to Duration Controller
 * Updated to use baseDocumentController for proper company data mapping
 */

// Define required fields
const REQUIRED_FIELDS = [];
/**
 * Custom validation function
 */
const validateFunction = null;
// Create the controller using the base factory
const terminationDecisionController = createDocumentController({
  templateFunction: generateTerminationDecisionDueToDurationDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'termination-decision-due-to-duration',
  validateFunction: null
});

module.exports = terminationDecisionController;