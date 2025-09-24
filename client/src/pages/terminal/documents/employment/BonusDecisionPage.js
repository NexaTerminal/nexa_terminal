import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField, { ConditionalField } from '../../../../components/forms/FormField';
import { bonusDecisionConfig, getStepFields } from '../../../../config/documents/bonusDecision';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Bonus Decision Page
 * Uses the reusable base components and configuration-driven approach
 * This page generates comprehensive decisions for various types of employee bonuses
 */
const BonusDecisionPage = () => {

  /**
   * Custom step content renderer
   * This is the only document-specific logic needed
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = bonusDecisionConfig.steps.find(s => s.id === currentStep);

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        {stepConfig.description && <p>{stepConfig.description}</p>}

        {/* Add informational note for step 1 */}
        {currentStep === 1 && (
          <div className={styles['info-box']} style={{
            backgroundColor: '#e8f4fd',
            border: '1px solid #bee5eb',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>ℹ️ Информации:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Внесете ги основните податоци за работникот за кого се донесува одлуката</li>
              <li>Името и позицијата мора да одговараат со податоците од работниот договор</li>
              <li>Датумите на одлуката и влегување во сила можат да бидат различни</li>
              <li>Ако не внесете датуми, автоматски ќе се користи денешниот датум</li>
            </ul>
          </div>
        )}

        {/* Add informational note for step 2 */}
        {currentStep === 2 && (
          <div className={styles['info-box']} style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>💰 Напомена за бонусот:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Изберете соодветен тип на бонус според природата на наградувањето</li>
              <li>Внесете го нето износот на бонусот во македонски денари</li>
              <li>Детално опишете ја причината за поголема транспарентност</li>
              <li>Документот се базира на член 105 од Законот за работните односи</li>
            </ul>
          </div>
        )}

        {/* Add informational note for step 3 */}
        {currentStep === 3 && (
          <div className={styles['info-box']} style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>📋 Дополнителни услови:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Сите полиња во овој чекор се опционални</li>
              <li>Критериумите помагаат во воспоставување на јасни стандарди</li>
              <li>Периодот дефинира за кое време се однесува бонусот</li>
              <li>Редовните бонуси влијаат на идните очекувања на вработените</li>
            </ul>
          </div>
        )}

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
      config={bonusDecisionConfig}
      renderStepContent={renderStepContent}
      title="Одлука за бонус"
      description="Пополнете ги потребните податоци за издавање одлука за доделување бонус до вработен според член 105 од Законот за работни односи"
    />
  );
};

export default BonusDecisionPage;