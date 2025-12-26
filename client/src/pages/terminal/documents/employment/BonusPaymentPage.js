import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField, { ConditionalField } from '../../../../components/forms/FormField';
import { bonusPaymentConfig, getStepFields } from '../../../../config/documents/bonusPayment';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Bonus Payment Page
 * Uses the reusable base components and configuration-driven approach
 * This page generates decisions for employee bonus payments
 */
const BonusPaymentPage = () => {
  
  /**
   * Custom step content renderer
   * This is the only document-specific logic needed
   */
  const renderStepContent = ({ currentStep, currentStepData, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);

    // Safety check - return null if currentStepData is undefined
    if (!currentStepData) {
      return null;
    }

    return (
      <div className={styles['form-section']}>
        <h3>{currentStepData.title}</h3>
        {currentStepData.description && <p>{currentStepData.description}</p>}

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
                formData={formData}
              />
            )}
            
            {/* Conditional fields (if any are added later) */}
            {field.condition && (
              <ConditionalField condition={field.condition} formData={formData}>
                <FormField
                  field={field}
                  value={formData[field.name]}
                  onChange={handleInputChange}
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
      config={bonusPaymentConfig}
      renderStepContent={renderStepContent}
      title="Одлука за бонус плаќање"
      description="Пополнете ги потребните податоци за издавање одлука за исплата на работна успешност (бонус) до вработен"
    />
  );
};

export default BonusPaymentPage;