const { createDocumentController } = require('../../utils/baseDocumentController');
const generateEmployeeStockPurchasePlanDoc = require('../../document_templates/other/employeeStockPurchasePlan');

/**
 * Employee Stock Purchase Plan Controller
 * Uses the modern baseDocumentController factory pattern for consistency
 * Implements warning-based validation instead of blocking errors
 */

/**
 * Data preprocessing function
 * Cleans and formats data before passing to template
 */
const preprocessStockPlanData = (formData, user, company) => {
  const processed = { ...formData };

  // Clean company name
  if (processed.companyName) {
    processed.companyName = processed.companyName.trim();
  }

  // Clean jurisdiction
  if (processed.jurisdiction) {
    processed.jurisdiction = processed.jurisdiction.trim();
  }

  // Clean purpose
  if (processed.purpose) {
    processed.purpose = processed.purpose.trim();
  }

  // Clean maximum shares number (for акции)
  if (processed.maximumSharesNumber) {
    processed.maximumSharesNumber = processed.maximumSharesNumber.toString().trim();
  }

  // Clean maximum shares percentage (for удели)
  if (processed.maximumSharesPercentage) {
    processed.maximumSharesPercentage = processed.maximumSharesPercentage.toString().trim();
  }

  // Clean purchase price percentage
  if (processed.purchasePricePercentage) {
    processed.purchasePricePercentage = processed.purchasePricePercentage.toString().trim();
  }

  // Clean offering period
  if (processed.offeringPeriodMonths) {
    processed.offeringPeriodMonths = processed.offeringPeriodMonths.toString().trim();
  }

  // Clean minimum service period
  if (processed.minimumServiceMonths) {
    processed.minimumServiceMonths = processed.minimumServiceMonths.toString().trim();
  }

  // Clean minimum work hours
  if (processed.minimumWorkHours) {
    processed.minimumWorkHours = processed.minimumWorkHours.toString().trim();
  }

  // Clean payroll deduction percentage
  if (processed.maxPayrollDeductionPercentage) {
    processed.maxPayrollDeductionPercentage = processed.maxPayrollDeductionPercentage.toString().trim();
  }

  // Clean term period
  if (processed.termPeriod) {
    processed.termPeriod = processed.termPeriod.toString().trim();
  }

  return processed;
};

// Create the controller using the factory pattern
const employeeStockPurchasePlanController = createDocumentController({
  templateFunction: generateEmployeeStockPurchasePlanDoc,
  documentName: 'employee-stock-purchase-plan',
  validateFunction: null,
  preprocessFunction: preprocessStockPlanData,
  requiredFields: [] // Using lenient validation for user flexibility
});

module.exports = employeeStockPurchasePlanController;
