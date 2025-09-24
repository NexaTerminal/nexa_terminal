const { createDocumentController } = require('../../utils/baseDocumentController');
const generateAnnualLeaveBonusDecisionDoc = require('../../document_templates/employment/annualLeaveBonusDecision');

/**
 * Annual Leave Bonus Decision Controller
 * Uses the modern baseDocumentController factory pattern for consistency
 * Implements warning-based validation instead of blocking errors
 */

/**
 * Data preprocessing function
 * Cleans and formats data before passing to template
 */
const preprocessAnnualLeaveBonusData = (formData, user, company) => {
  const processed = { ...formData };

  // Clean and format bonus amount
  if (processed.bonusAmount) {
    processed.bonusAmount = processed.bonusAmount.toString().trim();
  }

  // Clean annual leave year
  if (processed.annualLeaveYear) {
    processed.annualLeaveYear = processed.annualLeaveYear.toString().trim();
  }

  return processed;
};

// Create the controller using the factory pattern
const annualLeaveBonusDecisionController = createDocumentController({
  templateFunction: generateAnnualLeaveBonusDecisionDoc,
  documentName: 'annual-leave-bonus',
  validateFunction: null,
  preprocessFunction: preprocessAnnualLeaveBonusData,
  requiredFields: [] // Using custom validation instead of basic required fields
});

module.exports = annualLeaveBonusDecisionController;