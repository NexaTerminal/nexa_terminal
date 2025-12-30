import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import { ndaConfig, getStepFields } from '../../../../config/documents/nda';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * NDA (Non-Disclosure Agreement) Page
 * Uses the reusable base components and configuration-driven approach
 * Implements a comprehensive NDA form with multi-step workflow
 */
const NdaPage = () => {

  /**
   * Custom step content renderer
   * This handles the document-specific form logic
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep, formData);
    const stepConfig = ndaConfig.steps.find(s => s.id === currentStep);

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        {stepConfig.description && <p className={styles['step-description']}>{stepConfig.description}</p>}

        {currentStep === 1 && (
          <div className={styles['info-box']}>
            <p>
              <strong>Информација:</strong> Вашата компанија (од профилот) е секогаш првата договорна страна.
              Внесете ги податоците за втората договорна страна со која склучувате договор за доверливост.
            </p>
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles['info-box']}>
            <p>
              <strong>Важно:</strong> Договорот за доверливост ги заштитува бизнис информациите,
              технолошките решенија, клиентските листи, финансиските податоци и други доверливи информации
              меѓу договорните страни.
            </p>
          </div>
        )}

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
      config={ndaConfig}
      renderStepContent={renderStepContent}
      title="Договор за доверливост на информации (NDA)"
      description="Создајте професионален договор за доверливост на информации за заштита на деловните тајни и осетливите информации"
    />
  );
};

export default NdaPage;
