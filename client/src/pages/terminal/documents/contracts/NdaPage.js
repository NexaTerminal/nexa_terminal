import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import { ndaConfig, getStepFields } from '../../../../config/documents/nda';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * NDA (Non-Disclosure Agreement) Page
 * Uses the reusable base components and configuration-driven approach
 * Implements a comprehensive NDA form with multi-step workflow
 */
const NdaPage = () => {
  
  /**
   * Custom step content renderer
   * This handles the document-specific form logic
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep, formData);
    const stepConfig = ndaConfig.steps.find(s => s.id === currentStep);

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        {stepConfig.description && <p className={styles['step-description']}>{stepConfig.description}</p>}
        
        {currentStep === 1 && (
          <div className={styles['info-box']}>
            <p>
              <strong>Информација:</strong> Вашата компанија (од профилот) е секогаш првата договорна страна. 
              Внесете ги податоците за втората договорна страна со која склучувате договор за доверливост.
            </p>
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles['info-box']}>
            <p>
              <strong>Важно:</strong> Договорот за доверливост ги заштитува бизнис информациите, 
              технолошките решенија, клиентските листи, финансиските податоци и други доверливи информации 
              меѓу договорните страни.
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

        {/* Agreement type preview in step 2 */}
        {currentStep === 2 && formData.agreementType && (
          <div className={styles['preview-box']}>
            <h4>Тип на доверливост:</h4>
            <p>
              {formData.agreementType === 'bilateral' ? (
                <>
                  <strong>🔄 Двострана доверливост</strong><br/>
                  И двете страни ќе споделуваат и заштитуваат доверливи информации една на друга.
                </>
              ) : (
                <>
                  <strong>➡️ Еднострана доверливост</strong><br/>
                  Само едната страна ќе споделува доверливи информации, другата ги прима и заштитува.
                </>
              )}
            </p>
          </div>
        )}

        {/* Duration and obligations preview */}
        {currentStep === 2 && formData.agreementDuration && (
          <div className={styles['preview-box']}>
            <h4>Времетраење и обврски:</h4>
            <p>
              <strong>Активен период:</strong> {formData.agreementDuration} години од потпишување<br/>
              <strong>Обврска за доверливост:</strong> Продолжува најмалку 5 години по завршување на договорот<br/>
              <strong>Заштитени информации:</strong> Технички податоци, деловни стратегии, клиентски листи, 
              финансиски информации, трговски тајни
            </p>
          </div>
        )}

        {/* Summary in final step */}
        {currentStep === ndaConfig.steps.length && (
          <div className={styles['summary-box']}>
            <h4>Резиме на договор за доверливост:</h4>
            <div className={styles['summary-grid']}>
              <div>
                <strong>Прва договорна страна:</strong> Вашата компанија (од профил)
              </div>
              <div>
                <strong>Втора договорна страна:</strong> {
                  formData.partyType === 'natural' 
                    ? formData.naturalPersonName 
                    : formData.partyType === 'legal' 
                      ? formData.legalEntityName 
                      : '[Не е внесено]'
                }
              </div>
              <div>
                <strong>Датум на склучување:</strong> {formData.agreementDate}
              </div>
              <div>
                <strong>Времетраење:</strong> {formData.agreementDuration} години
              </div>
              <div>
                <strong>Тип на доверливост:</strong> {formData.agreementType === 'bilateral' ? 'Двострана' : 'Еднострана'}
              </div>
              {formData.contactEmail && (
                <div>
                  <strong>Е-маил за контакт:</strong> {formData.contactEmail}
                </div>
              )}
              {formData.additionalTerms && (
                <div>
                  <strong>Дополнitelни услови:</strong> Да (наведени во договорот)
                </div>
              )}
            </div>
            
            <div className={styles['legal-notice']}>
              <h5>⚖️ Правни обврски:</h5>
              <ul>
                <li>Заштита на доверливи информации за минимум 5 години по завршување</li>
                <li>Забрана за откривање на трети лица без согласност</li>
                <li>Ограничена употреба само за договорени цели</li>
                <li>Материјална одговорност во случај на повреда</li>
                <li>Применување на македонското право</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseDocumentPage 
      config={ndaConfig}
      renderStepContent={renderStepContent}
      title="Договор за доверливост на информации (NDA)"
      description="Создајте професионален договор за доверливост на информации за заштита на деловните тајни и осетливите информации"
    />
  );
};

export default NdaPage;