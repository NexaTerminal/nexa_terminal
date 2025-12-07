import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import { cashRegisterMaximumDecisionConfig, getStepFields } from '../../../../config/documents/cashRegisterMaximumDecision';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Cash Register Maximum Decision Page
 * Generates decision documents for setting cash register maximum limits
 * Based on Article 20 of the Payment Transactions Law
 * Uses the reusable base components and configuration-driven approach
 */
const CashRegisterMaximumDecisionPage = () => {

  /**
   * Custom step content renderer
   * This is the only document-specific logic needed
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = cashRegisterMaximumDecisionConfig.steps.find(s => s.id === currentStep);

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
          <strong>📋 Информации за благајничкиот максимум:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Документот се базира на член 20 од Законот за платниот промет</li>
            <li>Благајничкиот максимум определува колку готовина може да се чува во благајната</li>
            <li>Сите готовински примања над максимумот мора да се уплатат на трансакциска сметка</li>
            <li>Уплатата се врши истиот или најдоцна наредниот работен ден од денот на наплатата</li>
            <li>Одлуката се донесува годишно и се применува од денот на донесувањето</li>
            <li>Со донесување на нова одлука, старата престанува да важи</li>
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
            Според член 20 од Законот за платниот промет, компаниите се обврзани да донесат одлука
            за благајнички максимум која го дефинира максималниот износ на готовински средства кои
            можат да се чуваат во благајната. Ова е дел од финансиската дисциплина и транспарентноста
            во работењето на правните субјекти.
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
  };

  return (
    <BaseDocumentPage
      config={cashRegisterMaximumDecisionConfig}
      renderStepContent={renderStepContent}
      title="Одлука за благајнички максимум"
      description="Пополнете ги потребните податоци за издавање одлука за благајнички максимум според член 20 од Законот за платниот промет"
    />
  );
};

export default CashRegisterMaximumDecisionPage;
