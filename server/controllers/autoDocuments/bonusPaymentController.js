const { createDocumentController } = require('../../utils/baseDocumentController');
const generateBonusPaymentDoc = require('../../document_templates/employment/bonusPayment');

/**
 * Bonus Payment Controller
 * Uses the modern baseDocumentController factory pattern for consistency
 * Implements warning-based validation instead of blocking errors
 */

/**
 * Custom validation function for bonus payment documents
 * Returns warnings instead of blocking errors to allow user flexibility
 */
const validateFunction = null;
/**
 * Data preprocessing function
 * Cleans and formats data before passing to template
 */
const preprocessBonusPaymentData = (formData, user, company) => {
  const processed = { ...formData };
  
  // Clean and format bonus amount
  if (processed.bonusAmount) {
    processed.bonusAmount = processed.bonusAmount.toString().trim();
  }
  
  // Clean employee name
  if (processed.employeeName) {
    processed.employeeName = processed.employeeName.trim();
  }
  
  // Clean work position
  if (processed.employeeWorkPosition) {
    processed.employeeWorkPosition = processed.employeeWorkPosition.trim();
  }
  
  // Clean bonus reason
  if (processed.bonusReason) {
    processed.bonusReason = processed.bonusReason.trim();
  }
  
  return processed;
};

// Create the controller using the factory pattern
const bonusPaymentController = createDocumentController({
  templateFunction: generateBonusPaymentDoc,
  documentName: 'bonus-payment',
  validateFunction: null,
  preprocessFunction: preprocessBonusPaymentData,
  requiredFields: [] // Using custom validation instead of basic required fields
});

module.exports = bonusPaymentController;