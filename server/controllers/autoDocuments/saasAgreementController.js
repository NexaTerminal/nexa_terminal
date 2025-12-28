const { createDocumentController } = require('../../utils/baseDocumentController');
const generateSaasAgreementDoc = require('../../document_templates/contracts/saasAgreement');

/**
 * SaaS Agreement Controller
 * Uses the modern baseDocumentController factory pattern for consistency
 * Implements warning-based validation instead of blocking errors
 */

/**
 * Data preprocessing function
 * Cleans and formats data before passing to template
 */
const preprocessSaasAgreementData = (formData, user, company) => {
  const processed = { ...formData };

  // Clean string fields
  const stringFields = [
    'userRole', 'clientName', 'clientAddress', 'clientTaxNumber', 'clientManager',
    'providerName', 'providerAddress', 'providerTaxNumber', 'providerManager',
    'serviceName', 'serviceDescription', 'serviceURL',
    'currency', 'bankAccount', 'bankName', 'supportHours',
    'durationType', 'effectiveDateType'
  ];

  stringFields.forEach(field => {
    if (processed[field]) {
      processed[field] = processed[field].trim();
    }
  });

  // Clean and format subscription fee
  if (processed.subscriptionFee) {
    processed.subscriptionFee = processed.subscriptionFee.toString().trim();
  }

  // Clean numeric fields
  if (processed.systemAvailability) {
    processed.systemAvailability = processed.systemAvailability.toString().trim();
  }

  if (processed.paymentDay) {
    processed.paymentDay = processed.paymentDay.toString().trim();
  }

  if (processed.terminationNoticeDays) {
    processed.terminationNoticeDays = processed.terminationNoticeDays.toString().trim();
  }

  if (processed.durationMonths) {
    processed.durationMonths = processed.durationMonths.toString().trim();
  }

  // Ensure boolean fields are properly typed
  if (processed.includesVAT !== undefined) {
    processed.includesVAT = Boolean(processed.includesVAT);
  }

  return processed;
};

// Create the controller using the factory pattern
const saasAgreementController = createDocumentController({
  templateFunction: generateSaasAgreementDoc,
  documentName: 'saas-agreement',
  validateFunction: null, // Using frontend validation
  preprocessFunction: preprocessSaasAgreementData,
  requiredFields: [] // Using custom validation instead of basic required fields
});

module.exports = saasAgreementController;
