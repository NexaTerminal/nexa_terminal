const { createDocumentController, validators, cleanFormData } = require('../../utils/baseDocumentController');
const generateTerminationPersonalReasonsDoc = require('../../document_templates/employment/terminationPersonalReasons');

/**
 * Termination Decision Due to Personal Reasons Controller
 * Uses the base controller factory for common functionality
 * Handles termination decisions for personal reasons on employee's side
 */

// Define required fields for termination decision due to personal reasons
const REQUIRED_FIELDS = [];
/**
 * Custom validation function for termination due to personal reasons
 */
const validateFunction = null;
/**
 * Preprocess form data before document generation
 */
const preprocessTerminationPersonalReasonsData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Format dates to ensure consistency
  if (processed.contractStartDate) {
    processed.contractStartDate = new Date(processed.contractStartDate).toISOString().split('T')[0];
  }
  
  if (processed.terminationDate) {
    processed.terminationDate = new Date(processed.terminationDate).toISOString().split('T')[0];
  }

  if (processed.documentDate) {
    processed.documentDate = new Date(processed.documentDate).toISOString().split('T')[0];
  }

  return processed;
};

// Create the termination personal reasons controller using the base factory
const terminationPersonalReasonsController = createDocumentController({
  templateFunction: generateTerminationPersonalReasonsDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'одлука-престанок-лични-причини',
  validateFunction: null,
  preprocessFunction: preprocessTerminationPersonalReasonsData
});

module.exports = terminationPersonalReasonsController;