import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import employmentAnnexConfig from '../../../../config/documents/employmentAnnex';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Employment Annex Page
 * Uses the new architecture with BaseDocumentPage for consistency
 * Implements comprehensive multi-step form for employment agreement amendments
 */

const EmploymentAnnexPage = () => {
  // Custom step content renderer for employment annex information
  const renderStepContent = ({ currentStepData, formData, errors, handleInputChange, isGenerating }) => {
    const { fields } = employmentAnnexConfig;

    // Safety check - return null if currentStepData is undefined
    if (!currentStepData) {
      return null;
    }

    // Get all fields for the current step
    let stepFields = [];

    if (currentStepData.id === 3) {
      // For step 3, show all conditional fields - let FormField handle the showWhen logic
      stepFields = [
        // Duration change fields
        fields.durationType,
        fields.endDate,
        fields.durationChangedArticle,
        
        // Salary change fields
        fields.newBasicSalary,
        fields.salaryChangedArticle,
        
        // Position change fields
        fields.newJobPosition,
        fields.newJobTasks,
        fields.positionChangedArticle,
        
        // Other change fields
        fields.changedArticle,
        fields.otherAgreementChangeContent
      ].filter(Boolean);
    } else {
      // For steps 1 and 2, use the configured required fields
      stepFields = (currentStepData.requiredFields || []).map(fieldName => fields[fieldName]).filter(Boolean);
    }
    
    return (
      <div className={styles['form-section']}>
        <h3>{currentStepData.title}</h3>
        <p className={styles['section-description']}>{currentStepData.description}</p>
        
        {stepFields.map(field => (
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
      config={employmentAnnexConfig}
      renderStepContent={renderStepContent}
      title="Анекс на Договор за Вработување"
      description="Генерирајте анекс за измена на постоечки договор за вработување според македонското трудово право"
    />
  );
};

export default EmploymentAnnexPage;