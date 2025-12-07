const { createDocumentController } = require('../../utils/baseDocumentController');
const generateDividendPaymentDecisionDoc = require('../../document_templates/accounting/dividendPaymentDecision');

/**
 * Dividend Payment Decision Controller
 * Generates decision document for dividend payment to shareholders
 * Uses modern baseDocumentController factory pattern for consistency
 * Based on Article 490 of the Law on Trading Companies
 */

/**
 * Data preprocessing function
 * Cleans and formats data before passing to template
 */
const preprocessDividendPaymentData = (formData, user, company) => {
  const processed = { ...formData };

  // Clean chairman name
  if (processed.chairman) {
    processed.chairman = processed.chairman.trim();
  }

  // Clean year fields
  if (processed.accumulatedProfitYear) {
    processed.accumulatedProfitYear = processed.accumulatedProfitYear.toString().trim();
  }

  if (processed.currentProfitYear) {
    processed.currentProfitYear = processed.currentProfitYear.toString().trim();
  }

  if (processed.paymentYear) {
    processed.paymentYear = processed.paymentYear.toString().trim();
  }

  // Clean and format amount fields
  if (processed.accumulatedProfitAmount) {
    processed.accumulatedProfitAmount = processed.accumulatedProfitAmount.toString().trim();
  }

  if (processed.currentProfitAmount) {
    processed.currentProfitAmount = processed.currentProfitAmount.toString().trim();
  }

  if (processed.totalDividendAmount) {
    processed.totalDividendAmount = processed.totalDividendAmount.toString().trim();
  }

  // Process shareholders list - ensure it's an array and clean data
  if (processed.shareholdersList && Array.isArray(processed.shareholdersList)) {
    processed.shareholdersList = processed.shareholdersList.map(shareholder => ({
      shareholderName: shareholder.shareholderName?.trim() || '',
      grossDividendAmount: shareholder.grossDividendAmount?.toString().trim() || '0'
    }));
  } else {
    processed.shareholdersList = [];
  }

  return processed;
};

// Create the controller using the factory pattern
const dividendPaymentDecisionController = createDocumentController({
  templateFunction: generateDividendPaymentDecisionDoc,
  documentName: 'dividend-payment-decision',
  validateFunction: null,
  preprocessFunction: preprocessDividendPaymentData,
  requiredFields: [] // Using custom validation in form
});

module.exports = dividendPaymentDecisionController;
