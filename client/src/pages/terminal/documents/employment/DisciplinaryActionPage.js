import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField, { ConditionalField } from '../../../../components/forms/FormField';
import { disciplinaryActionConfig, getStepFields } from '../../../../config/documents/disciplinaryAction';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Disciplinary Action Page
 * Uses the reusable base components and configuration-driven approach
 * This page generates disciplinary action decision documents
 */
const DisciplinaryActionPage = () => {
  
  /**
   * Custom step content renderer
   * This is the only document-specific logic needed
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = disciplinaryActionConfig.steps.find(s => s.id === currentStep);

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        {stepConfig.description && <p>{stepConfig.description}</p>}
        
        {/* Add warning for sanction limits on step 2 */}
        {currentStep === 2 && (
          <div className={styles['info-box']} style={{ 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '6px', 
            padding: '12px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>📋 Законски ограничења:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Максимална висина на казна: <strong>15%</strong> од нето плата</li>
              <li>Максимален период: <strong>6 месеци</strong></li>
              <li>Согласно член 180 од Законот за работни односи</li>
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
      config={disciplinaryActionConfig}
      renderStepContent={renderStepContent}
      title="Дисциплинска мерка - парична казна"
      description="Пополнете ги потребните податоци за издавање решение за дисциплинска мерка"
    />
  );
};

export default DisciplinaryActionPage;