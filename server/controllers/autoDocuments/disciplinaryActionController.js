const { createDocumentController, validators } = require('../../utils/baseDocumentController');
const generateDisciplinaryActionDoc = require('../../document_templates/employment/disciplinaryAction');

/**
 * Disciplinary Action Controller
 * Updated to use baseDocumentController for proper company data mapping
 */

// Define required fields
const REQUIRED_FIELDS = [];
/**
 * Custom validation function
 */
const validateFunction = null;
// Create the controller using the base factory
const disciplinaryActionController = createDocumentController({
  templateFunction: generateDisciplinaryActionDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'disciplinary-action',
  validateFunction: null
});

module.exports = disciplinaryActionController;