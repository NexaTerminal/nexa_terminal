import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import employmentAnnexConfig from '../../../../config/documents/employmentAnnex';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Employment Annex Page
 * Uses the new architecture with BaseDocumentPage for consistency
 * Implements comprehensive multi-step form for employment agreement amendments
 */

const EmploymentAnnexPage = () => {
  // Custom step content renderer for employment annex information
  const renderStepContent = ({ currentStepData, formData, errors, handleInputChange, isGenerating }) => {
    const { fields } = employmentAnnexConfig;
    
    // Get all fields for the current step
    let stepFields = [];
    
    if (currentStepData.id === 3) {
      // For step 3, show all conditional fields - let FormField handle the showWhen logic
      stepFields = [
        // Duration change fields
        fields.durationType,
        fields.endDate,
        fields.durationChangedArticle,
        
        // Salary change fields
        fields.newBasicSalary,
        fields.salaryChangedArticle,
        
        // Position change fields
        fields.newJobPosition,
        fields.newJobTasks,
        fields.positionChangedArticle,
        
        // Other change fields
        fields.changedArticle,
        fields.otherAgreementChangeContent
      ].filter(Boolean);
    } else {
      // For steps 1 and 2, use the configured required fields
      stepFields = currentStepData.requiredFields.map(fieldName => fields[fieldName]).filter(Boolean);
    }
    
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
              <strong>Совет:</strong> Внесете ги точните податоци како што се наведени во оригиналниот договор за вработување.
            </p>
            <div className={styles['info-box']}>
              <p><strong>Важно:</strong> ЕМБГ мора да содржи точно 13 цифри без размаци или црти.</p>
            </div>
          </div>
        )}

        {currentStepData.id === 2 && (
          <div className={styles['help-section']}>
            <p className={styles['help-text']}>
              <strong>Изберете го типот на измена:</strong> Во зависност од Вашиот избор, во следниот чекор ќе ви бидат прикажани соодветните полиња.
            </p>
            <div className={styles['info-section']}>
              <h4>Типови на измени:</h4>
              <ul className={styles['help-list']}>
                <li><strong>Времетраење:</strong> За продолжување или скратување на договорот</li>
                <li><strong>Основна плата:</strong> За зголемување или намалување на платата</li>
                <li><strong>Работна позиција:</strong> За промена на должност или работно место</li>
                <li><strong>Друга измена:</strong> За промена на било кој друг дел од договорот</li>
              </ul>
            </div>
          </div>
        )}

        {currentStepData.id === 3 && formData.changeType === 'agreementDuration' && (
          <div className={styles['help-section']}>
            <p className={styles['help-text']}>
              <strong>Измена на времетраење:</strong> Изберете дали договорот ќе биде на определено или неопределено време.
            </p>
            <div className={styles['info-box']}>
              <p><strong>Напомена:</strong> Ако изберете определено време, ќе треба да внесете краен датум за договорот.</p>
            </div>
          </div>
        )}

        {currentStepData.id === 3 && formData.changeType === 'basicSalary' && (
          <div className={styles['help-section']}>
            <p className={styles['help-text']}>
              <strong>Измена на основна плата:</strong> Внесете ја новата основна плата и наведете го членот кој се менува.
            </p>
            <div className={styles['warning-box']}>
              <p><strong>Важно:</strong> Промената на платата мора да биде во согласност со колективните договори и минималната плата во земјата.</p>
            </div>
          </div>
        )}

        {currentStepData.id === 3 && formData.changeType === 'jobPosition' && (
          <div className={styles['help-section']}>
            <p className={styles['help-text']}>
              <strong>Измена на работна позиција:</strong> Внесете ја новата позиција, задачите и наведете го членот кој се менува.
            </p>
            <div className={styles['info-box']}>
              <p><strong>Совет:</strong> Бидете детални во описот на новите работни задачи за да избегнете недоразбирање.</p>
            </div>
          </div>
        )}

        {currentStepData.id === 3 && formData.changeType === 'otherAgreementChange' && (
          <div className={styles['help-section']}>
            <p className={styles['help-text']}>
              <strong>Друга измена:</strong> Наведете го членот кој се менува и внесете го новиот текст.
            </p>
            <div className={styles['warning-box']}>
              <p><strong>Внимание:</strong> Бидете прецизни во дефинирањето на новиот текст. Избегнувајте двосмислености кои можат да создадат правни проблеми.</p>
            </div>
          </div>
        )}

        {currentStepData.id === 3 && !formData.changeType && (
          <div className={styles['warning-section']}>
            <p className={styles['warning-text']}>
              <strong>Ве молиме најпрво изберете го типот на измена во претходниот чекор.</strong>
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseDocumentPage
      config={employmentAnnexConfig}
      renderStepContent={renderStepContent}
      title="Анекс на Договор за Вработување"
      description="Генерирајте анекс за измена на постоечки договор за вработување според македонското трудово право"
    />
  );
};

export default EmploymentAnnexPage;