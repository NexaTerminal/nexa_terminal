import React from "react";
import BaseDocumentPage from "../../../../components/documents/BaseDocumentPage";
import FormField from "../../../../components/forms/FormField";
import terminationDecisionDueToDurationConfig from "../../../../config/documents/terminationDecisionDueToDuration";
import styles from "../../../../styles/terminal/documents/DocumentGeneration.module.css";

const TerminationDecisionDueToDurationPage = () => {
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const step = terminationDecisionDueToDurationConfig.steps.find(s => s.id === currentStep);

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
      config={terminationDecisionDueToDurationConfig}
      renderStepContent={renderStepContent}
      title="Одлука за престанок поради истек на времето"
      description="Пополнете ги потребните податоци за генерирање на одлука за престанок на работниот однос поради истек на времето"
    />
  );
};

export default TerminationDecisionDueToDurationPage;