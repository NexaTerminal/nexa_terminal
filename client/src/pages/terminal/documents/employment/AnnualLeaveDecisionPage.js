import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import { annualLeaveDecisionConfig, getStepFields } from '../../../../config/documents/annualLeaveDecision';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Annual Leave Decision Page
 * Uses the reusable base components and configuration-driven approach.
 *
 * Deep link: /terminal/documents/employment/annual-leave-decision?employeeId=X
 * (from the Вработени registry) pre-fills the employee fields. useDocumentForm
 * snapshots initialFormData once at mount, so BaseDocumentPage renders only
 * after the employee fetch resolves.
 */
const AnnualLeaveDecisionPage = () => {
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get('employeeId');
  const { token } = useAuth();

  const [ready, setReady] = useState(!employeeId);
  const [prefill, setPrefill] = useState({});

  useEffect(() => {
    if (!employeeId || !token) return;
    let active = true;
    axios.get(`/api/employees/${employeeId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!active) return;
        const e = res.data?.data;
        if (e) {
          setPrefill({
            employeeSelect: e.fullName || '',
            employeeName: e.fullName || '',
            employeePosition: e.position || ''
          });
        }
      })
      .catch(() => { /* fetch failure → proceed blank; manual entry still works */ })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [employeeId, token]);

  const config = useMemo(() => ({
    ...annualLeaveDecisionConfig,
    initialFormData: { ...annualLeaveDecisionConfig.initialFormData, ...prefill }
  }), [prefill]);

  /**
   * Custom step content renderer
   * This is the only document-specific logic needed
   */
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    const stepFields = getStepFields(currentStep);
    const stepConfig = annualLeaveDecisionConfig.steps.find(s => s.id === currentStep);

    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        {stepConfig.description && <p>{stepConfig.description}</p>}

        {stepFields.map(field => (
          <FormField
            key={field.name}
            field={field}
            value={formData[field.name]}
            onChange={handleInputChange}
            error={errors[field.name]}
            disabled={isGenerating}
          />
        ))}
      </div>
    );
  };

  if (!ready) return null;

  return (
    <BaseDocumentPage
      config={config}
      renderStepContent={renderStepContent}
      title="Решение за годишен одмор"
      description="Пополнете ги потребните податоци за издавање решение за годишен одмор"
    />
  );
};

export default AnnualLeaveDecisionPage;
