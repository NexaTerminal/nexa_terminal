import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField, { ConditionalField } from '../../../../components/forms/FormField';
import { employmentAgreementConfig, getStepFields } from '../../../../config/documents/employmentAgreement';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Employment Agreement Page
 * Uses the reusable base components and configuration-driven approach
 * This page is now ~80% smaller than the original implementation
 */
const EmploymentAgreementPage = () => {
  
  /**
   * Custom step content renderer
   * This is the only document-specific logic needed
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = employmentAgreementConfig.steps.find(s => s.id === currentStep);

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
                onChange={handleInputChange}
                error={errors[field.name]}
                disabled={isGenerating}
              />
            )}
            
            {/* Conditional fields */}
            {field.condition && (
              <ConditionalField condition={field.condition} formData={formData}>
                <FormField
                  field={field}
                  value={formData[field.name]}
                  onChange={handleInputChange}
                  error={errors[field.name]}
                  disabled={isGenerating}
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