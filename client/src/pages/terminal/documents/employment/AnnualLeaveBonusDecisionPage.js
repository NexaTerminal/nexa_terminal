import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField, { ConditionalField } from '../../../../components/forms/FormField';
import { annualLeaveBonusDecisionConfig } from '../../../../config/documents/annualLeaveBonusDecision';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Annual Leave Bonus Decision Page
 * Uses the reusable base components and configuration-driven approach
 * This page generates decisions for annual leave bonus payments (standard amount)
 */
const AnnualLeaveBonusDecisionPage = () => {

  /**
   * Custom step content renderer
   * This is the only document-specific logic needed
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepConfig = annualLeaveBonusDecisionConfig.steps[0]; // Single step form

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>

        {/* Add informational note */}
        <div className={styles['info-box']} style={{
          backgroundColor: '#e8f4fd',
          border: '1px solid #bee5eb',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          <strong>ℹ️ Информации за регресот за годишен одмор:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Регресот се исплаќа на сите вработени што стекнале право на годишен одмор</li>
            <li>Минималниот износ е 40% од просечната национална плата</li>
            <li>Одлуката се базира на член 35 од Општиот колективен договор</li>
            <li>Право на регрес имаат работници со најмалку 6 месеци работа кај истиот работодавач</li>
            <li>Регресот се исплаќа еднаш во текот на годината</li>
          </ul>
        </div>

        {stepConfig.fields.map(field => (
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
      config={annualLeaveBonusDecisionConfig}
      renderStepContent={renderStepContent}
      title="Одлука за исплата на регрес за годишен одмор"
      description="Пополнете ги потребните податоци за издавање одлука за исплата на регрес за годишен одмор според член 35 од Општиот колективен договор"
    />
  );
};

export default AnnualLeaveBonusDecisionPage;