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
              <p><strong>Законска основа:</strong> Согласно член 71 од Законот за работни односи, Работникот може да го откаже договорот за вработување ако писмено изјави дека сака да го откаже договорот за вработување. Законот не пропишува точна форма на изјава, туку единствено упатува дека истата треба да е писмена. Согласно на тоа, било која форма на писмено изнесување на волјата за престанок на работниот однос од страна на работникот треба да се смета за прифатлива (допис до архива, маил порака до надлежно лице, препорачана пратка и сл.)</p>
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
              <p><strong>Отказен рок:</strong> Според член 88 од Законот, ако работникот го откажува договорот за вработување, отказниот рок е
еден месец. Со договорот за вработување или со колективниот договор може да биде договорен подолг отказен рок, меѓутоа не подолг од три месеца.</p>
            </div>
          </div>
        )}
        {currentStepData.id === 3 && (
          <div className={styles['help-section']}>
            <div className={styles['legal-notice']}>
              <p> Отказниот рок е период во кој работникот има должност да се јавува на работа и да врши работни задачи во целост, а непостапувањето согалсно овој рок може да биде причина за предизвикување на штета на работодавачот која може да ја бара од работникот.</p>
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