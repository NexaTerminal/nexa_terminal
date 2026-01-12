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
   * Single-step form with all fields
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = personalDataRulebookConfig.steps.find(s => s.id === currentStep);

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        {stepConfig.description && <p className={styles['step-description']}>{stepConfig.description}</p>}

        {/* Legal Basis Information */}
        <div className={styles['info-box']}>
          <p>
            <strong>Правна основа:</strong> Овој правилник се базира на член 35 од Законот за работни односи
            и ги определува мерките за заштита на деловните тајни, know-how и доверливи информации во вашата компанија.
          </p>
          <p style={{ marginTop: '10px' }}>
            📚 <strong>За повеќе информации:</strong>{' '}
            <a
              href="https://nexa.mk/terminal/blogs/c348d18d-1906-4ad2-9dd6-7a2879d9ca1e"
              target="_blank"
              rel="noopener noreferrer"
              className={styles['info-link']}
            >
              Прочитајте го нашиот детален водич
            </a>
          </p>
        </div>

        {/* All form fields */}
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