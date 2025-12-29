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
 */
const preprocessAnnualAccountsData = (formData, user, company) => {
  const processed = { ...formData };

  // Clean text fields
  if (processed.year) {
    processed.year = processed.year.toString().trim();
  }

  if (processed.chairman) {
    processed.chairman = processed.chairman.trim();
  }

  return processed;
};

// Create the controller using the factory pattern
const annualAccountsAdoptionController = createDocumentController({
  templateFunction: generateAnnualAccountsAdoptionDoc,
  documentName: 'annual-accounts-adoption',
  validateFunction: null,
  preprocessFunction: preprocessAnnualAccountsData,
  requiredFields: ['meetingDate', 'year', 'date', 'chairman']
});

module.exports = annualAccountsAdoptionController;
