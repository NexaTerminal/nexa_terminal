import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField, { ConditionalField } from '../../../../components/forms/FormField';
import { servicesContractConfig, serviceTemplates, getStepFields } from '../../../../config/documents/servicesContract';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Services Contract Page (Договор за услуги)
 * Based on Macedonian Law Articles 619-648
 * Implements intelligent auto-population based on service type selection
 * Uses the reusable base components and configuration-driven approach
 */
const ServicesContractPage = () => {

  /**
   * Get dynamic placeholder for service description based on selected service type
   */
  const getServiceDescriptionPlaceholder = (serviceType) => {
    if (!serviceType || !serviceTemplates[serviceType]) {
      return 'Прецизно опишете ја услугата која треба да се изведе...';
    }
    return serviceTemplates[serviceType].description;
  };

  /**
   * Get dynamic placeholder for deliverables based on selected service type
   */
  const getDeliverablesPlaceholder = (serviceType) => {
    if (!serviceType || !serviceTemplates[serviceType]) {
      return 'Наведете ги конкретните резултати/испораки...';
    }
    return serviceTemplates[serviceType].deliverables;
  };

  /**
   * Get dynamic placeholder for quality standards based on selected service type
   */
  const getQualityStandardsPlaceholder = (serviceType) => {
    if (!serviceType || !serviceTemplates[serviceType]) {
      return 'Опишете ги стандардите кои работата мора да ги задоволува...';
    }
    return serviceTemplates[serviceType].qualityStandards;
  };

  /**
   * Render milestone fields dynamically based on numberOfMilestones
   */
  const renderMilestoneFields = (formData, handleInputChange, errors, isGenerating) => {
    const numberOfMilestones = parseInt(formData.numberOfMilestones) || 0;

    if (numberOfMilestones < 1) {
      return null;
    }

    const milestoneFields = [];
    for (let i = 1; i <= numberOfMilestones; i++) {
      milestoneFields.push(
        <div key={`milestone-${i}`} className={styles['milestone-group']} style={{
          backgroundColor: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #e0e0e0'
        }}>
          <h4 style={{ marginBottom: '12px', color: '#1976d2' }}>Фаза {i}</h4>

          <FormField
            field={{
              name: `milestone${i}Description`,
              type: 'text',
              label: `Опис на фаза ${i}`,
              placeholder: `пр. Анализа и планирање`,
              required: true,
              helpText: `Опишете ја фазата ${i} од извршувањето на услугата. Секоја фаза треба да има јасни резултати и критериуми за завршување.`
            }}
            value={formData[`milestone${i}Description`] || ''}
            onChange={handleInputChange}
            error={errors[`milestone${i}Description`]}
            disabled={isGenerating}
            formData={formData}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField
              field={{
                name: `milestone${i}Percentage`,
                type: 'number',
                label: `Процент од вкупно (%)`,
                placeholder: '33',
                min: 1,
                max: 100,
                step: 1,
                required: true,
                helpText: `Процент од вкупната вредност за фаза ${i}. Сите проценти мора да се соберат во 100%.`
              }}
              value={formData[`milestone${i}Percentage`] || ''}
              onChange={handleInputChange}
              error={errors[`milestone${i}Percentage`]}
              disabled={isGenerating}
              formData={formData}
            />

            <FormField
              field={{
                name: `milestone${i}Amount`,
                type: 'number',
                label: `Износ (денари)`,
                placeholder: '15000',
                min: 1,
                step: 1,
                required: true,
                helpText: `Износ во денари за фаза ${i} кој одговара на наведениот процент.`
              }}
              value={formData[`milestone${i}Amount`] || ''}
              onChange={handleInputChange}
              error={errors[`milestone${i}Amount`]}
              disabled={isGenerating}
              formData={formData}
            />
          </div>
        </div>
      );
    }

    return (
      <div className={styles['milestones-container']}>
        <h3 style={{ marginBottom: '16px' }}>Детали за фази/милстони</h3>
        {milestoneFields}
      </div>
    );
  };

  /**
   * Custom step content renderer
   * This is the only document-specific logic needed
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = servicesContractConfig.steps.find(s => s.id === currentStep);

    // Handle service type change - auto-populate fields
    const handleServiceTypeChange = (e) => {
      const newServiceType = e.target.value;
      handleInputChange(e);

      // Auto-populate related fields based on service type template
      if (newServiceType && serviceTemplates[newServiceType]) {
        const template = serviceTemplates[newServiceType];

        // Trigger auto-population for each field
        setTimeout(() => {
          if (!formData.serviceDescription) {
            handleInputChange({ target: { name: 'serviceDescription', value: template.description } });
          }
          if (!formData.deliverables) {
            handleInputChange({ target: { name: 'deliverables', value: template.deliverables } });
          }
          if (!formData.paymentStructure) {
            handleInputChange({ target: { name: 'paymentStructure', value: template.paymentStructure } });
          }
          if (!formData.inspectionPeriod) {
            handleInputChange({ target: { name: 'inspectionPeriod', value: template.inspectionPeriod } });
          }
          if (!formData.warrantyPeriod) {
            handleInputChange({ target: { name: 'warrantyPeriod', value: template.warrantyPeriod } });
          }
          if (!formData.qualityStandards) {
            handleInputChange({ target: { name: 'qualityStandards', value: template.qualityStandards } });
          }
          if (!formData.materialProvider) {
            handleInputChange({ target: { name: 'materialProvider', value: template.materialProvider } });
          }
          if (!formData.supervisionRights) {
            handleInputChange({ target: { name: 'supervisionRights', value: template.supervisionRights } });
          }
        }, 0);
      }
    };

    // Map fields with dynamic placeholders and custom handlers
    const mappedFields = stepFields.map(field => {
      if (field.name === 'serviceType') {
        return {
          ...field,
          customOnChange: handleServiceTypeChange
        };
      }
      if (field.name === 'serviceDescription') {
        return {
          ...field,
          placeholder: getServiceDescriptionPlaceholder(formData.serviceType)
        };
      }
      if (field.name === 'deliverables') {
        return {
          ...field,
          placeholder: getDeliverablesPlaceholder(formData.serviceType)
        };
      }
      if (field.name === 'qualityStandards') {
        return {
          ...field,
          placeholder: getQualityStandardsPlaceholder(formData.serviceType)
        };
      }
      return field;
    });

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        {stepConfig.description && <p>{stepConfig.description}</p>}

        {/* Step-specific info boxes */}
        {currentStep === 1 && (
          <div className={styles['info-box']} style={{
            backgroundColor: '#e3f2fd',
            border: '1px solid #90caf9',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>📋 Договор за услуги (Членови 619-648 од ЗОО):</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Изберете го видот на услуга - системот ќе препорача оптимални вредности</li>
              <li>Договорот регулира права и обврски на двете страни согласно македонското право</li>
              <li>Автоматско пополнување на стандарди, рокови и структура на плаќање</li>
            </ul>
          </div>
        )}

        {currentStep === 4 && (
          <div className={styles['info-box']} style={{
            backgroundColor: '#fff3e0',
            border: '1px solid #ffb74d',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>💰 Структура на плаќање (Член 642):</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li><strong>Фиксна цена:</strong> Договорен паушален износ за целата услуга</li>
              <li><strong>Временски:</strong> Часовна стапка x реално работени часови</li>
              <li><strong>Милстони:</strong> Плаќање по завршени фази (препорачано за сложени услуги)</li>
            </ul>
          </div>
        )}

        {currentStep === 6 && (
          <div className={styles['info-box']} style={{
            backgroundColor: '#f3e5f5',
            border: '1px solid #ce93d8',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>✅ Квалитет и гаранција (Членови 633-640):</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li><strong>Инспекција:</strong> Рок за пријава на видливи недостатоци по примопредавање</li>
              <li><strong>Гаранција:</strong> Период за одговорност за скриени недостатоци</li>
              <li>Корисникот има право на поправка, намалување на цена или раскинување</li>
            </ul>
          </div>
        )}

        {/* Render mapped fields */}
        {mappedFields.map(field => (
          <React.Fragment key={field.name}>
            {/* Regular fields */}
            {!field.condition && (
              <FormField
                field={field}
                value={formData[field.name]}
                onChange={field.customOnChange || handleInputChange}
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
                  onChange={field.customOnChange || handleInputChange}
                  error={errors[field.name]}
                  disabled={isGenerating}
                  formData={formData}
                />
              </ConditionalField>
            )}
          </React.Fragment>
        ))}

        {/* Render milestone fields dynamically for step 4 */}
        {currentStep === 4 && formData.paymentStructure === 'milestone-based' && formData.numberOfMilestones && (
          renderMilestoneFields(formData, handleInputChange, errors, isGenerating)
        )}
      </div>
    );
  };

  return (
    <BaseDocumentPage
      config={servicesContractConfig}
      renderStepContent={renderStepContent}
      title="Договор за услуги (Services Contract)"
      description="Професионален договор базиран на Членови 619-648 од Законот за облигациони односи. Изберете го видот на услуга за автоматско пополнување на препорачани вредности."
    />
  );
};

export default ServicesContractPage;
