import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import terminationDueToAgeLimitConfig from '../../../../config/documents/terminationDueToAgeLimit';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Termination Due to Age Limit Page
 * Uses the new architecture with BaseDocumentPage for consistency
 * Implements comprehensive multi-step form for age-based termination decision generation
 */

const TerminationDueToAgeLimitPage = () => {
  // Custom step content renderer for termination due to age limit information
  const renderStepContent = ({ currentStepData, formData, errors, handleInputChange, isGenerating }) => {
    const { fields } = terminationDueToAgeLimitConfig;
    
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

        {/* Add step-specific guidance */}
        {currentStepData.id === 1 && (
          <div className={styles['help-section']}>
              <h4>Важни информации за престанок поради возраст:</h4>
              <ul className={styles['help-list']}>
                <li>Согласно член 104 од Законот за работните односи: Договорот за вработување работодавачот го прекинува кога работникот ќе наполни 64 години возраст и 15 години пензиски стаж, доколку со друг закон поинаку не е уредено.</li>
              </ul>
          </div>
        )}

        {currentStepData.id === 2 && (
          <div className={styles['help-section']}>
            <div className={styles['warning-box']}>
              {/* <p><strong>⚠️ Важно:</strong> Датумот на престанок обично се определува во согласност со работникот и може да биде до крајот на тековниот месец или според договорно определен рок.</p> */}
            </div>
              <p><strong>Правни основи:</strong></p>
              <ul className={styles['help-list']}>
                <li>Работникот има право на отпремнина при одење во пензија, како и јубилејни награди.</li>
                <li>Автоматски престанок при исполнување услови за пензионирање</li>
              </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseDocumentPage
      config={terminationDueToAgeLimitConfig}
      renderStepContent={renderStepContent}
      title="Решение за Престанок поради Возраст"
      description="Генерирајте решение за престанок на работен однос поради достигнување на пензиска возраст според член 104 од ЗРО"
    />
  );
};

export default TerminationDueToAgeLimitPage;