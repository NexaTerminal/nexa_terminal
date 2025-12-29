const { createDocumentController } = require('../../utils/baseDocumentController');
const generateCashRegisterMaximumDecisionDoc = require('../../document_templates/accounting/cashRegisterMaximumDecision');

/**
 * Cash Register Maximum Decision Controller
 * Generates decision document for setting cash register maximum limits
 * Uses modern baseDocumentController factory pattern for consistency
 * Based on Article 20 of the Payment Transactions Law
 */

/**
 * Data preprocessing function
 * Cleans and formats data before passing to template
 */
const preprocessCashRegisterData = (formData, user, company) => {
  const processed = { ...formData };

  // Clean year
  if (processed.year) {
    processed.year = processed.year.toString().trim();
  }

  // Clean and format amount
  if (processed.amount) {
    processed.amount = processed.amount.toString().trim();
  }

  return processed;
};

// Create the controller using the factory pattern
const cashRegisterMaximumDecisionController = createDocumentController({
  templateFunction: generateCashRegisterMaximumDecisionDoc,
  documentName: 'cash-register-maximum-decision',
  validateFunction: null,
  preprocessFunction: preprocessCashRegisterData,
  requiredFields: [] // Using custom validation in form
});

module.exports = cashRegisterMaximumDecisionController;
