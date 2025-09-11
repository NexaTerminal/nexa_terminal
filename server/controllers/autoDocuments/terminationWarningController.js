const { createDocumentController, validators, cleanFormData } = require('../../utils/baseDocumentController');
const generateTerminationWarningDoc = require('../../document_templates/employment/terminationWarning');

/**
 * Termination Warning Controller
 * Uses the base controller factory for common functionality
 * Handles pre-termination warning documents for employee discipline
 */

// Define required fields for termination warning
const REQUIRED_FIELDS = [];
/**
 * Custom validation function for termination warning
 */
const validateFunction = null;
/**
 * Preprocess form data before document generation
 */
const preprocessTerminationWarningData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Format dates to ensure consistency
  if (processed.decisionDate) {
    processed.decisionDate = new Date(processed.decisionDate).toISOString().split('T')[0];
  }
  
  if (processed.fixingDeadline) {
    processed.fixingDeadline = new Date(processed.fixingDeadline).toISOString().split('T')[0];
  }

  return processed;
};

// Create the termination warning controller using the base factory
const terminationWarningController = createDocumentController({
  templateFunction: generateTerminationWarningDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'предупредување-пред-откажување',
  validateFunction: null,
  preprocessFunction: preprocessTerminationWarningData
});

module.exports = terminationWarningController;