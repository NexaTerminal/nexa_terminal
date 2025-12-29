import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import { invoiceSigningAuthorizationConfig, getStepFields } from '../../../../config/documents/invoiceSigningAuthorization';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Invoice Signing Authorization Page
 * Generates authorization documents for delegating invoice signing rights
 * Based on company founding agreement articles
 * Uses the reusable base components and configuration-driven approach
 */
const InvoiceSigningAuthorizationPage = () => {

  /**
   * Custom step content renderer
   * This is the only document-specific logic needed
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = invoiceSigningAuthorizationConfig.steps.find(s => s.id === currentStep);

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        {stepConfig.description && <p>{stepConfig.description}</p>}

        {/* Informational note about the document */}
        <div className={styles['info-box']} style={{
          backgroundColor: '#fff3e0',
          border: '1px solid #ffe0b2',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          <strong>📋 Информации за овластувањето за потпишување фактури:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Со овој документ се овластува вработено лице да потпишува излезни фактури во име на компанијата</li>
            <li>Овластеното лице мора да има работно место кое вклучува проверка на документација и финансиски работи</li>
            <li>Овластеното лице е одговорно за секоја потпишана фактура</li>
            <li>Пред потпишување, овластеното лице мора да провери дали фактурата е заснована на веродостојни документи</li>
          </ul>
        </div>

        {stepFields.map(field => (
          <FormField
            key={field.name}
            field={field}
            value={formData[field.name]}
            onChange={handleInputChange}
            error={errors[field.name]}
            disabled={isGenerating}
            formData={formData}
          />
        ))}
      </div>
    );
  };

  return (
    <BaseDocumentPage
      config={invoiceSigningAuthorizationConfig}
      renderStepContent={renderStepContent}
      title="Овластување за потпишување фактури"
      description="Пополнете ги потребните податоци за издавање овластување за потпишување на излезни фактури"
    />
  );
};

export default InvoiceSigningAuthorizationPage;
