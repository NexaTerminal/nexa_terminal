import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField, { ConditionalField } from '../../../../components/forms/FormField';
import { loanAgreementConfig, getStepFields } from '../../../../config/documents/loanAgreement';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Loan Agreement Page (Договор за заем)
 * Based on Macedonian Law Articles 545-554 (Loan Agreement)
 * Uses the reusable base components and configuration-driven approach
 */
const LoanAgreementPage = () => {

  /**
   * Custom step content renderer
   * This is the only document-specific logic needed
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = loanAgreementConfig.steps.find(s => s.id === currentStep);

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        {stepConfig.description && <p>{stepConfig.description}</p>}

        {/* Step-specific info boxes */}
        {currentStep === 1 && (
          <div className={styles['info-box']} style={{
            backgroundColor: '#e3f2fd',
            border: '1px solid #2196f3',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>📋 Правна основа (Член 545-554 од ЗОО):</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li><strong>Член 545:</strong> Договор за заем е договор со кој едната страна ја пренесува сопственоста на одредена сума пари или заменливи работи на другата страна</li>
              <li><strong>Член 546:</strong> Заемот може да биде со или без камата. Доколку не е договорена камата, заемот е безкаматен</li>
              <li><strong>Член 554:</strong> Наменски заем мора да се користи само за договорената намена</li>
            </ul>
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles['info-box']} style={{
            backgroundColor: '#fff3e0',
            border: '1px solid #ffb74d',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>💰 Враќање на заемот (Член 550-551):</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li><strong>Еднократно:</strong> Целиот износ се враќа на еден договорен датум</li>
              <li><strong>На рати:</strong> Износот се распределува на повеќе периодични плаќања</li>
              <li><strong>Предвремено враќање:</strong> Примателот може да го врати заемот пред рокот (Член 551)</li>
            </ul>
          </div>
        )}

        {/* Render fields */}
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

            {/* Conditional fields */}
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

        {/* Display calculated installment amount if applicable */}
        {currentStep === 2 && formData.repaymentType === 'installments' && formData.loanAmount && formData.numberOfInstallments && (
          <div style={{
            backgroundColor: '#f0f4f8',
            border: '1px solid #cbd5e0',
            borderRadius: '6px',
            padding: '12px',
            marginTop: '16px'
          }}>
            <strong>Проценета рата (само главница):</strong>
            <div style={{ fontSize: '20px', marginTop: '8px', color: '#2c5282' }}>
              {(formData.loanAmount / formData.numberOfInstallments).toLocaleString('mk-MK', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} денари
            </div>
            {formData.hasInterest === 'yes' && formData.interestRate && (
              <div style={{ fontSize: '13px', marginTop: '8px', color: '#718096' }}>
                * Ова е само главницата. Каматата ({formData.interestRate}% годишно) се додава на секоја рата.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseDocumentPage
      config={loanAgreementConfig}
      renderStepContent={renderStepContent}
      title="Договор за парична позајмица (чл. 545-554 ЗОО)"
      description="Професионален договор за заем базиран на Членови 545-554 од Законот за облигациони односи. Изберете дали вашата компанија е давател или примател на заемот."
    />
  );
};

export default LoanAgreementPage;
