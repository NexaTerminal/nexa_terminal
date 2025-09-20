import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import { mediationAgreementConfig, getStepFields } from '../../../../config/documents/mediationAgreement';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Enhanced Mediation Agreement Page
 * Comprehensive legal compliance based on Civil Code Articles 869-882
 * Complex conditional logic based on user role (mediator/client) and client type (natural/legal)
 * 4-step form with enhanced legal sections and validation
 * Uses the reusable base components and configuration-driven approach
 */
const MediationAgreementPage = () => {

  /**
   * Custom step content renderer
   * This handles the complex conditional form logic for different roles
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep, formData);
    const stepConfig = mediationAgreementConfig.steps.find(s => s.id === currentStep);

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        {stepConfig.description && <p className={styles['step-description']}>{stepConfig.description}</p>}

        {/* Step 1: Enhanced agreement basics info */}
        {currentStep === 1 && (
          <div className={styles['info-box']}>
            <p>
              <strong>Правна основа:</strong> Овој договор се базира на членови 869-882 од Законот за облигациони односи.
              <strong>Посредникот</strong> се обврзува да најде и поврзе страни за склучување на договор.
              <strong>Налогодавецот</strong> може да го отповика налогот во секое време.
            </p>
          </div>
        )}

        {/* Step 2: Enhanced party information info boxes */}
        {currentStep === 2 && formData.userRole === 'mediator' && (
          <div className={styles['info-box']}>
            <p>
              <strong>Обврски на посредникот:</strong> Според член 876, посредникот одговара за работа со деловно неспособни лица,
              затоа податоците за клиентот мораат да бидат точни и потполни. Вклучувајте контакт информации за комуникација според член 875.
            </p>
          </div>
        )}

        {currentStep === 2 && formData.userRole === 'client' && (
          <div className={styles['info-box']}>
            <p>
              <strong>Права на налогодавецот:</strong> Според член 872-873, налогодавецот може да го отповика налогот во секое време
              и не е обврзан да склучи договор со најденото лице. Повеќето информации за посредникот обезбедува подобра заштита.
            </p>
          </div>
        )}

        {/* Step 3: Service and financial terms info */}
        {currentStep === 3 && (
          <div className={styles['info-box']}>
            <p>
              <strong>Право на надоместок:</strong> Според член 878-879, посредникот има право на надоместок дури и кога тоа не е договорено.
              Комисијата мора да биде разумна и јасно дефинирана. Ако посредникот ги застапува двете страни (член 881), комисијата се дели попола.
            </p>
          </div>
        )}

        {/* Step 4: Legal terms info */}
        {currentStep === 4 && (
          <div className={styles['info-box']}>
            <p>
              <strong>Правни обврски:</strong> Овие одредби се задолжителни според македонското законодавство. Дневникот на посредување (член 877)
              и доверливоста (член 876) се законски обврски. Ако посредникот работи против интересите на клиентот (член 882), го губи правото на надоместок.
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

        {/* Enhanced role-based previews with legal context */}
        {currentStep === 1 && formData.userRole && (
          <div className={styles['preview-box']}>
            <h4>Ваша улога во договорот:</h4>
            <p>
              {formData.userRole === 'mediator' ? (
                <>
                  <strong>🤝 Посредник (член 869)</strong><br/>
                  Вие се обврзувате да најдете и поврзете договорни страни. Обврски: грижа на добар деловен човек (член 874),
                  водење дневник (член 877), доверливост (член 876).
                </>
              ) : (
                <>
                  <strong>🏢 Налогодавец (член 869)</strong><br/>
                  Вие барате посредник да ви најде и поврзе со трето лице. Права: отповик на налог (член 872),
                  нема обврска да склучи договор (член 873).
                </>
              )}
            </p>
          </div>
        )}

        {/* Agreement duration and territory preview */}
        {currentStep === 1 && (formData.agreementDuration || formData.territoryScope) && (
          <div className={styles['preview-box']}>
            <h4>Основни услови:</h4>
            <div className={styles['preview-grid']}>
              {formData.agreementDuration && (
                <div><strong>Времетраење:</strong> {formData.agreementDuration}</div>
              )}
              {formData.territoryScope && (
                <div><strong>Територија:</strong> {formData.territoryScope}</div>
              )}
            </div>
          </div>
        )}

        {/* Client type preview when user is client */}
        {currentStep === 1 && formData.userRole === 'client' && formData.clientType && (
          <div className={styles['preview-box']}>
            <h4>Тип на клиент:</h4>
            <p>
              {formData.clientType === 'natural' ? (
                <>
                  <strong>👤 Физичко лице</strong><br/>
                  Договорот се склучува како индивидуалец. Потребни се лични податоци и ЕМБГ.
                </>
              ) : (
                <>
                  <strong>🏢 Правно лице</strong><br/>
                  Договорот се склучува како компанија. Потребни се регистрациони податоци и ЕДБ број.
                </>
              )}
            </p>
          </div>
        )}

        {/* Enhanced service and financial terms preview */}
        {currentStep === 3 && (formData.typeOfMediation || formData.commissionRate) && (
          <div className={styles['preview-box']}>
            <h4>Преглед на финансиските услови:</h4>
            <div className={styles['preview-grid']}>
              {formData.typeOfMediation && (
                <div><strong>Тип на посредување:</strong> {formData.typeOfMediation}</div>
              )}
              {formData.specificContractType && (
                <div><strong>Тип на договор:</strong> {formData.specificContractType}</div>
              )}
              {formData.commissionRate && (
                <div><strong>Комисија:</strong> {formData.commissionRate}% ({formData.commissionCalculation})</div>
              )}
              {formData.paymentTiming && (
                <div><strong>Плаќање:</strong> {formData.paymentTiming}</div>
              )}
              {formData.targetContractValueRange && (
                <div><strong>Очекувана вредност:</strong> {formData.targetContractValueRange}</div>
              )}
            </div>
          </div>
        )}

        {/* Legal terms preview */}
        {currentStep === 4 && (formData.confidentialityPeriod || formData.disputeResolution) && (
          <div className={styles['preview-box']}>
            <h4>Преглед на правните услови:</h4>
            <div className={styles['preview-grid']}>
              {formData.confidentialityPeriod && (
                <div><strong>Доверливост:</strong> {formData.confidentialityPeriod}</div>
              )}
              {formData.disputeResolution && (
                <div><strong>Спорови:</strong> {formData.disputeResolution}</div>
              )}
              {formData.earlyTerminationNoticePeriod && (
                <div><strong>Отповик:</strong> {formData.earlyTerminationNoticePeriod}</div>
              )}
              <div><strong>Дневник:</strong> ДА (законски задолжителен)</div>
              {formData.costReimbursement && (
                <div><strong>Трошоци:</strong> Надоместување договорено</div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced summary in final step with comprehensive legal overview */}
        {currentStep === mediationAgreementConfig.steps.length && (
          <div className={styles['summary-box']}>
            <h4>Резиме на договор за посредување (членови 869-882 ЗОО):</h4>
            <div className={styles['summary-grid']}>
              <div>
                <strong>Ваша улога:</strong> {formData.userRole === 'mediator' ? 'Посредник' : 'Налогодавец'}
              </div>
              {formData.userRole === 'mediator' && (
                <div>
                  <strong>Налогодавец:</strong> {
                    formData.clientTypeForMediator === 'natural'
                      ? formData.naturalClientName
                      : formData.clientTypeForMediator === 'legal'
                        ? formData.legalClientName
                        : '[Не е внесено]'
                  } ({formData.clientTypeForMediator === 'natural' ? 'Физичко лице' : 'Правно лице'})
                </div>
              )}
              {formData.userRole === 'client' && (
                <div>
                  <strong>Посредник:</strong> {formData.mediatorCompanyName || '[Не е внесено]'}
                </div>
              )}
              <div>
                <strong>Датум и времетраење:</strong> {formData.agreementDate} - {formData.agreementDuration}
              </div>
              <div>
                <strong>Територијален опсег:</strong> {formData.territoryScope}
              </div>
              <div>
                <strong>Тип на посредување:</strong> {formData.typeOfMediation} - {formData.specificContractType}
              </div>
              <div>
                <strong>Комисија:</strong> {formData.commissionRate}% ({formData.commissionCalculation}) - {formData.paymentTiming}
              </div>
              <div>
                <strong>Правни услови:</strong> Доверливост {formData.confidentialityPeriod}, {formData.disputeResolution}
              </div>
              <div>
                <strong>Отповик на налог:</strong> {formData.earlyTerminationNoticePeriod} (член 872)
              </div>
              {formData.dualRepresentationAllowed && (
                <div>
                  <strong>Двојно застапување:</strong> Дозволено (член 881)
                </div>
              )}
            </div>

            <div className={styles['legal-notice']}>
              <h5>⚖️ Правни обврски според ЗОО:</h5>
              <ul>
                <li><strong>Посредник (чл. 874-877):</strong> Грижа на добар деловен човек, водење дневник, доверливост, известување за околности</li>
                <li><strong>Налогодавец (чл. 872-873):</strong> Право на отповик, нема обврска да склучи договор, плаќање провизија</li>
                <li><strong>Комисија (чл. 878-881):</strong> Право на надоместок дури и кога не е договорено</li>
                <li><strong>Овластување (чл. 871):</strong> {formData.writtenAuthorizationForPerformance ? 'Писмено овластување потребно за примање на исполнување' : 'Нема право на примање на исполнување'}</li>
                <li><strong>Губење право (чл. 882):</strong> Кога посредникот работи против интересите на налогодавецот</li>
                <li><strong>Трошоци (чл. 880):</strong> {formData.costReimbursement ? 'Надоместување договорено' : 'Надоместување само ако е договорено'}</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseDocumentPage
      config={mediationAgreementConfig}
      renderStepContent={renderStepContent}
      title="Договор за посредување (чл. 869-882 ЗОО)"
      description="Создајте правно комплиантен договор за посредување согласно македонското законодавство. Обухвата сите обврски на посредникот и правата на налогодавецот."
    />
  );
};

export default MediationAgreementPage;