const { createDocumentController, validators, cleanFormData } = require('../../utils/baseDocumentController');
const generateDeathCompensationDecisionDoc = require('../../document_templates/employment/deathCompensationDecision');

/**
 * Death Compensation Decision Controller
 * Uses the base controller factory for common functionality
 * Following established architectural patterns for consistency
 */

// Required fields for the document
const REQUIRED_FIELDS = [
  'employeeName',
  'familyMember',
  'compensationAmount',
  'decisionDate',
  'paymentDate'
];

/**
 * Validation function for death compensation decision
 */
const validateDeathCompensationDecision = (formData) => {
  const warnings = [];
  const errors = {};
  const missing = [];

  // Check required fields
  REQUIRED_FIELDS.forEach(field => {
    if (!formData[field] || formData[field].toString().trim() === '') {
      missing.push(field);
    }
  });

  // Validate compensation amount format
  if (formData.compensationAmount) {
    const amount = formData.compensationAmount.toString().replace(/[^\d]/g, '');
    if (!amount || isNaN(parseInt(amount))) {
      errors.compensationAmount = 'Внесете валиден износ на надомест';
    } else if (parseInt(amount) <= 0) {
      errors.compensationAmount = 'Износот мора да биде поголем од нула';
    }
  }

  // Validate dates
  if (formData.decisionDate && formData.paymentDate) {
    const decisionDate = new Date(formData.decisionDate);
    const paymentDate = new Date(formData.paymentDate);

    if (paymentDate < decisionDate) {
      errors.paymentDate = 'Датумот на исплата не може да биде пред датумот на одлуката';
    }
  }

  // Employee name validation
  if (formData.employeeName && formData.employeeName.trim().length < 2) {
    errors.employeeName = 'Внесете валидно име на вработен';
  }

  // Family member validation
  if (formData.familyMember && formData.familyMember.trim().length < 2) {
    errors.familyMember = 'Внесете валидно име на член на семејно домаќинство';
  }

  // Business logic warnings
  if (formData.compensationAmount) {
    const amount = parseInt(formData.compensationAmount.toString().replace(/[^\d]/g, ''));
    if (amount && amount > 100000) {
      warnings.push('Износот на надомест е високо над просечните износи. Проверете ја точноста.');
    }
  }

  return {
    isValid: missing.length === 0 && Object.keys(errors).length === 0,
    warnings,
    errors,
    missing
  };
};

/**
 * Preprocess form data before document generation
 */
const preprocessDeathCompensationData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Format employee name (capitalize first letters)
  if (processed.employeeName) {
    processed.employeeName = processed.employeeName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Format family member name (capitalize first letters)
  if (processed.familyMember) {
    processed.familyMember = processed.familyMember
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Ensure compensation amount is properly formatted
  if (processed.compensationAmount) {
    const cleanAmount = processed.compensationAmount.toString().replace(/[^\d]/g, '');
    processed.compensationAmount = cleanAmount;
  }

  return processed;
};

// Create the death compensation decision controller using the base factory
const deathCompensationDecisionController = createDocumentController({
  templateFunction: generateDeathCompensationDecisionDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'одлука-за-надомест-при-смрт',
  validateFunction: validateDeathCompensationDecision,
  preprocessFunction: preprocessDeathCompensationData
});

module.exports = deathCompensationDecisionController;