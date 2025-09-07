import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import terminationPersonalReasonsConfig from '../../../../config/documents/terminationPersonalReasons';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Termination Decision Due to Personal Reasons Page
 * Uses the new architecture with BaseDocumentPage for consistency
 * Implements comprehensive multi-step form for termination decision generation
 */

const TerminationPersonalReasonsPage = () => {
  // Custom step content renderer for termination personal reasons information
  const renderStepContent = ({ currentStepData, formData, errors, handleInputChange, isGenerating }) => {
    const { fields } = terminationPersonalReasonsConfig;
    
    // Get fields for current step based on required fields
    const stepFields = currentStepData.requiredFields.map(fieldName => fields[fieldName]).filter(Boolean);
    
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

        {/* Add step-specific technical guidance */}
        {currentStepData.id === 1 && (
          <div className={styles['help-section']}>
            <div className={styles['info-box']}>
              <p><strong>Совет:</strong> Користете ги податоците од личната карта и договорот за работа.</p>
            </div>
          </div>
        )}

        {currentStepData.id === 2 && (
          <div className={styles['help-section']}>
            <ul className={styles['help-list']}>
              <li>Работна позиција: точно како во договорот</li>
              <li>Датум на започнување: од договорот за работа</li>
              <li>Проверете ги сите датуми</li>
            </ul>
          </div>
        )}

        {currentStepData.id === 3 && (
          <div className={styles['help-section']}>
            <p className={styles['help-text']}>
              <strong>Лични причини:</strong> Здравствени проблеми, семејни околности или други лични причини.
            </p>
            <div className={styles['info-box']}>
              <p><strong>Совет:</strong> Кратко и јасно објаснување на околностите.</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseDocumentPage
      config={terminationPersonalReasonsConfig}
      renderStepContent={renderStepContent}
      title="Одлука за Престанок поради Лични Причини"
      description="Генерирајте одлука за престанок на договор за вработување поради лични причини на страна на работникот според македонското трудово право"
    />
  );
};

export default TerminationPersonalReasonsPage;