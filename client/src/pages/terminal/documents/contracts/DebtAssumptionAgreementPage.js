import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import { debtAssumptionAgreementConfig, getStepFields } from '../../../../config/documents/debtAssumptionAgreement';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Debt Assumption Agreement Page
 * Uses the reusable base components and configuration-driven approach
 * Implements a comprehensive debt assumption agreement form with multi-step workflow
 */
const DebtAssumptionAgreementPage = () => {

  /**
   * Custom step content renderer
   * This handles the document-specific form logic
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = debtAssumptionAgreementConfig.steps.find(s => s.id === currentStep);

    // Helper function to get role description
    const getRoleDescription = (role) => {
      switch (role) {
        case 'creditor':
          return 'ДОВЕРИТЕЛ (првичен доверител на долгот)';
        case 'debtor':
          return 'ПРВИЧЕН ДОЛЖНИК (што го пренесува долгот)';
        case 'third_party':
          return 'ПРЕЗЕМАЧ НА ДОЛГ (трето лице што го презема долгот)';
        default:
          return '';
      }
    };

    // Helper function to format amount
    const formatAmount = (amount, currency) => {
      if (!amount) return '';
      const formatted = parseFloat(amount).toLocaleString('mk-MK');
      const currencyLabel = currency === 'МКД' ? 'денари' : currency === 'EUR' ? 'евра' : currency;
      return `${formatted} ${currencyLabel}`;
    };

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        {stepConfig.description && <p className={styles['step-description']}>{stepConfig.description}</p>}

        {currentStep === 1 && (
          <div className={styles['info-box']}>
            <p>
              <strong>Забелешка:</strong> Вашата компанија (од профилот) е секогаш правно лице.
              Изберете ја вашата улога во процесот на преземање на долгот.
            </p>
            {formData.userRole && (
              <div className={styles['role-preview']}>
                <strong>
                  🏢 Вашата компанија е: {getRoleDescription(formData.userRole)}
                </strong>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles['info-box']}>
            <p>
              <strong>Важно:</strong> Внесете ги податоците за сите странки во договорот.
              Податоците за вашата компанија се автоматски преземаат од вашиот профил.
            </p>
            {formData.userRole && (
              <div className={styles['parties-overview']}>
                <h4>Странки во договорот:</h4>
                <ul>
                  <li>📋 <strong>Доверител:</strong> {formData.userRole === 'creditor' ? 'Вашата компанија' : 'Треба да се внесе'}</li>
                  <li>💼 <strong>Првичен должник:</strong> {formData.userRole === 'debtor' ? 'Вашата компанија' : 'Треба да се внесе'}</li>
                  <li>🤝 <strong>Преземач на долг:</strong> {formData.userRole === 'third_party' ? 'Вашата компанија' : `${formData.otherPartyType === 'individual' ? 'Физичко лице' : 'Правно лице'} (треба да се внесе)`}</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className={styles['info-box']}>
            <p>
              <strong>Детали за долгот:</strong> Внесете ги точните информации за должничката обврска
              што се презема. Овие податоци мора да одговараат на првичниот договор или документ.
            </p>
          </div>
        )}

        {currentStep === 4 && (
          <div className={styles['info-box']}>
            <p>
              <strong>Правни последици:</strong> Изберете ги условите за преземањето на долгот.
              Ова влијае на правните обврски на сите странки според Законот за облигационите односи.
            </p>
          </div>
        )}

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

        {/* Debt details preview in step 3 */}
        {currentStep === 3 && formData.debtAmount && formData.debtDescription && (
          <div className={styles['preview-box']}>
            <h4>Преглед на долгот:</h4>
            <p>
              <strong>Износ:</strong> {formatAmount(formData.debtAmount, formData.debtCurrency)}<br/>
              <strong>Опис:</strong> {formData.debtDescription}<br/>
              {formData.originalContractDate && <span><strong>Датум на првичен договор:</strong> {formData.originalContractDate}<br/></span>}
              {formData.originalContractNumber && <span><strong>Број на договор:</strong> {formData.originalContractNumber}<br/></span>}
              {formData.dueDate && <span><strong>Доспевање:</strong> {formData.dueDate}</span>}
            </p>
          </div>
        )}

        {/* Assumption conditions preview in step 4 */}
        {currentStep === 4 && formData.assumptionType && (
          <div className={styles['preview-box']}>
            <h4>Услови на преземање:</h4>
            <p>
              <strong>Тип:</strong> {formData.assumptionType === 'full' ? 'Целосно преземање на долгот' : 'Делумно преземање на долгот'}<br/>
              <strong>Првичен должник:</strong> {formData.releaseOriginalDebtor === true || formData.releaseOriginalDebtor === 'true'
                ? 'Се ослободува од обврската'
                : 'Останува солидарно одговорен'}<br/>
              {formData.additionalConditions && (
                <span><strong>Дополнителни услови:</strong> {formData.additionalConditions.substring(0, 100)}{formData.additionalConditions.length > 100 ? '...' : ''}</span>
              )}
            </p>
          </div>
        )}

        {/* Summary in final step */}
        {currentStep === 4 && formData.debtAmount && formData.userRole && (
          <div className={styles['summary-box']}>
            <h4>Резиме на договорот за преземање на долг:</h4>
            <div className={styles['summary-grid']}>
              <div>
                <strong>Доверител:</strong>
                {formData.userRole === 'creditor'
                  ? 'Вашата компанија (од профил)'
                  : formData.originalCreditorType === 'individual'
                    ? `${formData.originalCreditorName || '[Име]'} (физичко лице)`
                    : `${formData.originalCreditorCompanyName || '[Компанија]'} (правно лице)`
                }
              </div>
              <div>
                <strong>Првичен должник:</strong>
                {formData.userRole === 'debtor'
                  ? 'Вашата компанија (од профил)'
                  : formData.originalDebtorType === 'individual'
                    ? `${formData.originalDebtorName || '[Име]'} (физичко лице)`
                    : `${formData.originalDebtorCompanyName || '[Компанија]'} (правно лице)`
                }
              </div>
              <div>
                <strong>Преземач на долг:</strong>
                {formData.userRole === 'third_party'
                  ? 'Вашата компанија (од профил)'
                  : formData.otherPartyType === 'individual'
                    ? `${formData.assumingPartyName || '[Име]'} (физичко лице)`
                    : `${formData.assumingPartyCompanyName || '[Компанија]'} (правно лице)`
                }
              </div>
              <div>
                <strong>Износ на долг:</strong> {formatAmount(formData.debtAmount, formData.debtCurrency)}
              </div>
              <div>
                <strong>Тип на преземање:</strong> {formData.assumptionType === 'full' ? 'Целосно' : 'Делумно'}
              </div>
              <div>
                <strong>Статус на првичен должник:</strong> {formData.releaseOriginalDebtor === true || formData.releaseOriginalDebtor === 'true'
                  ? 'Ослободен од обврската'
                  : 'Солидарно одговорен'}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseDocumentPage
      config={debtAssumptionAgreementConfig}
      renderStepContent={renderStepContent}
      title="Договор за преземање на долг"
      description="Создајте професионален договор за преземање на должничка обврска со сите потребни правни услови и клаузули според Законот за облигационите односи"
    />
  );
};

export default DebtAssumptionAgreementPage;