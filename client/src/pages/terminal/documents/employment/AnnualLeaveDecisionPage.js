import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import { annualLeaveDecisionConfig, getStepFields } from '../../../../config/documents/annualLeaveDecision';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Annual Leave Decision Page
 * Uses the reusable base components and configuration-driven approach
 * This page generates both the decision document and employee request
 */
const AnnualLeaveDecisionPage = () => {
  
  /**
   * Custom step content renderer
   * This is the only document-specific logic needed
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = annualLeaveDecisionConfig.steps.find(s => s.id === currentStep);

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
      config={annualLeaveDecisionConfig}
      renderStepContent={renderStepContent}
      title="Решение за годишен одмор"
      description="Пополнете ги потребните податоци за издавање решение за годишен одмор"
    />
  );
};

export default AnnualLeaveDecisionPage;
