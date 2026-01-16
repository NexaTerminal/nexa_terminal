import React, { useEffect, useRef } from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField, { ConditionalField } from '../../../../components/forms/FormField';
import { warningLetterConfig, getStepFields, getWrongDoingDescription } from '../../../../config/documents/warningLetter';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Warning Letter Page
 * Uses the reusable base components and configuration-driven approach
 * This page generates warning letters for employee misconduct
 */
const WarningLetterPage = () => {
  const formDataRef = useRef(null);

  /**
   * Custom step content renderer
   * This is the only document-specific logic needed
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = warningLetterConfig.steps.find(s => s.id === currentStep);

    // Store formData in ref
    formDataRef.current = formData;

    // Handle category change and auto-fill description
    const handleCategoryChange = (name, value) => {
      // Call original handleInputChange for the category
      handleInputChange(name, value);

      // Auto-fill the description based on selected category
      if (value) {
        const description = getWrongDoingDescription(value);

        // Update employeeWrongDoing field
        setTimeout(() => {
          handleInputChange('employeeWrongDoing', description);
        }, 0);
      }
    };

    // Map fields and inject custom onChange for wrongDoingCategory
    const mappedFields = stepFields.map(field => {
      if (field.name === 'wrongDoingCategory') {
        return {
          ...field,
          onChange: handleCategoryChange
        };
      }
      return field;
    });

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        {stepConfig.description && <p>{stepConfig.description}</p>}

        {mappedFields.map(field => (
          <React.Fragment key={field.name}>
            {/* Regular fields */}
            {!field.condition && (
              <FormField
                field={field}
                value={formData[field.name]}
                onChange={field.onChange || handleInputChange}
                error={errors[field.name]}
                disabled={isGenerating}
                formData={formData}
              />
            )}

            {/* Conditional fields (if any are added later) */}
            {field.condition && (
              <ConditionalField condition={field.condition} formData={formData}>
                <FormField
                  field={field}
                  value={formData[field.name]}
                  onChange={field.onChange || handleInputChange}
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
      config={warningLetterConfig}
      renderStepContent={renderStepContent}
      title="Опомена до вработен"
      description="Пополнете ги потребните податоци за издавање опомена до работник поради прекршување на работни обврски"
    />
  );
};

export default WarningLetterPage;