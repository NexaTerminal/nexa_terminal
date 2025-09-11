import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import { personalDataRulebookConfig, getStepFields } from '../../../../config/documents/personalDataRulebook';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Business Secret Protection Rulebook Page
 * Uses the reusable base components and configuration-driven approach
 * Implements a comprehensive business secret protection rulebook according to Article 35 of Labor Relations Law
 */
const PersonalDataRulebookPage = () => {
  
  /**
   * Custom step content renderer
   * This handles the document-specific form logic including informational messages
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = personalDataRulebookConfig.steps.find(s => s.id === currentStep);

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        {stepConfig.description && <p className={styles['step-description']}>{stepConfig.description}</p>}
        
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className={styles['info-box']}>
            <p>
              <strong>Правна основа:</strong> Овој правилник се базира на член 35 од Законот за работни односи 
              и ги определува мерките за заштита на деловните тајни, know-how и доверливи информации во вашата компанија.
            </p>
          </div>
        )}

        {/* Step 2: Protected Information */}
        {currentStep === 2 && (
          <div className={styles['info-box']}>
            <p>
              <strong>Заштита на интелектуална сопственост:</strong> Дефинирајте ги специфичните производи, услуги, 
              процеси или технологии кои се клучни за вашиот бизнис и чии детали мора да останат доверливи 
              за да се зачува конкурентската предност.
            </p>
          </div>
        )}

        {/* Step 3: Additional Terms */}
        {currentStep === 3 && (
          <div className={styles['info-box']}>
            <p>
              <strong>Дополнителни мерки:</strong> Изберете дополнителни безбедносни мерки за заштита на деловни тајни. 
              Стандардниот период на доверливост е 2 години по престанок на работниот однос, но може да се прилагоди 
              според потребите на компанијата.
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

        {/* Preview for protected product/service */}
        {currentStep === 2 && formData.productNameProtected && (
          <div className={styles['validation-info']}>
            <strong>Заштитен производ/услуга:</strong> {formData.productNameProtected}
            <br />
            <small>Сите информации поврзани со овој производ/услуга ќе бидат третирани како строго доверливи според правилникот.</small>
          </div>
        )}

        {/* Preview for confidentiality settings */}
        {currentStep === 3 && (formData.confidentialityPeriod || formData.additionalProtections?.length > 0) && (
          <div className={styles['role-preview']}>
            <strong>Параметри за доверливост:</strong>
            {formData.confidentialityPeriod && (
              <div>Период на доверливост: {formData.confidentialityPeriod} {formData.confidentialityPeriod === '1' ? 'година' : 'години'} по престанок на работниот однос</div>
            )}
            {formData.additionalProtections?.length > 0 && (
              <div>
                <br />
                <strong>Дополнitelни мерки:</strong>
                <ul>
                  {formData.additionalProtections.includes('physicalSecurity') && <li>Зајакната физичка безбедност за документи</li>}
                  {formData.additionalProtections.includes('digitalSecurity') && <li>Дополнителни мерки за електронски документи</li>}
                  {formData.additionalProtections.includes('accessControl') && <li>Ограничен пристап според оддели</li>}
                  {formData.additionalProtections.includes('ndaRequired') && <li>Задолжителни договори за доверливост со трети лица</li>}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseDocumentPage 
      config={personalDataRulebookConfig}
      renderStepContent={renderStepContent}
      title="Правилник за заштита на деловна тајна"
      description="Создајте интерен правилник за заштита на деловна тајна и знаења (know-how) според член 35 од Законот за работни односи"
    />
  );
};

export default PersonalDataRulebookPage;