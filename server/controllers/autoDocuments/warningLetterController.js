const { createDocumentController, validators } = require('../../utils/baseDocumentController');
const generateWarningLetterDoc = require('../../document_templates/employment/warningLetter');

/**
 * Warning Letter Controller
 * Updated to use baseDocumentController for proper company data mapping
 */

// Define required fields
const REQUIRED_FIELDS = [];
/**
 * Custom validation function
 */
const validateFunction = null;
// Create the controller using the base factory
const warningLetterController = createDocumentController({
  templateFunction: generateWarningLetterDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'warning-letter-employee',
  validateFunction: null
});

module.exports = warningLetterController;