const { createDocumentController } = require('../../utils/baseDocumentController');
const generateInvoiceSigningAuthorizationDoc = require('../../document_templates/accounting/invoiceSigningAuthorization');

/**
 * Invoice Signing Authorization Controller
 * Generates authorization document for invoice signing rights
 * Uses modern baseDocumentController factory pattern for consistency
 * Based on company founding agreement articles
 */

/**
 * Data preprocessing function
 * Cleans and formats data before passing to template
 */
const preprocessInvoiceSigningData = (formData, user, company) => {
  const processed = { ...formData };

  // Clean text fields
  if (processed.articleNumber) {
    processed.articleNumber = processed.articleNumber.trim();
  }

  if (processed.authorizedPerson) {
    processed.authorizedPerson = processed.authorizedPerson.trim();
  }

  if (processed.branchLocation) {
    processed.branchLocation = processed.branchLocation.trim();
  }

  if (processed.position) {
    processed.position = processed.position.trim();
  }

  if (processed.companyManager) {
    processed.companyManager = processed.companyManager.trim();
  }

  if (processed.city) {
    processed.city = processed.city.trim();
  }

  return processed;
};

// Create the controller using the factory pattern
const invoiceSigningAuthorizationController = createDocumentController({
  templateFunction: generateInvoiceSigningAuthorizationDoc,
  documentName: 'invoice-signing-authorization',
  validateFunction: null,
  preprocessFunction: preprocessInvoiceSigningData,
  requiredFields: [] // Using custom validation in form
});

module.exports = invoiceSigningAuthorizationController;
