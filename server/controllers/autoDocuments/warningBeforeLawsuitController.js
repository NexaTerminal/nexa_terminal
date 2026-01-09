const { createDocumentController } = require('../../utils/baseDocumentController');
const generateWarningBeforeLawsuitDoc = require('../../document_templates/other/warningBeforeLawsuit');

/**
 * Warning Before Lawsuit Controller
 * Handles generation of formal pre-litigation warning letters for debt collection
 * Category: Other Business Documents (Други деловни документи)
 */

// Define required fields
const REQUIRED_FIELDS = [
  'debtorName',
  'debtorAddress',
  'debtBasis',
  'totalAmountToBePaid'
];

// Create the controller using the base factory
const warningBeforeLawsuitController = createDocumentController({
  templateFunction: generateWarningBeforeLawsuitDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'warning-before-lawsuit',
  validateFunction: null
});

module.exports = warningBeforeLawsuitController;
