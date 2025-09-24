import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import { unpaidLeaveDecisionConfig, getStepFields } from '../../../../config/documents/unpaidLeaveDecision';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Unpaid Leave Decision Page
 * Uses the reusable base components and configuration-driven approach
 * This page generates the unpaid leave decision document
 */
const UnpaidLeaveDecisionPage = () => {

  /**
   * Custom step content renderer
   * This is the only document-specific logic needed
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = unpaidLeaveDecisionConfig.steps.find(s => s.id === currentStep);

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        {stepConfig.description && <p>{stepConfig.description}</p>}

        {stepFields.map(field => (
          <FormField
            key={field.name}
            field={field}
            value={formData[field.name]}
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
      config={unpaidLeaveDecisionConfig}
      renderStepContent={renderStepContent}
      title="Одлука за неплатено отсуство"
      description="Пополнете ги потребните податоци за издавање одлука за неплатено отсуство"
    />
  );
};

export default UnpaidLeaveDecisionPage;