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
            <li>Документот се заснова на членот од Договорот или Изјавата за основање на друштвото</li>
            <li>Овластува вработено лице да потпишува излезни фактури во име на компанијата</li>
            <li>Овластеното лице мора да има работно место кое вклучува проверка на документација</li>
            <li>Овластеното лице е одговорно за секоја потпишана фактура</li>
            <li>Пред потпишување, овластеното лице мора да провери дали фактурата е заснована на веродостојни документи</li>
            <li>Овластувањето стапува на сила од наведениот датум</li>
          </ul>
        </div>

        {/* Legal reference note */}
        <div className={styles['info-box']} style={{
          backgroundColor: '#e8f4fd',
          border: '1px solid #bee5eb',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          <strong>⚖️ Правна основа:</strong>
          <p style={{ margin: '8px 0' }}>
            Овластувањето за потпишување фактури се издава од управителот на компанијата врз основа на
            овластувањата од Договорот или Изјавата за основање на друштвото. Според Законот за трговски
            друштва, управителот има право да делегира одредени овластувања на вработени лица. Овластеното
            лице преузема одговорност за веродостојноста на издадените фактури и мора да дејствува во согласност
            со Законот за сметководство и Законот за фискални каси. Ова овластување е внатрешен акт на компанијата
            кој го регулира односот помеѓу управителот и овластеното лице.
          </p>
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
