const { createDocumentController } = require('../../utils/baseDocumentController');
const generateBonusPaymentDoc = require('../../document_templates/employment/bonusPayment');

/**
 * Bonus Payment Controller
 * Uses the modern baseDocumentController factory pattern for consistency
 * Implements warning-based validation instead of blocking errors
 */

/**
 * Custom validation function for bonus payment documents
 * Returns warnings instead of blocking errors to allow user flexibility
 */
const validateBonusPayment = (formData, user, company) => {
  const warnings = [];
  const errors = {};
  const missing = [];

  // Employee name validation
  if (!formData.employeeName || !formData.employeeName.trim()) {
    warnings.push('Името на работникот не е внесено - ќе се прикаже како празно поле во документот');
    missing.push('employeeName');
  }

  // Work position validation
  if (!formData.employeeWorkPosition || !formData.employeeWorkPosition.trim()) {
    warnings.push('Работната позиција не е внесена - ќе се прикаже како празно поле во документот');
    missing.push('employeeWorkPosition');
  }

  // Bonus amount validation
  if (!formData.bonusAmount || !formData.bonusAmount.trim()) {
    warnings.push('Износот на бонусот не е внесен - ќе се прикаже како празно поле во документот');
    missing.push('bonusAmount');
  } else {
    // Validate numeric format if provided
    const amount = formData.bonusAmount.replace(/[^\d.,]/g, '');
    if (amount && isNaN(parseFloat(amount.replace(',', '.')))) {
      warnings.push('Износот на бонусот не изгледа како валиден број - проверете го форматот');
    }
  }

  // Bonus reason validation (optional but recommended)
  if (!formData.bonusReason || !formData.bonusReason.trim()) {
    warnings.push('Причината за бонусот не е внесена - ќе се користи стандарден текст');
  }

  // Decision date validation
  if (!formData.decisionDate) {
    warnings.push('Датумот на одлуката не е внесен - ќе се користи денешниот датум');
  }

  // Company data validation
  if (!company.companyName || !company.companyName.trim()) {
    warnings.push('Името на компанијата недостасува - проверете ги податоците на компанијата');
  }
  
  if (!company.address || !company.address.trim()) {
    warnings.push('Адресата на компанијата недостасува - проверете ги податоците на компанијата');
  }
  
  if (!company.taxNumber || !company.taxNumber.trim()) {
    warnings.push('ЕМБС на компанијата недостасува - проверете ги податоците на компанијата');
  }
  
  if (!company.manager || !company.manager.trim()) {
    warnings.push('Управителот на компанијата недостасува - проверете ги податоците на компанијата');
  }

  // Always return as valid with warnings - never block document generation
  return {
    isValid: true,
    warnings: warnings,
    errors: errors,
    missing: missing
  };
};

/**
 * Data preprocessing function
 * Cleans and formats data before passing to template
 */
const preprocessBonusPaymentData = (formData, user, company) => {
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
  
  return processed;
};

// Create the controller using the factory pattern
const bonusPaymentController = createDocumentController({
  templateFunction: generateBonusPaymentDoc,
  documentName: 'bonus-payment',
  validateFunction: validateBonusPayment,
  preprocessFunction: preprocessBonusPaymentData,
  requiredFields: [] // Using custom validation instead of basic required fields
});

module.exports = bonusPaymentController;