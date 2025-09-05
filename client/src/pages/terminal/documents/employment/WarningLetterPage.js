import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField, { ConditionalField } from '../../../../components/forms/FormField';
import { warningLetterConfig, getStepFields } from '../../../../config/documents/warningLetter';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Warning Letter Page
 * Uses the reusable base components and configuration-driven approach
 * This page generates warning letters for employee misconduct
 */
const WarningLetterPage = () => {
  
  /**
   * Custom step content renderer
   * This is the only document-specific logic needed
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = warningLetterConfig.steps.find(s => s.id === currentStep);

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        {stepConfig.description && <p>{stepConfig.description}</p>}
        
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
            <strong>⚠️ Напомена:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Опишете конкретно што направил работникот погрешно</li>
              <li>Наведете кои правила или обврски се прекршени</li>
              <li>Укажете на член од договорот за вработување</li>
              <li>Опомената служи како предупредување пред дисциплинска мерка</li>
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
      config={warningLetterConfig}
      renderStepContent={renderStepContent}
      title="Опомена до вработен"
      description="Пополнете ги потребните податоци за издавање опомена до работник поради прекршување на работни обврски"
    />
  );
};

export default WarningLetterPage;