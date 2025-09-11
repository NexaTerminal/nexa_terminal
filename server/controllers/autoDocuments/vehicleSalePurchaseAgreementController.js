const { createDocumentController, validators } = require('../../utils/baseDocumentController');
const generateVehicleSalePurchaseAgreementDoc = require('../../document_templates/obligations/vehicleSalePurchaseAgreement');

/**
 * Vehicle Sale-Purchase Agreement Controller
 * Uses baseDocumentController for proper company data mapping
 * Multi-step form supporting both seller and buyer roles with natural/legal entity options
 */

// Define required fields based on user role and other party type
const REQUIRED_FIELDS = [
  'userRole',
  'contractDate',
  'placeOfSigning',
  'competentCourt',
  'otherPartyType',
  'vehicleType',
  'vehicleBrand',
  'chassisNumber',
  'productionYear',
  'registrationNumber',
  'price',
  'paymentMethod'
];

/**
 * Custom validation function for vehicle sale-purchase agreement
 * Validates conditional fields based on user selections
 */
const validateVehicleSalePurchaseAgreement = (formData) => {
  const errors = {};
  const warnings = [];
  const missing = [];

  console.log('[Vehicle Agreement] Validating form data:', JSON.stringify(formData, null, 2));

  // Basic required fields validation
  REQUIRED_FIELDS.forEach(field => {
    if (!formData[field] || formData[field].toString().trim() === '') {
      missing.push(field);
      console.log(`[Vehicle Agreement] Missing required field: ${field}`);
    }
  });

  // Validate other party information based on type
  if (formData.otherPartyType === 'company') {
    const companyFields = ['otherPartyCompanyName', 'otherPartyTaxNumber', 'otherPartyManager'];
    companyFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        missing.push(field);
        console.log(`[Vehicle Agreement] Missing company field: ${field}`);
      }
    });
  } else if (formData.otherPartyType === 'natural') {
    const naturalFields = ['otherPartyName', 'otherPartyPIN'];
    naturalFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        missing.push(field);
        console.log(`[Vehicle Agreement] Missing natural person field: ${field}`);
      }
    });
    
    // Validate PIN format (exactly 13 digits)
    if (formData.otherPartyPIN && !/^\d{13}$/.test(formData.otherPartyPIN.toString())) {
      errors.otherPartyPIN = 'ЕМБГ мора да содржи точно 13 цифри';
      console.log(`[Vehicle Agreement] Invalid PIN format: ${formData.otherPartyPIN}`);
    }
  }

  // Validate other party address
  if (!formData.otherPartyAddress || formData.otherPartyAddress.toString().trim() === '') {
    missing.push('otherPartyAddress');
    console.log('[Vehicle Agreement] Missing other party address');
  }

  // Validate payment method specific fields
  if (formData.paymentMethod === 'custom_date' && (!formData.paymentDate || formData.paymentDate.toString().trim() === '')) {
    missing.push('paymentDate');
    console.log('[Vehicle Agreement] Missing payment date for custom_date method');
  }

  // Validate price is a positive number
  if (formData.price) {
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      errors.price = 'Цената мора да биде позитивен број';
      console.log(`[Vehicle Agreement] Invalid price: ${formData.price}`);
    }
  }

  // Validate production year
  if (formData.productionYear) {
    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(formData.productionYear);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
      errors.productionYear = `Година на производство мора да биде помеѓу 1900 и ${currentYear + 1}`;
      console.log(`[Vehicle Agreement] Invalid production year: ${formData.productionYear}`);
    }
  }

  // Add warnings for common issues
  if (formData.userRole === 'seller') {
    warnings.push('Проверете дали сте овластени да го продавате возилото во име на компанијата.');
  } else {
    warnings.push('Проверете дали компанијата има доволно средства за купување на возилото.');
  }

  if (formData.registrationNumber && formData.registrationNumber.length < 6) {
    warnings.push('Проверете дали регистарскиот број е внесен правилно.');
  }

  const isValid = Object.keys(errors).length === 0 && missing.length === 0;
  console.log(`[Vehicle Agreement] Validation result - isValid: ${isValid}, errors: ${Object.keys(errors).length}, missing: ${missing.length}`);
  
  if (missing.length > 0) {
    console.log(`[Vehicle Agreement] Missing fields: ${missing.join(', ')}`);
  }
  
  if (Object.keys(errors).length > 0) {
    console.log(`[Vehicle Agreement] Validation errors:`, errors);
  }

  return {
    isValid,
    errors,
    warnings,
    missing
  };
};

// Create the controller using the base factory with no validation
const vehicleSalePurchaseAgreementController = createDocumentController({
  templateFunction: generateVehicleSalePurchaseAgreementDoc,
  requiredFields: [], // No required fields
  documentName: 'vehicle-sale-purchase-agreement',
  validateFunction: null // No validation
});

module.exports = vehicleSalePurchaseAgreementController;