const { createDocumentController, validators, cleanFormData } = require('../../utils/baseDocumentController');
const generateEmploymentAgreementDoc = require('../../document_templates/employment/employmentAgreement');

/**
 * Employment Agreement Controller
 * Uses the base controller factory for common functionality
 * This controller is now ~70% smaller than the original implementation
 */

// No required fields - all fields are optional per user request
const REQUIRED_FIELDS = [];

/**
 * No validation function - all fields are optional per user request
 */
const validateEmploymentAgreement = null;

/**
 * Preprocess form data before document generation
 */
const preprocessEmploymentData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Handle work tasks - convert to array of strings
  if (processed.workTasks) {
    if (Array.isArray(processed.workTasks)) {
      // Already an array - process each item
      processed.workTasks = processed.workTasks
        .map(task => typeof task === 'string' ? task.trim() : String(task).trim())
        .filter(task => task && task.length > 0);
    } else if (typeof processed.workTasks === 'object' && processed.workTasks !== null) {
      // Handle object with indexed keys (like {"0": "task1", "1": "task2"})
      processed.workTasks = Object.values(processed.workTasks)
        .map(task => typeof task === 'string' ? task.trim() : String(task).trim())
        .filter(task => task && task.length > 0);
    } else if (typeof processed.workTasks === 'string') {
      // Single string - convert to array
      processed.workTasks = [processed.workTasks.trim()].filter(task => task && task.length > 0);
    } else {
      // Fallback - empty array
      processed.workTasks = [];
    }
  } else {
    processed.workTasks = [];
  }

  // Set default values for optional fields
  processed.placeOfWork = processed.otherWorkPlace || processed.placeOfWork || 'просториите на седиштето на работодавачот';
  processed.agreementDurationType = processed.agreementDurationType || 'неопределено времетраење.';
  processed.dailyWorkTime = processed.otherWorkTime || processed.dailyWorkTime || 'започнува од 08:00 часот, а завршува во 16:00 часот';

  return processed;
};

// Create the employment agreement controller using the base factory
const employmentAgreementController = createDocumentController({
  templateFunction: generateEmploymentAgreementDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'договор-за-вработување',
  validateFunction: null,
  preprocessFunction: preprocessEmploymentData
});

module.exports = employmentAgreementController;