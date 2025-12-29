import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import { annualAccountsAdoptionConfig, getStepFields } from '../../../../config/documents/annualAccountsAdoption';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Annual Accounts Adoption Decision Page
 * Generates decision documents for adoption of annual accounts, financial statements and annual report
 * Based on Article 215 paragraph 1 point 1 of the Law on Trading Companies
 * Uses the reusable base components and configuration-driven approach
 */
const AnnualAccountsAdoptionPage = () => {

  /**
   * Custom step content renderer
   * This is the only document-specific logic needed
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = annualAccountsAdoptionConfig.steps.find(s => s.id === currentStep);

    // Auto-calculate financial amounts whenever revenues, expenses, or taxOnExpenses change
    const revenues = parseFloat(formData.revenues) || 0;
    const expenses = parseFloat(formData.expenses) || 0;
    const taxOnExpenses = parseFloat(formData.taxOnExpenses) || 0;

    // Calculate profit before tax
    const profitBeforeTax = revenues - expenses;

    // Calculate profit after tax
    const profitAfterTax = profitBeforeTax - taxOnExpenses;

    // Update calculated fields if they've changed (this will be handled by the component)
    if (formData.profitBeforeTax !== profitBeforeTax && currentStep === 2) {
      handleInputChange('profitBeforeTax', profitBeforeTax);
    }
    if (formData.profitAfterTax !== profitAfterTax && currentStep === 2) {
      handleInputChange('profitAfterTax', profitAfterTax);
    }

    // Step 1: Basic Information
    if (currentStep === 1) {
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
            <strong>📋 Информации за одлуката за усвојување на годишната сметка:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Документот се базира на член 215 став 1 точка 1 од Законот за трговските друштва</li>
              <li>Одлуката ја носи Собирот на содружниците кај ДОО на својата седница или Собранието на акционери кај АД</li>
              <li>Составен дел се Билансот на успех и Билансот на состојбата</li>
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
              Согласно член 215 став 1 точка 1 од Законот за трговските друштва,
              кај друштвото со ограничена одговорност, собранието на содружниците има
              исклучива надлежност за усвојување на годишната сметка, финансиските извештаи
              и годишниот извештај за работењето. Одлуката се донесува на седницата на
              собранието и ја потпишува претседавачот на собранието.
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
    }

    // Step 2: Financial Results
    if (currentStep === 2) {
      return (
        <div className={styles['form-section']}>
          <h3>{stepConfig.title}</h3>
          {stepConfig.description && <p>{stepConfig.description}</p>}

          {/* Financial calculation information */}
          <div className={styles['info-box']} style={{
            backgroundColor: '#e8f5e9',
            border: '1px solid #c8e6c9',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>💰 Автоматско пресметување на финансиските резултати:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Добивка пред оданочување = Приходи - Расходи</li>
              <li>Добивка по оданочување = Добивка пред оданочување - Данок на непризнаени расходи</li>
              <li>Сите износи автоматски се форматираат како: 1.000,00 денари</li>
              <li>Податоците мора да одговараат со Билансот на успех</li>
              <li>Финансиските извештаи се подготвуваат според меѓународни сметководствени стандарди</li>
            </ul>
          </div>

          {stepFields.map(field => {
            // Show calculated fields as read-only with formatted values
            if (field.name === 'profitBeforeTax' || field.name === 'profitAfterTax') {
              const value = formData[field.name] || 0;
              const formattedValue = parseFloat(value).toLocaleString('mk-MK', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              });

              return (
                <div key={field.name} className={styles['form-group']}>
                  <label htmlFor={field.name}>
                    {field.label}
                    {field.helpText && (
                      <span className={styles['help-tooltip']} data-tooltip={field.helpText}>
                        ❓
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    id={field.name}
                    value={`${formattedValue} денари`}
                    readOnly
                    disabled
                    style={{
                      backgroundColor: '#f5f5f5',
                      cursor: 'not-allowed',
                      fontWeight: 'bold',
                      color: '#1976d2'
                    }}
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Автоматски пресметано
                  </small>
                </div>
              );
            }

            return (
              <FormField
                key={field.name}
                field={field}
                value={formData[field.name]}
                onChange={handleInputChange}
                error={errors[field.name]}
                disabled={isGenerating}
                formData={formData}
              />
            );
          })}

          {/* Display financial summary */}
          {formData.revenues && formData.expenses && (
            <div className={styles['info-box']} style={{
              backgroundColor: '#f3e5f5',
              border: '1px solid #e1bee7',
              borderRadius: '6px',
              padding: '12px',
              marginTop: '20px',
              fontSize: '14px'
            }}>
              <strong>📊 Преглед на финансиските резултати:</strong>
              <div style={{ marginTop: '10px', fontFamily: 'monospace' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>1) Остварени приходи:</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {parseFloat(formData.revenues || 0).toLocaleString('mk-MK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} денари
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>2) Остварени расходи:</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {parseFloat(formData.expenses || 0).toLocaleString('mk-MK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} денари
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', borderTop: '1px solid #ccc', paddingTop: '5px' }}>
                  <span>3) Добивка пред оданочување (1 - 2):</span>
                  <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                    {parseFloat(formData.profitBeforeTax || 0).toLocaleString('mk-MK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} денари
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>4) Данок на непризнаени расходи:</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {parseFloat(formData.taxOnExpenses || 0).toLocaleString('mk-MK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} денари
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #1976d2', paddingTop: '5px' }}>
                  <span style={{ fontWeight: 'bold' }}>5) Добивка по оданочување (3 - 4):</span>
                  <span style={{ fontWeight: 'bold', color: '#1976d2', fontSize: '16px' }}>
                    {parseFloat(formData.profitAfterTax || 0).toLocaleString('mk-MK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} денари
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <BaseDocumentPage
      config={annualAccountsAdoptionConfig}
      renderStepContent={renderStepContent}
      title="Одлука за усвојување на годишната сметка"
      description="Пополнете ги потребните податоци за издавање одлука за усвојување на годишната сметка, финансиските извештаи и годишниот извештај за работење според член 215 став 1 точка 1 од Законот за трговските друштва"
    />
  );
};

export default AnnualAccountsAdoptionPage;
