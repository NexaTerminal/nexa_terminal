const { createDocumentController } = require('../../utils/baseDocumentController');
const generateMasterServicesAgreementDoc = require('../../document_templates/other/masterServicesAgreement');

/**
 * Master Services Agreement Controller
 * Uses the modern baseDocumentController factory pattern for consistency
 * Implements warning-based validation instead of blocking errors
 */

/**
 * Data preprocessing function
 * Cleans and formats data before passing to template
 */
const preprocessMasterServicesAgreementData = (formData, user, company) => {
  const processed = { ...formData };

  // Clean string fields
  const stringFields = [
    'userRole', 'clientName', 'clientAddress', 'clientTaxNumber', 'clientManager',
    'providerName', 'providerAddress', 'providerTaxNumber', 'providerManager',
    'serviceType', 'serviceDescription', 'serviceScope', 'serviceLocation',
    'paymentTerms', 'currency', 'paymentMethod', 'serviceDeliveryTerms',
    'durationType', 'effectiveDateType', 'terminationNoticePeriod',
    'qualityStandards', 'liabilityLimitType'
  ];

  stringFields.forEach(field => {
    if (processed[field]) {
      processed[field] = processed[field].trim();
    }
  });

  // Clean numeric fields
  if (processed.durationMonths) {
    processed.durationMonths = processed.durationMonths.toString().trim();
  }

  return processed;
};

// Create the controller using the factory pattern
const masterServicesAgreementController = createDocumentController({
  templateFunction: generateMasterServicesAgreementDoc,
  documentName: 'master-services-agreement',
  validateFunction: null, // Using frontend validation
  preprocessFunction: preprocessMasterServicesAgreementData,
  requiredFields: [] // Using custom validation instead of basic required fields
});

module.exports = masterServicesAgreementController;
