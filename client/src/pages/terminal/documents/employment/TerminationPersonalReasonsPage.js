import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import terminationPersonalReasonsConfig, { personalReasonOptions } from '../../../../config/documents/terminationPersonalReasons';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Termination Decision Due to Personal Reasons Page
 * Uses the new architecture with BaseDocumentPage for consistency
 * Implements comprehensive multi-step form for termination decision generation
 */

const TerminationPersonalReasonsPage = () => {
  // Custom step content renderer for termination personal reasons information
  const renderStepContent = ({ currentStepData, formData, errors, handleInputChange, isGenerating }) => {
    const { fields } = terminationPersonalReasonsConfig;

    // Get fields for current step based on required fields
    const stepFields = currentStepData.requiredFields.map(fieldName => fields[fieldName]).filter(Boolean);

    // Handle category selection and auto-fill description
    const handleCategoryChange = (name, value) => {
      // First, update the category field
      handleInputChange(name, value);

      // Find the selected option and auto-fill description
      const selectedOption = personalReasonOptions.find(opt => opt.value === value);
      if (selectedOption && selectedOption.description) {
        // Auto-fill the description field
        handleInputChange('personalReasonDescription', selectedOption.description);
      }
    };

    return (
      <div className={styles['form-section']}>
        <h3>{currentStepData.title}</h3>
        <p className={styles['section-description']}>{currentStepData.description}</p>

        {stepFields.map(field => {
          // Special handling for personalReasonCategory field
          if (field.name === 'personalReasonCategory') {
            const fieldWithOptions = {
              ...field,
              options: personalReasonOptions.map(opt => ({ value: opt.value, label: opt.label }))
            };
            return (
              <FormField
                key={field.name}
                field={fieldWithOptions}
                value={formData[field.name]}
                formData={formData}
                onChange={handleCategoryChange}
                error={errors[field.name]}
                disabled={isGenerating}
              />
            );
          }

          // Regular fields
          return (
            <FormField
              key={field.name}
              field={field}
              value={formData[field.name]}
              formData={formData}
              onChange={handleInputChange}
              error={errors[field.name]}
              disabled={isGenerating}
            />
          );
        })}

        {currentStepData.id === 2 && (
          <div className={styles['help-section']}>
            <ul className={styles['help-list']}>
              <li>Работна позиција: точно како во договорот</li>
              <li>Датум на започнување: од договорот за работа</li>
              <li>Проверете ги сите датуми</li>
            </ul>
          </div>
        )}

        {currentStepData.id === 3 && (
          <div className={styles['help-section']}>
            <p className={styles['help-text']}>
              <strong>Совет:</strong> Изберете категорија за автоматски предлог на опис. Можете да го прилагодите текстот според вашите потреби.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseDocumentPage
      config={terminationPersonalReasonsConfig}
      renderStepContent={renderStepContent}
      title="Одлука за Престанок поради Лични Причини"
      description="Генерирајте одлука за престанок на договор за вработување поради лични причини на страна на работникот според македонското трудово право"
    />
  );
};

export default TerminationPersonalReasonsPage;