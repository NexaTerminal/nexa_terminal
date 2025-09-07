import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField, { ConditionalField } from '../../../../components/forms/FormField';
import { bonusPaymentConfig, getStepFields } from '../../../../config/documents/bonusPayment';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Bonus Payment Page
 * Uses the reusable base components and configuration-driven approach
 * This page generates decisions for employee bonus payments
 */
const BonusPaymentPage = () => {
  
  /**
   * Custom step content renderer
   * This is the only document-specific logic needed
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = bonusPaymentConfig.steps.find(s => s.id === currentStep);

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        {stepConfig.description && <p>{stepConfig.description}</p>}
        
        {/* Add informational note for step 1 */}
        {currentStep === 1 && (
          <div className={styles['info-box']} style={{ 
            backgroundColor: '#e8f4fd', 
            border: '1px solid #bee5eb', 
            borderRadius: '6px', 
            padding: '12px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>ℹ️ Информации:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Внесете ги основните податоци за работникот</li>
              <li>Сите полиња се опционални - можете да ги пополните директно во .docx документот</li>
              <li>Ако не внесете датум, автоматски ќе се користи денешниот датум</li>
            </ul>
          </div>
        )}
        
        {/* Add informational note for step 2 */}
        {currentStep === 2 && (
          <div className={styles['info-box']} style={{ 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '6px', 
            padding: '12px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>💰 Напомена:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Внесете го нето износот на бонусот во македонски денари</li>
              <li>Можете да користите запирки, точки или празни места за разделување</li>
              <li>Опишете ја конкретната причина за доделување на бонусот</li>
              <li>Документот се базира на член 105 од Законот за работните односи</li>
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
      </div>
    );
  };

  return (
    <BaseDocumentPage 
      config={bonusPaymentConfig}
      renderStepContent={renderStepContent}
      title="Одлука за бонус плаќање"
      description="Пополнете ги потребните податоци за издавање одлука за исплата на работна успешност (бонус) до вработен"
    />
  );
};

export default BonusPaymentPage;