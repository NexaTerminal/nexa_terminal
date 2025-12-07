const { createDocumentController } = require('../../utils/baseDocumentController');
const generateAnnualAccountsAdoptionDoc = require('../../document_templates/accounting/annualAccountsAdoption');

/**
 * Annual Accounts Adoption Decision Controller
 * Generates decision document for adoption of annual accounts, financial statements and annual report
 * Uses modern baseDocumentController factory pattern for consistency
 * Based on Article 215 paragraph 1 point 1 of the Law on Trading Companies
 */

/**
 * Data preprocessing function
 * Cleans and formats data before passing to template
 * Calculates profitBeforeTax and profitAfterTax automatically
 */
const preprocessAnnualAccountsData = (formData, user, company) => {
  const processed = { ...formData };

  // Clean text fields
  if (processed.articleNumber) {
    processed.articleNumber = processed.articleNumber.toString().trim();
  }

  if (processed.year) {
    processed.year = processed.year.toString().trim();
  }

  if (processed.managerName) {
    processed.managerName = processed.managerName.trim();
  }

  if (processed.city) {
    processed.city = processed.city.trim();
  }

  if (processed.chairman) {
    processed.chairman = processed.chairman.trim();
  }

  // Parse and calculate financial amounts
  const revenues = parseFloat(processed.revenues) || 0;
  const expenses = parseFloat(processed.expenses) || 0;
  const taxOnExpenses = parseFloat(processed.taxOnExpenses) || 0;

  // Auto-calculate profit before tax
  processed.profitBeforeTax = revenues - expenses;

  // Auto-calculate profit after tax
  processed.profitAfterTax = processed.profitBeforeTax - taxOnExpenses;

  // Format amounts as strings for template
  processed.revenues = revenues.toString();
  processed.expenses = expenses.toString();
  processed.taxOnExpenses = taxOnExpenses.toString();
  processed.profitBeforeTax = processed.profitBeforeTax.toString();
  processed.profitAfterTax = processed.profitAfterTax.toString();

  return processed;
};

// Create the controller using the factory pattern
const annualAccountsAdoptionController = createDocumentController({
  templateFunction: generateAnnualAccountsAdoptionDoc,
  documentName: 'annual-accounts-adoption',
  validateFunction: null,
  preprocessFunction: preprocessAnnualAccountsData,
  requiredFields: ['articleNumber', 'meetingDate', 'year', 'revenues', 'expenses', 'taxOnExpenses', 'managerName', 'city', 'date', 'chairman']
});

module.exports = annualAccountsAdoptionController;
