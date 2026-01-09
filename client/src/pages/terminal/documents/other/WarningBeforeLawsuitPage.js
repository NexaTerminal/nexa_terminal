import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField, { ConditionalField } from '../../../../components/forms/FormField';
import { warningBeforeLawsuitConfig, getStepFields } from '../../../../config/documents/warningBeforeLawsuit';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Warning Before Lawsuit Page
 * Uses the reusable base components and configuration-driven approach
 * This page generates pre-litigation warning letters for debt collection
 * Category: Other Business Documents (Други деловни документи)
 */
const WarningBeforeLawsuitPage = () => {

  /**
   * Format number with thousand separators (1.000 format)
   */
  const formatAmount = (value) => {
    if (!value) return '';
    // Remove all non-digit characters
    const numericValue = value.toString().replace(/\D/g, '');

    // Add thousand separators
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  /**
   * Custom step content renderer
   * This is the only document-specific logic needed
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = warningBeforeLawsuitConfig.steps.find(s => s.id === currentStep);

    /**
     * Handle amount field with formatting
     * FormField passes (name, value) as separate parameters
     */
    const handleAmountChange = (name, value) => {
      const formattedValue = formatAmount(value);
      handleInputChange(name, formattedValue);
    };

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
                value={formData[field.name]}
                onChange={field.name === 'totalAmountToBePaid' ? handleAmountChange : handleInputChange}
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
                  value={formData[field.name]}
                  onChange={field.name === 'totalAmountToBePaid' ? handleAmountChange : handleInputChange}
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
      config={warningBeforeLawsuitConfig}
      renderStepContent={renderStepContent}
      title="Опомена пред тужба"
      description="Креирајте формална опомена до должникот пред поведување на судска постапка за наплата на долг"
    />
  );
};

export default WarningBeforeLawsuitPage;
