const { createDocumentController, validators, cleanFormData } = require('../../utils/baseDocumentController');
const generateNDADoc = require('../../document_templates/contracts/nda');

/**
 * NDA (Non-Disclosure Agreement) Controller
 * Uses the base controller factory for common functionality
 */

// Define required fields for NDA (basic fields always required)
const REQUIRED_FIELDS = [];
/**
 * Custom validation function for NDA
 */
const validateFunction = null;
/**
 * Preprocess form data before document generation
 */
const preprocessNDAData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Set default values for optional fields
  processed.agreementType = processed.agreementType || 'bilateral';
  processed.contactEmail = processed.contactEmail || '';
  processed.additionalTerms = processed.additionalTerms || '';

  // Map conditional fields to standardized format for template
  if (processed.partyType === 'natural') {
    processed.secondPartyName = processed.naturalPersonName || '';
    processed.secondPartyAddress = processed.naturalPersonAddress || '';
    processed.secondPartyPin = processed.naturalPersonPin || '';
    processed.isNaturalPerson = true;
    processed.isLegalEntity = false;
  } else if (processed.partyType === 'legal') {
    processed.secondPartyName = processed.legalEntityName || '';
    processed.secondPartyAddress = processed.legalEntityAddress || '';
    processed.secondPartyTaxNumber = processed.legalEntityTaxNumber || '';
    processed.secondPartyManager = processed.legalEntityManager || '';
    processed.isNaturalPerson = false;
    processed.isLegalEntity = true;
  }

  return processed;
};

// Create the NDA controller using the base factory
const ndaController = createDocumentController({
  templateFunction: generateNDADoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'договор-за-доверливост',
  validateFunction: null,
  preprocessFunction: preprocessNDAData
});

module.exports = ndaController;