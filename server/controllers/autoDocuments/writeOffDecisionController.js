const { createDocumentController } = require('../../utils/baseDocumentController');
const generateWriteOffDecisionDoc = require('../../document_templates/accounting/writeOffDecision');

/**
 * Write-off Decision Controller
 * Generates decision document for write-off of receivables or liabilities
 * Uses modern baseDocumentController factory pattern for consistency
 */

/**
 * Data preprocessing function
 * Cleans and formats data before passing to template
 */
const preprocessWriteOffData = (formData, user, company) => {
  const processed = { ...formData };

  // Clean responsible person name
  if (processed.responsiblePerson) {
    processed.responsiblePerson = processed.responsiblePerson.trim();
  }

  // Clean city name
  if (processed.city) {
    processed.city = processed.city.trim();
  }

  // Clean write-off type
  if (processed.writeOffType) {
    processed.writeOffType = processed.writeOffType.trim();
  }

  // Process write-off items array
  if (processed.writeOffItems && Array.isArray(processed.writeOffItems)) {
    processed.writeOffItems = processed.writeOffItems.map(item => ({
      partnerName: item.partnerName?.trim() || '',
      amount: item.amount ? parseFloat(item.amount) : 0,
      accountNumber: item.accountNumber?.trim() || ''
    }));
  }

  return processed;
};

// Create the controller using the factory pattern
const writeOffDecisionController = createDocumentController({
  templateFunction: generateWriteOffDecisionDoc,
  documentName: 'write-off-decision',
  validateFunction: null,
  preprocessFunction: preprocessWriteOffData,
  requiredFields: [] // Using custom validation in form
});

module.exports = writeOffDecisionController;
