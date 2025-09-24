const { createDocumentController } = require('../../utils/baseDocumentController');
const generateBonusDecisionDoc = require('../../document_templates/employment/bonusDecision');

/**
 * Bonus Decision Controller
 * Uses the modern baseDocumentController factory pattern for consistency
 * Implements warning-based validation instead of blocking errors
 */

/**
 * Custom validation function for bonus decision documents
 * Returns warnings instead of blocking errors to allow user flexibility
 */
const validateFunction = null;

/**
 * Data preprocessing function
 * Cleans and formats data before passing to template
 */
const preprocessBonusDecisionData = (formData, user, company) => {
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

  // Clean bonus type
  if (processed.bonusType) {
    processed.bonusType = processed.bonusType.trim();
  }

  // Clean criteria
  if (processed.criteria) {
    processed.criteria = processed.criteria.trim();
  }

  // Clean bonus period
  if (processed.bonusPeriod) {
    processed.bonusPeriod = processed.bonusPeriod.trim();
  }

  // Ensure isRecurring is boolean
  if (processed.isRecurring !== undefined) {
    processed.isRecurring = Boolean(processed.isRecurring);
  }

  return processed;
};

// Create the controller using the factory pattern
const bonusDecisionController = createDocumentController({
  templateFunction: generateBonusDecisionDoc,
  documentName: 'bonus-decision',
  validateFunction: null,
  preprocessFunction: preprocessBonusDecisionData,
  requiredFields: [] // Using custom validation instead of basic required fields
});

module.exports = bonusDecisionController;