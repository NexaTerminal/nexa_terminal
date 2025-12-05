import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField, { ConditionalField } from '../../../../components/forms/FormField';
import { rentAgreementConfig, getStepFields } from '../../../../config/documents/rentAgreement';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Rent Agreement Page
 * Uses the reusable base components and configuration-driven approach
 * Implements a comprehensive rent agreement form with multi-step workflow
 */
const RentAgreementPage = () => {
  
  /**
   * Custom step content renderer
   * This handles the document-specific form logic
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = rentAgreementConfig.steps.find(s => s.id === currentStep);

    // Special handling for deposit amount based on rent amount
    const handleDepositChange = (name, value) => {
      if (name === 'depositAmount' && value !== 'custom') {
        // Auto-calculate based on rent amount
        const rentAmount = parseFloat(formData.rentAmount) || 300;
        let depositValue = rentAmount;
        
        if (value === '600') { // Two monthly rents
          depositValue = rentAmount * 2;
        }
        
        handleInputChange('customDepositAmount', depositValue.toString());
      }
      handleInputChange(name, value);
    };

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        {stepConfig.description && <p className={styles['step-description']}>{stepConfig.description}</p>}
        
        {currentStep === 2 && (
          <div className={styles['info-box']}>
            <p>
              <strong>Забелешка:</strong> Вашата компанија (од профилот) е секогаш правно лице. 
              Определете дали сте закуподавач или закупец, и потоа внесете ги податоците за другата договорна страна.
            </p>
            {formData.userRole && (
              <div className={styles['role-preview']}>
                <strong>
                  {formData.userRole === 'landlord' 
                    ? '🏢 Вашата компанија е ЗАКУПОДАВАЧ' 
                    : '🏢 Вашата компанија е ЗАКУПЕЦ'
                  }
                </strong>
              </div>
            )}
          </div>
        )}
        
        {stepFields.map(field => (
          <FormField
            key={field.name}
            field={field}
            value={formData[field.name]}
            formData={formData}
            onChange={field.name.startsWith('deposit') ? handleDepositChange : handleInputChange}
            error={errors[field.name]}
            disabled={isGenerating}
          />
        ))}

        {/* Custom logic for property details preview in step 3 */}
        {currentStep === 3 && formData.propertyAddress && formData.propertySize && (
          <div className={styles['preview-box']}>
            <h4>Преглед на недвижност:</h4>
            <p>
              <strong>Локација:</strong> {formData.propertyAddress}<br/>
              <strong>Површина:</strong> {formData.propertySize} м²<br/>
              <strong>Тип:</strong> {formData.propertyType}<br/>
              {formData.floor && <span><strong>Кат:</strong> {formData.floor}<br/></span>}
              {formData.apartmentNumber && <span><strong>Број:</strong> {formData.apartmentNumber}</span>}
            </p>
          </div>
        )}

        {/* Custom logic for rent preview in step 4 */}
        {currentStep === 4 && formData.rentAmount && (
          <div className={styles['preview-box']}>
            <h4>Финансиски преглед:</h4>
            <p>
              <strong>Месечна закупнина:</strong> €{formData.rentAmount} {formData.includesVAT ? 'со ДДВ' : 'без ДДВ'}<br/>
              <strong>Плаќање:</strong> {formData.rentPaymentDeadline}<br/>
              {formData.requiresDeposit && formData.customDepositAmount && (
                <span><strong>Депозит:</strong> €{formData.customDepositAmount}</span>
              )}
            </p>
          </div>
        )}

        {/* Summary in final step */}
        {currentStep === 5 && (
          <div className={styles['summary-box']}>
            <h4>Резиме на договор:</h4>
            <div className={styles['summary-grid']}>
              <div>
                <strong>Закуподавач:</strong> 
                {formData.userRole === 'landlord' 
                  ? 'Вашата компанија (од профил)' 
                  : `${formData.otherPartyName} (${formData.otherPartyType === 'individual' ? 'физичко лице' : 'правно лице'})`
                }
              </div>
              <div>
                <strong>Закупец:</strong> 
                {formData.userRole === 'tenant' 
                  ? 'Вашата компанија (од профил)' 
                  : `${formData.otherPartyName} (${formData.otherPartyType === 'individual' ? 'физичко лице' : 'правно лице'})`
                }
              </div>
              <div>
                <strong>Недвижност:</strong> {formData.propertyAddress} ({formData.propertySize} м²)
              </div>
              <div>
                <strong>Закупнина:</strong> €{formData.rentAmount}/месечно
              </div>
              <div>
                <strong>Времетраење:</strong> {formData.durationType === 'определено' ? 
                  `${formData.durationValue}${formData.endDate ? ` (до ${formData.endDate})` : ''}` : 
                  'неопределено време'}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseDocumentPage 
      config={rentAgreementConfig}
      renderStepContent={renderStepContent}
      title="Договор за закуп на недвижен имот"
      description="Создајте професионален договор за закуп на недвижен имот со сите потребни услови и клаузули"
    />
  );
};

export default RentAgreementPage;