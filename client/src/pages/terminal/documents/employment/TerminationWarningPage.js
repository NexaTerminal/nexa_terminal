import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import terminationWarningConfig, { getViolationDescriptions } from '../../../../config/documents/terminationWarning';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Termination Warning Page
 * Uses the new architecture with BaseDocumentPage for consistency
 * Implements comprehensive multi-step form for termination warning generation
 */

const TerminationWarningPage = () => {
  // Custom step content renderer for termination warning information
  const renderStepContent = ({ currentStepData, formData, errors, handleInputChange, isGenerating }) => {
    const { fields } = terminationWarningConfig;

    // Handle violation category change - fills both textareas
    const handleCategoryChange = (name, value) => {
      handleInputChange(name, value);
      if (value) {
        const { obligation, wrongdoing } = getViolationDescriptions(value);
        setTimeout(() => {
          handleInputChange('workTaskFailure', obligation);
          handleInputChange('employeeWrongDoing', wrongdoing);
        }, 0);
      }
    };

    // Handle decision date change - auto-fill fixing deadline to +15 days
    const handleDecisionDateChange = (name, value) => {
      handleInputChange(name, value);
      if (value) {
        const decisionDate = new Date(value);
        decisionDate.setDate(decisionDate.getDate() + 15);
        const fixingDate = decisionDate.toISOString().split('T')[0];
        setTimeout(() => {
          handleInputChange('fixingDeadline', fixingDate);
        }, 0);
      }
    };

    // Get fields for current step based on required fields
    const stepFields = currentStepData.requiredFields.map(fieldName => {
      const field = fields[fieldName];
      if (!field) return null;

      // Inject custom onChange handler for category dropdown
      if (fieldName === 'violationCategory') {
        return { ...field, customOnChange: handleCategoryChange };
      }
      // Inject custom onChange handler for decision date
      if (fieldName === 'decisionDate') {
        return { ...field, customOnChange: handleDecisionDateChange };
      }
      return field;
    }).filter(Boolean);

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
            onChange={field.customOnChange || handleInputChange}
            error={errors[field.name]}
            disabled={isGenerating}
          />
        ))}
      </div>
    );
  };

  return (
    <BaseDocumentPage
      config={terminationWarningConfig}
      renderStepContent={renderStepContent}
      title="Предупредување пред Откажување"
      description="Генерирајте предупредување пред откажување на договор за вработување според македонското трудово право"
    />
  );
};

export default TerminationWarningPage;