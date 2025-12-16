import React from "react";
import BaseDocumentPage from "../../../../components/documents/BaseDocumentPage";
import FormField from "../../../../components/forms/FormField";
import procedureForEstimationConfig from "../../../../config/documents/procedureForEstimation";
import styles from "../../../../styles/terminal/documents/DocumentGeneration.module.css";

const ProcedureForEstimationPage = () => {
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const step = procedureForEstimationConfig.steps.find(s => s.id === currentStep);

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
      config={procedureForEstimationConfig}
      renderStepContent={renderStepContent}
      title="Процедура за проценка на влијанието врз заштитата на личните податоци"
      description="DPIA процедура согласно ЗЗЛП"
    />
  );
};

export default ProcedureForEstimationPage;