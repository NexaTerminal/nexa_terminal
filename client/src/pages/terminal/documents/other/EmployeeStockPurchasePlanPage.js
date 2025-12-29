import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField, { ConditionalField } from '../../../../components/forms/FormField';
import { employeeStockPurchasePlanConfig, getStepFields } from '../../../../config/documents/employeeStockPurchasePlan';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Employee Stock Purchase Plan Page
 * Complex corporate document for employee stock purchase programs
 * Adapted for Macedonian corporate law (Закон за трговски друштва)
 */
const EmployeeStockPurchasePlanPage = () => {

  /**
   * Custom step content renderer
   * Special handling for Step 1 to display purpose checkboxes in two columns
   */
  const renderStepContent = ({ currentStep, currentStepData, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);

    // Safety check - return null if currentStepData is undefined
    if (!currentStepData) {
      return null;
    }

    // Special rendering for Step 1 - two-column checkbox layout
    if (currentStep === 1) {
      const ownershipTypeField = stepFields.find(f => f.name === 'ownershipType');
      const effectiveDateField = stepFields.find(f => f.name === 'effectiveDate');
      const purposeFields = stepFields.filter(f => f.name.startsWith('purpose'));

      return (
        <div className={styles['form-section']}>
          <h3>{currentStepData.title}</h3>
          {currentStepData.description && <p>{currentStepData.description}</p>}

          {/* Ownership Type field - regular rendering */}
          {ownershipTypeField && (
            <FormField
              field={ownershipTypeField}
              value={formData[ownershipTypeField.name]}
              onChange={handleInputChange}
              error={errors[ownershipTypeField.name]}
              disabled={isGenerating}
              formData={formData}
            />
          )}

          {/* Effective Date field - regular rendering */}
          {effectiveDateField && (
            <FormField
              field={effectiveDateField}
              value={formData[effectiveDateField.name]}
              onChange={handleInputChange}
              error={errors[effectiveDateField.name]}
              disabled={isGenerating}
              formData={formData}
            />
          )}

          {/* Purpose checkboxes in two-column layout */}
          <div className={styles['form-group']}>
            <label className={styles['field-label']}>
              Цели на планот
              <span className={styles['help-icon']} title="Изберете една или повеќе цели на планот за купување акции. Овие цели ќе бидат вклучени во официјалниот документ.">❓</span>
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginTop: '8px'
            }}>
              {purposeFields.map(field => (
                <div key={field.name} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id={field.name}
                    checked={Boolean(formData[field.name])}
                    onChange={(e) => handleInputChange(field.name, e.target.checked)}
                    disabled={isGenerating}
                    style={{
                      marginTop: '3px',
                      flexShrink: 0,
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer'
                    }}
                  />
                  <label htmlFor={field.name} style={{ fontSize: '14px', lineHeight: '1.4', cursor: 'pointer' }}>
                    {field.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Default rendering for other steps
    return (
      <div className={styles['form-section']}>
        <h3>{currentStepData.title}</h3>
        {currentStepData.description && <p>{currentStepData.description}</p>}

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
      config={employeeStockPurchasePlanConfig}
      renderStepContent={renderStepContent}
      title="План за купување акции од страна на вработени (ESPP)"
      description="Пополнете ги податоците за создавање на комплексен план за купување акции од страна на вработени. Овој план им овозможува на вработените да купуваат акции на компанијата по дисконтна цена преку систем на опции."
    />
  );
};

export default EmployeeStockPurchasePlanPage;
