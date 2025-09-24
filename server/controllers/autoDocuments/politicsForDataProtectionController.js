const { createDocumentController } = require('../../utils/baseDocumentController');
const generatePoliticsForDataProtectionDoc = require('../../document_templates/personalDataProtection/politicsForDataProtection');

/**
 * Politics for Data Protection Controller
 * Uses baseDocumentController for proper company data mapping
 */

// Define required fields - none required, allow empty generation
const REQUIRED_FIELDS = [];

// Create the controller using the base factory
const politicsController = createDocumentController({
  templateFunction: generatePoliticsForDataProtectionDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'politics-for-data-protection',
  validateFunction: null
});

module.exports = politicsController;