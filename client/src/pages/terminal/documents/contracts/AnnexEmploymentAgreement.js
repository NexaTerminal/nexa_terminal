import React from "react";
import BaseDocumentPage from "../../../../components/documents/BaseDocumentPage";
import FormField from "../../../../components/forms/FormField";
import annexEmploymentAgreementConfig from "../../../../config/documents/annexEmploymentAgreement";
import styles from "../../../../styles/terminal/documents/DocumentGeneration.module.css";

const AnnexEmploymentAgreement = () => {
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const step = annexEmploymentAgreementConfig.steps.find(s => s.id === currentStep);

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
      config={annexEmploymentAgreementConfig}
      renderStepContent={renderStepContent}
      title="Анекс на Договор за Вработување"
      description="Креирајте професионален анекс на договор за вработување со повеќе чекори и генерирање на DOCX"
    />
  );
};

export default AnnexEmploymentAgreement;
