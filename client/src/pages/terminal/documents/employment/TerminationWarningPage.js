import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import terminationWarningConfig from '../../../../config/documents/terminationWarning';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Termination Warning Page
 * Uses the new architecture with BaseDocumentPage for consistency
 * Implements comprehensive multi-step form for termination warning generation
 */

const TerminationWarningPage = () => {
  // Custom step content renderer for termination warning information
  const renderStepContent = ({ currentStepData, formData, errors, handleInputChange, isGenerating }) => {
    const { fields } = terminationWarningConfig;
    
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
          </div>
        )}

        {currentStepData.id === 2 && (
          <div className={styles['help-section']}>
            <p className={styles['help-text']}>
              <strong>Важно:</strong> Бидете прецизни и објективни во описот на прекршокот. Избегнувајте емотивни или субјективни изрази.
            </p>
            <ul className={styles['help-list']}>
              <li>Користете факти, не мислења</li>
              <li>Наведете конкретни примери</li>
              <li>Избегнувайте лични навреди</li>
            </ul>
          </div>
        )}

        {currentStepData.id === 3 && (
          <div className={styles['help-section']}>
            <p className={styles['help-text']}>
              <strong>Законски рок:</strong> Согласно Законот за работни односи, рокот за исправка обично изнесува 15-30 дена.
            </p>
            <div className={styles['warning-box']}>
              <p><strong>Внимание:</strong> Рокот за исправка мора да биде разумен и доволен за работникот да го исправи своето однесување.</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseDocumentPage
      config={terminationWarningConfig}
      renderStepContent={renderStepContent}
      title="Предупредување пред Откажување"
      description="Генерирајте предупредување пред откажување на договор за вработување според македонското трудово право"
    />
  );
};

export default TerminationWarningPage;