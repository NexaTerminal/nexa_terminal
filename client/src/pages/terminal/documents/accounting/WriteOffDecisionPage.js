import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import { writeOffDecisionConfig, getStepFields } from '../../../../config/documents/writeOffDecision';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Write-off Decision Page
 * Generates decision documents for write-off of receivables or liabilities
 * Based on accounting best practices and positive legal provisions
 * Uses the reusable base components and configuration-driven approach
 */
const WriteOffDecisionPage = () => {

  /**
   * Custom step content renderer
   * This is the only document-specific logic needed
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = writeOffDecisionConfig.steps.find(s => s.id === currentStep);

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        {stepConfig.description && <p>{stepConfig.description}</p>}

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <>
            {/* Informational note about the document */}
            <div className={styles['info-box']} style={{
              backgroundColor: '#fff3e0',
              border: '1px solid #ffe0b2',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              <strong>📋 Информации за одлуката за отпис:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Одлуката се донесува врз основа на позитивни законски одредби</li>
                <li>Побарувања се отпишуваат заради очекувана ненаплативост (нема разумни очекувања за идни економски користи)</li>
                <li>Обврски се отпишуваат заради застареност</li>
                <li>Одлуката мора да биде темелена на најдобрите расположиви проценки</li>
                <li>Се доставува до сите засегнати служби и надворешни деловни партнери</li>
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
              <strong>⚖️ Правна и сметководствена основа:</strong>
              <p style={{ margin: '8px 0' }}>
                Одлуката за отпис е важен сметководствен документ кој го регулира отпишувањето на побарувања
                или обврски кои повеќе не се реални или застарени. За побарувања, одлуката се донесува кога
                од нив не е разумно да се очекуваат идни економски користи. За обврски, одлуката се однесува
                на обврски кои се застарени и повеќе не можат да се наплатат од доверителите. Документот мора
                да биде поткрепен со соодветна сметководствена евиденција и проценки.
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
          </>
        )}

        {/* Step 2: Write-off Items */}
        {currentStep === 2 && (
          <>
            {/* Instructions for adding items */}
            <div className={styles['info-box']} style={{
              backgroundColor: '#e8f5e9',
              border: '1px solid #c8e6c9',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              <strong>📝 Упатство за внесување ставки:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Додадете ја секоја ставка што треба да се отпише (побарување или обврска)</li>
                <li>За секоја ставка внесете: име на партнер, износ во денари, и сметководствена с-ка</li>
                <li>Користете го копчето "Додади уште една ставка" за да додадете повеќе записи</li>
                <li>Износите мора да одговараат со сметководствените евиденции</li>
                <li>Проверете ги податоците пред генерирање на документот</li>
              </ul>
            </div>

            {stepFields.map(field => {
              if (field.type === 'array') {
                return (
                  <div key={field.name} className={styles['array-field-container']}>
                    <label className={styles['field-label']}>
                      {field.label}
                      {field.required && <span className={styles['required-asterisk']}>*</span>}
                      {field.helpText && (
                        <span className={styles['tooltip-icon']} title={field.helpText}>
                          ❓
                        </span>
                      )}
                    </label>

                    {formData[field.name]?.map((item, index) => (
                      <div key={index} className={styles['array-item']} style={{
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '16px',
                        backgroundColor: '#fafafa'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px'
                        }}>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                            Ставка {index + 1}
                          </h4>
                          {formData[field.name].length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = [...formData[field.name]];
                                newItems.splice(index, 1);
                                handleInputChange({ target: { name: field.name, value: newItems } });
                              }}
                              className={styles['remove-item-btn']}
                              style={{
                                background: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              Избриши
                            </button>
                          )}
                        </div>

                        {field.itemFields.map(itemField => (
                          <FormField
                            key={`${field.name}-${index}-${itemField.name}`}
                            field={itemField}
                            value={item[itemField.name] || ''}
                            onChange={(e) => {
                              const newItems = [...formData[field.name]];
                              newItems[index] = {
                                ...newItems[index],
                                [itemField.name]: e.target.value
                              };
                              handleInputChange({ target: { name: field.name, value: newItems } });
                            }}
                            error={errors[`${field.name}[${index}].${itemField.name}`]}
                            disabled={isGenerating}
                            formData={formData}
                          />
                        ))}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const newItem = {};
                        field.itemFields.forEach(itemField => {
                          newItem[itemField.name] = '';
                        });
                        handleInputChange({
                          target: {
                            name: field.name,
                            value: [...formData[field.name], newItem]
                          }
                        });
                      }}
                      className={styles['add-item-btn']}
                      disabled={isGenerating}
                      style={{
                        background: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '10px 20px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        marginTop: '10px'
                      }}
                    >
                      + Додади уште една ставка
                    </button>

                    {errors[field.name] && (
                      <div className={styles['field-error']} style={{ color: '#f44336', marginTop: '8px' }}>
                        {errors[field.name]}
                      </div>
                    )}
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
          </>
        )}
      </div>
    );
  };

  return (
    <BaseDocumentPage
      config={writeOffDecisionConfig}
      renderStepContent={renderStepContent}
      title="Одлука за отпис"
      description="Пополнете ги потребните податоци за издавање одлука за отпис на побарувања или обврски"
    />
  );
};

export default WriteOffDecisionPage;
