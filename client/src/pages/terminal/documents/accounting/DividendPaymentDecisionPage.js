import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import { dividendPaymentDecisionConfig, getStepFields } from '../../../../config/documents/dividendPaymentDecision';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Dividend Payment Decision Page
 * Generates decision documents for dividend payment to shareholders
 * Based on Article 490 of the Law on Trading Companies
 * Uses the reusable base components and configuration-driven approach
 */
const DividendPaymentDecisionPage = () => {

  /**
   * Custom step content renderer
   * This is the only document-specific logic needed
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = dividendPaymentDecisionConfig.steps.find(s => s.id === currentStep);

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
            <strong>📋 Информации за дивидендата:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Документот се базира на член 490 од Законот за трговските друштва и се донесува на Собир на содружници на Друштвото кај ДОО или Собрание на акционери кај АД</li>
              <li>Дивидендата се исплаќа од акумулирана и/или тековна добивка на друштвото, на сите содружници пропорционално на нивните удели</li>
              <li>Бруто износите се оданочуваат со 10% персонален данок на доход</li>
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
              За повеќе информации за правната рамка на исплата на дивиденда според член 490 од Законот за трговските друштва, погледнете го нашиот{' '}
              <a
                href="https://www.nexa.mk/terminal/blogs/ba4348c7-3ff4-477a-aa57-97b96ae1b3bd"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#1976d2', textDecoration: 'underline' }}
              >
                детален водич за дивиденда
              </a>.
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

    // Step 2: Shareholders List
    if (currentStep === 2) {
      return (
        <div className={styles['form-section']}>
          <h3>{stepConfig.title}</h3>
          {stepConfig.description && <p>{stepConfig.description}</p>}

          {/* Shareholders list information */}
          <div className={styles['info-box']} style={{
            backgroundColor: '#e8f5e9',
            border: '1px solid #c8e6c9',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>📊 Упатство за внесување на содружници:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Внесете го точното име и презиме или назив како што е во Книгата на удели</li>
              <li>Износите се внесуваат како БРУТО износи (пред оданочување)</li>
              <li>Распределбата мора да биде пропорционална на уделите</li>
              <li>Од секој износ автоматски ќе се одбие 10% персонален данок при исплата</li>
              <li>Додадете најмалку еден содружник за да продолжите</li>
            </ul>
          </div>

          <ShareholdersList
            shareholders={formData.shareholdersList || []}
            onChange={handleInputChange}
            error={errors.shareholdersList}
            disabled={isGenerating}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <BaseDocumentPage
      config={dividendPaymentDecisionConfig}
      renderStepContent={renderStepContent}
      title="Одлука за исплата на дивиденда"
      description="Пополнете ги потребните податоци за издавање одлука за исплата на дивиденда на содружниците според член 490 од Законот за трговските друштва"
    />
  );
};

/**
 * Shareholders List Component
 * Custom component for managing the array of shareholders with multiple fields
 */
const ShareholdersList = ({ shareholders, onChange, error, disabled }) => {
  const handleShareholderChange = (index, field, value) => {
    const updatedShareholders = [...shareholders];
    updatedShareholders[index] = {
      ...updatedShareholders[index],
      [field]: value
    };
    onChange('shareholdersList', updatedShareholders);
  };

  const addShareholder = () => {
    const newShareholder = {
      shareholderName: '',
      grossDividendAmount: ''
    };
    onChange('shareholdersList', [...shareholders, newShareholder]);
  };

  const removeShareholder = (index) => {
    if (shareholders.length > 0) {
      const updatedShareholders = shareholders.filter((_, i) => i !== index);
      onChange('shareholdersList', updatedShareholders);
    }
  };

  // Initialize with one empty shareholder if none exist
  React.useEffect(() => {
    if (!shareholders || shareholders.length === 0) {
      addShareholder();
    }
  }, []);

  const fieldConfig = dividendPaymentDecisionConfig.fields.shareholdersList;

  return (
    <div className={styles['form-group']}>
      <label>
        {fieldConfig.label} *
        {fieldConfig.helpText && (
          <span className={styles['help-tooltip']} data-tooltip={fieldConfig.helpText}>
            ❓
          </span>
        )}
      </label>

      <div className={styles['shareholders-list']}>
        {shareholders && shareholders.length > 0 ? (
          shareholders.map((shareholder, index) => (
            <div key={index} className={styles['shareholder-row']}>
              <div className={styles['shareholder-number']}>{index + 1}</div>

              <div className={styles['shareholder-fields']}>
                {fieldConfig.arrayFields.map(field => (
                  <div key={field.name} className={styles['form-group']}>
                    <label htmlFor={`${field.name}_${index}`}>
                      {field.label} *
                      {field.helpText && (
                        <span className={styles['help-tooltip']} data-tooltip={field.helpText}>
                          ❓
                        </span>
                      )}
                    </label>
                    <input
                      type={field.type}
                      id={`${field.name}_${index}`}
                      placeholder={field.placeholder}
                      value={shareholder[field.name] || ''}
                      onChange={(e) => handleShareholderChange(index, field.name, e.target.value)}
                      disabled={disabled}
                      min={field.min}
                      step={field.step}
                    />
                  </div>
                ))}
              </div>

              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeShareholder(index)}
                  className={styles['remove-btn']}
                  title="Отстрани содружник"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        ) : null}

        {!disabled && (
          <button
            type="button"
            onClick={addShareholder}
            className={styles['add-btn']}
          >
            + Додади содружник
          </button>
        )}
      </div>

      {error && <span className={styles['error-message']}>{error}</span>}
    </div>
  );
};

export default DividendPaymentDecisionPage;
