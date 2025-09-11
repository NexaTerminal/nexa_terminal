import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import { vehicleSalePurchaseAgreementConfig, getStepFields } from '../../../../config/documents/vehicleSalePurchaseAgreement';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Vehicle Sale-Purchase Agreement Page
 * Uses the reusable base components and configuration-driven approach
 * Implements a comprehensive vehicle sale agreement with conditional fields based on user role and party type
 */
const VehicleSalePurchaseAgreementPage = () => {
  
  /**
   * Custom step content renderer
   * This handles the document-specific form logic including conditional field display
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = vehicleSalePurchaseAgreementConfig.steps.find(s => s.id === currentStep);

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        {stepConfig.description && <p className={styles['step-description']}>{stepConfig.description}</p>}
        
        {/* Step 1: User Role Information */}
        {currentStep === 1 && (
          <div className={styles['info-box']}>
            <p>
              <strong>Забелешка:</strong> Вашата компанија (од профилот) учествува во договорот како правно лице. 
              Изберете дали сте продавач (го продавате возилото) или купувач (го купувате возилото).
            </p>
            {formData.userRole && (
              <div className={styles['role-preview']}>
                <strong>Ваша улога:</strong> {formData.userRole === 'seller' ? 'Продавач' : 'Купувач'}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Other Party Information with conditional fields */}
        {currentStep === 2 && (
          <div className={styles['info-box']}>
            <p>
              <strong>Внимание:</strong> Внесете ги податоците за {formData.userRole === 'seller' ? 'купувачот' : 'продавачот'} на возилото.
              Проверете ги сите податоци со официјалните документи пред потпишување на договорот.
            </p>
            {formData.otherPartyType && (
              <div className={styles['role-preview']}>
                <strong>Другата страна:</strong> {formData.otherPartyType === 'company' ? 'Правно лице (фирма)' : 'Физичко лице'}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Vehicle Information */}
        {currentStep === 3 && (
          <div className={styles['info-box']}>
            <p>
              <strong>Важно:</strong> Внесете ги податоците точно како што се наведени во сообраќајната дозвола. 
              Неточните податоци можат да предизвикаат проблеми при преносот на сопственоста.
            </p>
          </div>
        )}

        {/* Step 4: Financial Information */}
        {currentStep === 4 && (
          <div className={styles['info-box']}>
            <p>
              <strong>Совет:</strong> Препорачуваме плаќањето да се изврши на денот на заверката кај нотар за максимална безбедност на трансакцијата.
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

        {/* Additional validation messages for specific steps */}
        {currentStep === 2 && formData.otherPartyType === 'natural' && formData.otherPartyPIN && (
          formData.otherPartyPIN.length !== 13 ? (
            <div className={styles['validation-warning']}>
              ⚠️ ЕМБГ мора да содржи точно 13 цифри
            </div>
          ) : null
        )}

        {currentStep === 4 && formData.price && (
          <div className={styles['price-preview']}>
            <strong>Договорена цена:</strong> {parseInt(formData.price || 0).toLocaleString()} денари
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseDocumentPage 
      config={vehicleSalePurchaseAgreementConfig}
      renderStepContent={renderStepContent}
      title="Договор за продажба-купување на возило"
      description="Пополнете ги потребните податоци за склучување договор за продажба-купување на моторно возило"
    />
  );
};

export default VehicleSalePurchaseAgreementPage;