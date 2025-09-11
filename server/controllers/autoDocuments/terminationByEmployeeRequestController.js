const { createDocumentController, validators, cleanFormData } = require('../../utils/baseDocumentController');
const generateTerminationByEmployeeRequestDoc = require('../../document_templates/employment/terminationByEmployeeRequest');

/**
 * Termination by Employee Request Controller
 * Uses the base controller factory for common functionality
 * Handles termination decisions based on employee requests according to Article 71
 * of the Macedonian Labor Law
 */

// Define required fields for termination by employee request
const REQUIRED_FIELDS = [];
/**
 * Custom validation function for termination by employee request
 * Uses lenient validation that provides warnings instead of blocking generation
 */
const validateFunction = null;
/**
 * Preprocess form data before document generation
 */
const preprocessTerminationByEmployeeRequestData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Format dates to ensure consistency
  if (processed.requestDate) {
    processed.requestDate = new Date(processed.requestDate).toISOString().split('T')[0];
  }
  
  if (processed.employmentEndDate) {
    processed.employmentEndDate = new Date(processed.employmentEndDate).toISOString().split('T')[0];
  }

  if (processed.decisionDate) {
    processed.decisionDate = new Date(processed.decisionDate).toISOString().split('T')[0];
  }

  return processed;
};

// Create the termination by employee request controller using the base factory
const terminationByEmployeeRequestController = createDocumentController({
  templateFunction: generateTerminationByEmployeeRequestDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'решение-за-престанок-по-барање-работник',
  validateFunction: null,
  preprocessFunction: preprocessTerminationByEmployeeRequestData
});

module.exports = terminationByEmployeeRequestController;