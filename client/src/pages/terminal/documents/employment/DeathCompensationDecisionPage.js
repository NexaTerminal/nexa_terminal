import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import deathCompensationDecisionConfig from '../../../../config/documents/deathCompensationDecision';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Death Compensation Decision Page
 * Uses the new architecture with BaseDocumentPage for consistency
 * Implements multi-step form for employee and family member data collection
 */

const DeathCompensationDecisionPage = () => {
  // Custom step content renderer
  const renderStepContent = ({ currentStepData, formData, errors, handleInputChange, isGenerating }) => {
    const { fields } = deathCompensationDecisionConfig;

    // Get fields for current step based on required fields
    const stepFields = Object.values(fields).filter(field =>
      currentStepData.requiredFields.includes(field.name) ||
      (!field.required && shouldShowField(field, formData))
    );

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

  // Helper function to determine if a field should be shown
  const shouldShowField = (field, formData) => {
    if (!field.conditional) return true;

    return formData[field.conditional.field] === field.conditional.value;
  };

  return (
    <BaseDocumentPage
      config={deathCompensationDecisionConfig}
      renderStepContent={renderStepContent}
      title="Одлука за исплата на надомест во случај на смрт на член на семејно домаќинство"
      description="Генерирајте одлука за исплата на надомест во случај на смрт на член на семејно домаќинство според член 35 од Општиот колективен договор"
    />
  );
};

export default DeathCompensationDecisionPage;