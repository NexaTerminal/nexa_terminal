import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import terminationByEmployeeRequestConfig from '../../../../config/documents/terminationByEmployeeRequest';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Termination by Employee Request Page
 * Uses the new architecture with BaseDocumentPage for consistency
 * Implements comprehensive multi-step form for termination by employee request generation
 * Based on Article 71 of the Macedonian Labor Law
 */

const TerminationByEmployeeRequestPage = () => {
  // Custom step content renderer for termination by employee request information
  const renderStepContent = ({ currentStepData, formData, errors, handleInputChange, isGenerating }) => {
    const { fields } = terminationByEmployeeRequestConfig;
    
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
            <p className={styles['help-text']}>
              <strong>Совет:</strong> Внесете ги точните податоци за работникот како што се наведени во договорот за работа.
            </p>
            <div className={styles['info-box']}>
              <p><strong>Законска основа:</strong> Член 71 од Законот за работни односи овозможува работникот да го откаже договорот за вработување со писмена изјава.</p>
            </div>
          </div>
        )}

        {currentStepData.id === 2 && (
          <div className={styles['help-section']}>
            <p className={styles['help-text']}>
              <strong>Важно:</strong> Внесете ги точните податоци од поднесеното барање за престанок на работниот однос.
            </p>
            <ul className={styles['help-list']}>
              <li>Бројот на барањето треба да одговара со интерниот систем за евиденција</li>
              <li>Датумот на поднесување мора да биде точен</li>
              <li>Датумот на престанок треба да го почитува отказниот рок</li>
            </ul>
            <div className={styles['warning-box']}>
              <p><strong>Отказен рок:</strong> Според член 88 од Законот, работникот мора да почитува отказен рок од најмалку еден месец.</p>
            </div>
          </div>
        )}

        {currentStepData.id === 3 && (
          <div className={styles['help-section']}>
            <p className={styles['help-text']}>
              <strong>Датум на решението:</strong> Внесете го датумот кога работодавачот официјално го донесува решението за престанок.
            </p>
            <div className={styles['info-box']}>
              <p><strong>Процедура:</strong> Решението се донесува откако ќе биде утврдено дека се исполнети условите од член 71 од Законот за работни односи.</p>
            </div>
            <div className={styles['legal-notice']}>
              <h4>Правна поука:</h4>
              <p>Против решението работникот има право на приговор во рок од 8 дена од приемот до надлежниот орган на друштвото.</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseDocumentPage
      config={terminationByEmployeeRequestConfig}
      renderStepContent={renderStepContent}
      title="Решение за Престанок на Работен Однос - Барање од Работник"
      description="Генерирајте решение за престанок на работен однос по барање на работникот според македонското трудово право (член 71)"
    />
  );
};

export default TerminationByEmployeeRequestPage;