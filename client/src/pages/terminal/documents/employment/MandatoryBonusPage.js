import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField, { ConditionalField } from '../../../../components/forms/FormField';
import { mandatoryBonusConfig, getStepFields } from '../../../../config/documents/mandatoryBonus';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Mandatory Bonus Page
 * Uses the reusable base components and configuration-driven approach
 * Generates 4 documents for annual leave bonus: Decision, Minutes, Agreement, Union Consultation
 * All documents are generated in one file with page breaks
 */
const MandatoryBonusPage = () => {
  
  /**
   * Custom step content renderer
   * This is the only document-specific logic needed
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = mandatoryBonusConfig.steps.find(s => s.id === currentStep);

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        {stepConfig.description && <p>{stepConfig.description}</p>}
        
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className={styles['info-box']} style={{ 
            backgroundColor: '#e8f4fd', 
            border: '1px solid #bee5eb', 
            borderRadius: '6px', 
            padding: '12px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>📅 Основни информации:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Датумот на одлуката ќе се користи во сите четири документи</li>
              <li>Годината мора да биде во формат YYYY (пр. 2024)</li>
              <li>Износот може да биде намален поради финансиски потешкотии</li>
              <li>Стандардниот износ на регресот е 3000 денари по вработен</li>
            </ul>
          </div>
        )}
        
        {/* Step 2: Representatives */}
        {currentStep === 2 && (
          <div className={styles['info-box']} style={{ 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '6px', 
            padding: '12px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>👥 Претставници:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Претставникот мора да биде избран од вработените</li>
              <li>Овластен е да преговара и потпишува спогодба со работодавачот</li>
              <li>Се генерира записник за избор на претставник</li>
              <li>Претставникот дејствува во име на сите вработени</li>
            </ul>
          </div>
        )}
        
        {/* Step 3: Union Information */}
        {currentStep === 3 && (
          <div className={styles['info-box']} style={{ 
            backgroundColor: '#d1ecf1', 
            border: '1px solid #bee5eb', 
            borderRadius: '6px', 
            padding: '12px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>🏢 Информации за синдикат:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Задолжителна консултација со синдикат на гранка</li>
              <li>Се генерира барanje за мислење од синдикатот</li>
              <li>Потребна е точна адреса за испраќање на барањето</li>
              <li>Согласно член 35 од Колективниот договор</li>
            </ul>
          </div>
        )}
        
        {stepFields.map(field => (
          <React.Fragment key={field.name}>
            {/* Regular fields */}
            {!field.condition && (
              <FormField
                field={field}
                value={formData[field.name]}
                onChange={handleInputChange}
                error={errors[field.name]}
                disabled={isGenerating}
                formData={formData}
              />
            )}
            
            {/* Conditional fields (if any are added later) */}
            {field.condition && (
              <ConditionalField condition={field.condition} formData={formData}>
                <FormField
                  field={field}
                  value={formData[field.name]}
                  onChange={handleInputChange}
                  error={errors[field.name]}
                  disabled={isGenerating}
                  formData={formData}
                />
              </ConditionalField>
            )}
          </React.Fragment>
        ))}

        {/* Additional information for final step */}
        {currentStep === 3 && (
          <div className={styles['final-step-info']} style={{ 
            backgroundColor: '#f8f9fa', 
            border: '1px solid #dee2e6', 
            borderRadius: '6px', 
            padding: '15px', 
            marginTop: '20px',
            fontSize: '14px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>🗃️ Што ќе се генерира:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <strong>1. Одлука за исплата на регрес</strong>
                <p style={{ fontSize: '13px', margin: '5px 0 0 0' }}>Официјална одлука за исплата на регрес за годишен одмор во намален износ</p>
              </div>
              <div>
                <strong>2. Записник за избор на претставник</strong>
                <p style={{ fontSize: '13px', margin: '5px 0 0 0' }}>Документ за избор на претставник на вработените за преговори</p>
              </div>
              <div>
                <strong>3. Спогодба со претставник</strong>
                <p style={{ fontSize: '13px', margin: '5px 0 0 0' }}>Спогодба помеѓу работодавач и претставник за висината на регресот</p>
              </div>
              <div>
                <strong>4. Барање за консултација со синдикат</strong>
                <p style={{ fontSize: '13px', margin: '5px 0 0 0' }}>Писмо до синдикатот на гранка за консултација согласно колективниот договор</p>
              </div>
            </div>
            <p style={{ fontSize: '13px', margin: '15px 0 0 0', fontStyle: 'italic', color: '#6c757d' }}>
              Сите четири документи ќе бидат генерирани во една .docx датотека со разделни страници.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseDocumentPage 
      config={mandatoryBonusConfig}
      renderStepContent={renderStepContent}
      title="Регрес за годишен одмор - Мултидокумент"
      description="Пополнете ги потребните податоци за генерирање на комплетна документација за исплата на регрес за годишен одмор (Одлука + Записник + Спогодба + Барање за консултација)"
    />
  );
};

export default MandatoryBonusPage;