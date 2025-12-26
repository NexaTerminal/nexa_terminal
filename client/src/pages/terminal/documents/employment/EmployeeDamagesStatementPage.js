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