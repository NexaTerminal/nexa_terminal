const { createDocumentController } = require('../../utils/baseDocumentController');
const generateGdprCompanyPoliticsDoc = require('../../document_templates/personalDataProtection/gdprCompanyPolitics');

/**
 * GDPR Company Politics Controller
 * Uses baseDocumentController for proper company data mapping
 * No validation - allows generation with empty fields for flexibility
 */

// Create the controller using the base factory with no validation
const gdprCompanyPoliticsController = createDocumentController({
  templateFunction: generateGdprCompanyPoliticsDoc,
  requiredFields: [], // No required fields - allow flexibility
  documentName: 'gdpr-company-politics',
  validateFunction: null // No validation
});

module.exports = gdprCompanyPoliticsController;