const { createDocumentController, validators, cleanFormData } = require('../../utils/baseDocumentController');
const generateEmploymentAnnexDoc = require('../../document_templates/employment/employmentAnnex');

/**
 * Employment Annex Controller
 * Uses the base controller factory for common functionality
 * Handles employment agreement amendments and modifications
 */

// Define required fields for employment annex
const REQUIRED_FIELDS = [];
/**
 * Custom validation function for employment annex
 */
const validateFunction = null;
/**
 * Preprocess form data before document generation
 */
const preprocessEmploymentAnnexData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Format dates to ensure consistency
  if (processed.annexDate) {
    processed.annexDate = new Date(processed.annexDate).toISOString().split('T')[0];
  }
  
  if (processed.endDate) {
    processed.endDate = new Date(processed.endDate).toISOString().split('T')[0];
  }

  // Clean PIN field - remove any spaces
  if (processed.employeePIN) {
    processed.employeePIN = processed.employeePIN.replace(/\s/g, '');
  }

  // Format salary as number if provided
  if (processed.newBasicSalary) {
    processed.newBasicSalary = parseFloat(processed.newBasicSalary).toFixed(0);
  }

  return processed;
};

// Create the employment annex controller using the base factory
const employmentAnnexController = createDocumentController({
  templateFunction: generateEmploymentAnnexDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'анекс-договор-вработување',
  validateFunction: null,
  preprocessFunction: preprocessEmploymentAnnexData
});

module.exports = employmentAnnexController;