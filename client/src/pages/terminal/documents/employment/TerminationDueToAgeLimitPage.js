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
            <div className={styles['info-box']}>
              <h4>Важни информации за престанок поради возраст:</h4>
              <ul className={styles['help-list']}>
                <li>Работниот однос престанува кога работникот ќе наполни 64 години возраст</li>
                <li>Потребен е најмалку 15 години пензиски стаж</li>
                <li>Овој тип на престанок е автоматски според член 104 од ЗРО</li>
                <li>ЕМБГ-от мора да биде точен за правилно генерирање на документот</li>
              </ul>
            </div>
          </div>
        )}

        {currentStepData.id === 2 && (
          <div className={styles['help-section']}>
            <div className={styles['warning-box']}>
              <p><strong>⚠️ Важно:</strong> Датумот на престанок обично се определува во согласност со работникот и може да биде до крајот на тековниот месец или според договорно определен рок.</p>
            </div>
            <div className={styles['info-box']}>
              <p><strong>Правни основи:</strong></p>
              <ul className={styles['help-list']}>
                <li>Член 104 од Законот за работни односи</li>
                <li>Автоматски престанок при исполнување услови за пензионирање</li>
                <li>Право на приговор во рок од 8 дена</li>
              </ul>
            </div>
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