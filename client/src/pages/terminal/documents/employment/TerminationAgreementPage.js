import React from "react";
import BaseDocumentPage from "../../../../components/documents/BaseDocumentPage";
import FormField from "../../../../components/forms/FormField";
import terminationAgreementConfig from "../../../../config/documents/terminationAgreement";
import styles from "../../../../styles/terminal/documents/DocumentGeneration.module.css";

const TerminationAgreementPage = () => {
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const step = terminationAgreementConfig.steps.find(s => s.id === currentStep);

    if (!step) return null;

    return (
      <div className={styles['form-section']}>
        <h3>{step.title}</h3>
        {step.description && <p className={styles['step-description']}>{step.description}</p>}

        {step.fields.map(field => (
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
      config={terminationAgreementConfig}
      renderStepContent={renderStepContent}
      title="Спогодба за престанок на работен однос"
      description="Пополнете ги потребните податоци за генерирање на спогодба за престанок на работниот однос"
    />
  );
};

export default TerminationAgreementPage; 