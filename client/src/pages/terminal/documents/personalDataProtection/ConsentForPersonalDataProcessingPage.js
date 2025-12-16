import React from "react";
import BaseDocumentPage from "../../../../components/documents/BaseDocumentPage";
import FormField from "../../../../components/forms/FormField";
import consentForPersonalDataProcessingConfig from "../../../../config/documents/consentForPersonalDataProcessing";
import styles from "../../../../styles/terminal/documents/DocumentGeneration.module.css";

const ConsentForPersonalDataProcessingPage = () => {
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const step = consentForPersonalDataProcessingConfig.steps.find(s => s.id === currentStep);

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
      config={consentForPersonalDataProcessingConfig}
      renderStepContent={renderStepContent}
      title="Согласност за обработка на лични податоци"
      description="Пополнете ги потребните податоци за генерирање на согласност за обработка на лични податоци"
    />
  );
};

export default ConsentForPersonalDataProcessingPage;
