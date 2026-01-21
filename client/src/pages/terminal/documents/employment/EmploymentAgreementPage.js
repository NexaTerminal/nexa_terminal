import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField, { ConditionalField } from '../../../../components/forms/FormField';
import { employmentAgreementConfig, getStepFields } from '../../../../config/documents/employmentAgreement';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Format number with thousand separators (European style: 1.000)
 */
const formatMoneyDisplay = (value) => {
  if (!value) return '';
  const num = parseInt(String(value).replace(/\./g, ''), 10);
  if (isNaN(num)) return value;
  return num.toLocaleString('de-DE');
};

/**
 * Parse formatted money string back to number
 */
const parseMoneyInput = (value) => {
  if (!value) return '';
  return String(value).replace(/\./g, '');
};

/**
 * Get display value for money fields
 */
const getDisplayValue = (fieldName, value) => {
  if (fieldName === 'netSalary' || fieldName === 'concurrentClauseCompensation') {
    return formatMoneyDisplay(value);
  }
  return value;
};

/**
 * Check if compensation matches expected auto-calculated value
 */
const isCompensationAutoCalculated = (salary, compensation) => {
  if (!salary || !compensation) return true;
  const salaryNum = parseInt(parseMoneyInput(salary), 10);
  const compensationNum = parseInt(parseMoneyInput(compensation), 10);
  const expected = Math.round(salaryNum * 0.5);
  return compensationNum === expected;
};

/**
 * Create enhanced input change handler with auto-calculation for compensation
 */
const createEnhancedHandler = (handleInputChange, formData) => {
  return (name, value) => {
    // Handle salary input - auto-calculate compensation
    if (name === 'netSalary') {
      const cleanValue = parseMoneyInput(value);
      handleInputChange(name, cleanValue);

      // Auto-calculate compensation (50% of salary) if it matches expected value or is empty
      if (formData.concurrentClause) {
        const wasAutoCalculated = isCompensationAutoCalculated(formData.netSalary, formData.concurrentClauseCompensation);
        if (wasAutoCalculated || !formData.concurrentClauseCompensation) {
          const salary = parseInt(cleanValue, 10);
          if (!isNaN(salary) && salary > 0) {
            const compensation = Math.round(salary * 0.5);
            handleInputChange('concurrentClauseCompensation', String(compensation));
          }
        }
      }
      return;
    }

    // Handle compensation input - just parse
    if (name === 'concurrentClauseCompensation') {
      handleInputChange(name, parseMoneyInput(value));
      return;
    }

    // When concurrent clause is enabled, auto-fill compensation if salary exists
    if (name === 'concurrentClause' && value === true) {
      const salary = parseInt(parseMoneyInput(formData.netSalary), 10);
      if (!isNaN(salary) && salary > 0) {
        const compensation = Math.round(salary * 0.5);
        handleInputChange('concurrentClauseCompensation', String(compensation));
      }
    }

    // Default handling for other fields
    handleInputChange(name, value);
  };
};

/**
 * Employment Agreement Page
 * Uses the reusable base components and configuration-driven approach
 */
const EmploymentAgreementPage = () => {
  /**
   * Custom step content renderer
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = employmentAgreementConfig.steps.find(s => s.id === currentStep);
    const enhancedHandleInputChange = createEnhancedHandler(handleInputChange, formData);

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        {stepConfig.description && <p>{stepConfig.description}</p>}

        {stepFields.map(field => (
          <React.Fragment key={field.name}>
            {/* Regular fields */}
            {!field.condition && (
              <FormField
                field={field}
                value={getDisplayValue(field.name, formData[field.name])}
                onChange={enhancedHandleInputChange}
                error={errors[field.name]}
                disabled={isGenerating}
                formData={formData}
              />
            )}

            {/* Conditional fields */}
            {field.condition && (
              <ConditionalField condition={field.condition} formData={formData}>
                <FormField
                  field={field}
                  value={getDisplayValue(field.name, formData[field.name])}
                  onChange={enhancedHandleInputChange}
                  error={errors[field.name]}
                  disabled={isGenerating}
                  formData={formData}
                />
              </ConditionalField>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <BaseDocumentPage
      config={employmentAgreementConfig}
      renderStepContent={renderStepContent}
      title="Договор за вработување"
      description="Пополнете ги потребните податоци за генерирање на договор за вработување"
    />
  );
};

export default EmploymentAgreementPage;
