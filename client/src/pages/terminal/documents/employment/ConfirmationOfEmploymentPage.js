import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import confirmationOfEmploymentConfig from '../../../../config/documents/confirmationOfEmployment';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Confirmation of Employment Page
 * Uses the new architecture with BaseDocumentPage for consistency
 * Reduced from ~170 lines to ~40 lines using configuration-driven approach
 */

const ConfirmationOfEmploymentPage = () => {
  // Custom step content renderer for employee information
  const renderStepContent = ({ currentStepData, formData, errors, handleInputChange, isGenerating }) => {
    const { fields } = confirmationOfEmploymentConfig;
    
    return (
      <div className={styles['form-section']}>
        <h3>{currentStepData.title}</h3>
        <p className={styles['section-description']}>{currentStepData.description}</p>
        
        {Object.values(fields).map(field => (
          <FormField
            key={field.name}
            field={field}
            value={formData[field.name]}
            formData={formData}
            onChange={handleInputChange}
            error={errors[field.name]}
            disabled={isGenerating}
          />
        ))}
      </div>
    );
  };

  return (
    <BaseDocumentPage
      config={confirmationOfEmploymentConfig}
      renderStepContent={renderStepContent}
      title="Потврда за Вработување"
      description="Внесете ги потребните податоци за генерирање потврда за вработување"
    />
  );
};

export default ConfirmationOfEmploymentPage; 