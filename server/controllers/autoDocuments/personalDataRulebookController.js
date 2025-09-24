const { createDocumentController } = require('../../utils/baseDocumentController');
const generatePersonalDataRulebookDoc = require('../../document_templates/rulebooks/personalDataRulebook');

/**
 * Business Secret Rulebook Controller
 * Uses baseDocumentController for proper company data mapping
 * No validation - allows generation with empty fields like vehicle agreement
 */

// Create the controller using the base factory with no validation
const personalDataRulebookController = createDocumentController({
  templateFunction: generatePersonalDataRulebookDoc,
  requiredFields: [], // No required fields
  documentName: 'business-secret-rulebook',
  validateFunction: null // No validation
});

module.exports = personalDataRulebookController;