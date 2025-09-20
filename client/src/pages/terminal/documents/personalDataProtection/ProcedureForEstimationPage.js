import React, { useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import Header from "../../../../components/common/Header";
import Sidebar from "../../../../components/terminal/Sidebar";
import ProfileReminderBanner from "../../../../components/terminal/ProfileReminderBanner";
import DocumentPreview from "../../../../components/terminal/documents/DocumentPreview";
import FormField from "../../../../components/forms/FormField";
import { procedureForEstimationConfig } from '../../../../config/documents/procedureForEstimation';
import styles from "../../../../styles/terminal/documents/DocumentGeneration.module.css";

const ProcedureForEstimationPage = () => {
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleCheckboxChange = (name, value, checked) => {
    setFormData(prev => {
      const currentValues = prev[name] || [];
      if (checked) {
        return {
          ...prev,
          [name]: [...currentValues, value]
        };
      } else {
        return {
          ...prev,
          [name]: currentValues.filter(v => v !== value)
        };
      }
    });
  };

  const generateDocument = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/documents/procedure-for-estimation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Неуспешно генерирање на документот');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Procedura_procenka_vlijanie_LP_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccess('Документот е успешно генериран!');
    } catch (err) {
      console.error('Error generating document:', err);
      setError('Неуспешно генерирање на документот: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const getStepFields = (stepIndex) => {
    return procedureForEstimationConfig.steps[stepIndex]?.fields || [];
  };

  const nextStep = () => {
    if (currentStep < procedureForEstimationConfig.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className={styles.pageLayout}>
      <Header />
      <div className={styles.mainContent}>
        <Sidebar />
        <div className={styles.contentArea}>
          <ProfileReminderBanner />

          <div className={styles.documentContainer}>
            <div className={styles.documentHeader}>
              <h1 className={styles.documentTitle}>
                {procedureForEstimationConfig.title}
              </h1>
              <p className={styles.documentSubtitle}>
                {procedureForEstimationConfig.subtitle}
              </p>
            </div>

            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            {success && (
              <div className={styles.successMessage}>
                {success}
              </div>
            )}

            <div className={styles.formContainer}>
              <div className={styles.stepIndicator}>
                <span>Чекор {currentStep + 1} од {procedureForEstimationConfig.steps.length}</span>
              </div>

              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}>
                  {procedureForEstimationConfig.steps[currentStep].title}
                </h2>
                <p className={styles.stepDescription}>
                  {procedureForEstimationConfig.steps[currentStep].description}
                </p>

                <div className={styles.formFields}>
                  {getStepFields(currentStep).map((field) => (
                    <FormField
                      key={field.name}
                      field={field}
                      value={formData[field.name] || (field.type === 'checkbox' ? [] : '')}
                      onChange={handleInputChange}
                      onCheckboxChange={handleCheckboxChange}
                      error={errors[field.name]}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.stepNavigation}>
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className={styles.prevButton}
                  >
                    Претходно
                  </button>
                )}

                {currentStep < procedureForEstimationConfig.steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className={styles.nextButton}
                  >
                    Следно
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={generateDocument}
                    disabled={isGenerating}
                    className={styles.generateButton}
                  >
                    {isGenerating ? 'Генерира...' : 'Генерирај документ'}
                  </button>
                )}
              </div>
            </div>

            {procedureForEstimationConfig.previewEnabled && (
              <div className={styles.previewSection}>
                <DocumentPreview
                  title={procedureForEstimationConfig.title}
                  config={procedureForEstimationConfig}
                  formData={formData}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcedureForEstimationPage;