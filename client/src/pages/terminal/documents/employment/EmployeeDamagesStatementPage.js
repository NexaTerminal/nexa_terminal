import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField, { ConditionalField } from '../../../../components/forms/FormField';
import { employeeDamagesStatementConfig, getStepFields } from '../../../../config/documents/employeeDamagesStatement';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Employee Damages Statement Page
 * Uses the reusable base components and configuration-driven approach
 * This page generates statements for employee acknowledgment of damages and salary deduction consent
 */
const EmployeeDamagesStatementPage = () => {
  
  /**
   * Custom step content renderer
   * This is the only document-specific logic needed
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = employeeDamagesStatementConfig.steps.find(s => s.id === currentStep);

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
              <li>Внесете ги точните податоци за работникот кој дава изјава</li>
              <li>Датумот на изјавата е важен за правната валидност</li>
              <li>Работната позиција мора да одговара на договорот за вработување</li>
            </ul>
          </div>
        )}

        {/* Add legal notice for step 2 */}
        {currentStep === 2 && (
          <div className={styles['info-box']} style={{ 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '6px', 
            padding: '12px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>⚖️ Правна основа:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Изјавата се дава врз основа на член 111 од Законот за работните односи</li>
              <li>Работникот се согласува за намалување на платата за покривање на штетата</li>
              <li>Изјавата се дава доброволно без присила</li>
              <li>Целта е избегнување судска постапка за обештетување</li>
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

        {/* Additional legal disclaimer for step 2 */}
        {currentStep === 2 && (
          <div className={styles['warning-box']} style={{ 
            backgroundColor: '#f8d7da', 
            border: '1px solid #f5c6cb', 
            borderRadius: '6px', 
            padding: '12px', 
            marginTop: '20px',
            fontSize: '13px',
            color: '#721c24'
          }}>
            <strong>⚠️ Важно:</strong>
            <p style={{ margin: '8px 0 0 0' }}>
              Со потпишувањето на оваа изјава, работникот потврдува дека доброволно се согласува 
              со намалување на платата за покривање на предизвиканата материјална штета.
              Препорачуваме консултации со правен советник пред потпишување.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseDocumentPage 
      config={employeeDamagesStatementConfig}
      renderStepContent={renderStepContent}
      title="Изјава за согласност за намалување на плата поради предизвикана штета"
      description="Пополнете ги потребните податоци за издавање изјава за согласност на работник за намалување на плата поради материјална штета"
    />
  );
};

export default EmployeeDamagesStatementPage;