/**
 * Document Form Validation Engine
 * Centralized validation system for all document forms
 */

export const VALIDATION_TYPES = {
  REQUIRED: 'required',
  CONDITIONAL: 'conditional',
  ARRAY: 'array',
  EMAIL: 'email',
  NUMBER: 'number',
  DATE: 'date',
  PIN: 'pin' // Macedonian PIN validation - exactly 13 digits
};

export const createValidator = (validationRules) => {
  return (formData) => {
    const missing = [];
    const errors = {};

    validationRules.forEach(rule => {
      const value = formData[rule.field];

      switch (rule.type) {
        case VALIDATION_TYPES.REQUIRED:
          if (!value || (typeof value === 'string' && !value.trim())) {
            missing.push(rule.label);
            errors[rule.field] = `${rule.label} е задолжително поле`;
          }
          break;

        case VALIDATION_TYPES.CONDITIONAL:
          const conditionMet = evaluateCondition(rule.condition, formData);
          if (conditionMet && (!value || (typeof value === 'string' && !value.trim()))) {
            missing.push(rule.label);
            errors[rule.field] = `${rule.label} е задолжително поле`;
          }
          break;

        case VALIDATION_TYPES.ARRAY:
          if (!Array.isArray(value) || value.filter(item => item && item.trim()).length === 0) {
            missing.push(rule.label);
            errors[rule.field] = `${rule.label} мора да содржи најмалку една ставка`;
          }
          break;

        case VALIDATION_TYPES.EMAIL:
          if (value && !isValidEmail(value)) {
            errors[rule.field] = 'Внесете валидна електронска адреса';
          }
          break;

        case VALIDATION_TYPES.NUMBER:
          if (value && isNaN(value)) {
            errors[rule.field] = 'Внесете валиден број';
          }
          break;

        case VALIDATION_TYPES.DATE:
          if (value && !isValidDate(value)) {
            errors[rule.field] = 'Внесете валиден датум';
          }
          break;

        case VALIDATION_TYPES.PIN:
          if (value && !isValidPin(value)) {
            errors[rule.field] = 'ЕМБГ мора да содржи точно 13 цифри';
          }
          break;
      }
    });

    return { missing, errors, isValid: missing.length === 0 && Object.keys(errors).length === 0 };
  };
};

const evaluateCondition = (condition, formData) => {
  if (!condition) return true;
  
  const { field, operator, value } = condition;
  const fieldValue = formData[field];

  switch (operator) {
    case '===':
      return fieldValue === value;
    case '!==':
      return fieldValue !== value;
    case 'includes':
      return Array.isArray(fieldValue) && fieldValue.includes(value);
    case 'truthy':
      return Boolean(fieldValue);
    default:
      return true;
  }
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Macedonian PIN validation - must be exactly 13 digits
const isValidPin = (pin) => {
  if (!pin) return false;
  const cleanPin = pin.toString().replace(/\s/g, ''); // Remove spaces
  return /^\d{13}$/.test(cleanPin);
};

// Step validation helper
export const createStepValidator = (steps) => {
  return (stepId, formData) => {
    const step = steps.find(s => s.id === stepId);
    if (!step || !step.requiredFields) return true;

    return step.requiredFields.every(field => {
      const value = formData[field];
      if (Array.isArray(value)) {
        return value.some(item => item && item.trim());
      }
      return value && value.toString().trim();
    });
  };
};