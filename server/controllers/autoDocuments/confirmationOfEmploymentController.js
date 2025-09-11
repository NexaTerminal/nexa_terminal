const { createDocumentController, validators, cleanFormData } = require('../../utils/baseDocumentController');
const generateConfirmationOfEmploymentDoc = require('../../document_templates/employment/confirmationOfEmployment');

/**
 * Confirmation of Employment Controller
 * Uses the base controller factory for common functionality
 * Migrated to new architecture for consistency and maintainability
 */

// No required fields - all fields are optional per user request
const REQUIRED_FIELDS = [];

/**
 * No validation function - all fields are optional per user request
 */
const validateConfirmationOfEmployment = null;

/**
 * Preprocess form data before document generation
 */
const preprocessConfirmationData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Clean up EMBG by removing spaces
  if (processed.employeePIN) {
    processed.employeePIN = processed.employeePIN.replace(/\s/g, '');
  }

  return processed;
};

// Create the confirmation of employment controller using the base factory
const confirmationOfEmploymentController = createDocumentController({
  templateFunction: generateConfirmationOfEmploymentDoc,
  requiredFields: [], // No required fields - allow generation with missing data
  documentName: 'потврда-за-вработување',
  validateFunction: null, // No validation - allow all submissions
  preprocessFunction: preprocessConfirmationData
});

module.exports = confirmationOfEmploymentController; 