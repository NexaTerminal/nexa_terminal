const { createDocumentController, validators, cleanFormData } = require('../../utils/baseDocumentController');
const generateTerminationDueToAgeLimitDoc = require('../../document_templates/employment/terminationDueToAgeLimit');

/**
 * Termination Due to Age Limit Controller
 * Uses the base controller factory for common functionality
 * Handles termination decisions for employees reaching retirement age
 */

// Define required fields for termination due to age limit
const REQUIRED_FIELDS = [];
/**
 * Custom validation function for termination due to age limit
 */
const validateFunction = null;
/**
 * Preprocess form data before document generation
 */
const preprocessTerminationDueToAgeLimitData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Format dates to ensure consistency
  if (processed.decisionDate) {
    processed.decisionDate = new Date(processed.decisionDate).toISOString().split('T')[0];
  }
  
  if (processed.employmentEndDate) {
    processed.employmentEndDate = new Date(processed.employmentEndDate).toISOString().split('T')[0];
  }

  // Clean and validate PIN
  if (processed.employeePin) {
    processed.employeePin = processed.employeePin.toString().replace(/\D/g, ''); // Remove non-digits
  }

  return processed;
};

// Create the termination due to age limit controller using the base factory
const terminationDueToAgeLimitController = createDocumentController({
  templateFunction: generateTerminationDueToAgeLimitDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'решение-за-престанок-поради-возраст',
  validateFunction: null,
  preprocessFunction: preprocessTerminationDueToAgeLimitData
});

module.exports = terminationDueToAgeLimitController;