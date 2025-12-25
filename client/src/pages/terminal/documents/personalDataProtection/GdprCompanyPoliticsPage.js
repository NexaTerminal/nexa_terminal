import React, { useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import documentService from '../../../../services/documentService';
import DocumentPreview from '../../../../components/terminal/documents/DocumentPreview';
import FormField, { TermsField } from '../../../../components/forms/FormField';
import gdprCompanyPoliticsConfig from '../../../../config/documents/gdprCompanyPolitics';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

const GdprCompanyPoliticsPage = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [acceptTerms, setAcceptTerms] = useState(false);

  const steps = gdprCompanyPoliticsConfig.steps;
  const fields = gdprCompanyPoliticsConfig.fields;

  // Get fields for current step
  const getCurrentStepFields = () => {
    const currentStepId = steps[currentStep]?.id;
    return Object.values(fields).filter(field => field.step === currentStepId);
  };

  // Handle form input changes
  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validate current step
  const validateCurrentStep = () => {
    const currentStepId = steps[currentStep]?.id;
    const validation = gdprCompanyPoliticsConfig.validation.validateStep(currentStepId, formData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  // Handle step navigation
  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
    setErrors({});
  };

  // Generate document
  const generateDocument = async () => {
    setLoading(true);
    try {
      // Validate entire form
      const validation = gdprCompanyPoliticsConfig.validation.validateComplete(formData);

      if (!validation.isValid) {
        setErrors(validation.errors);
        // Go back to first step with errors
        for (let i = 0; i < steps.length; i++) {
          const stepValidation = gdprCompanyPoliticsConfig.validation.validateStep(steps[i].id, formData);
          if (!stepValidation.isValid) {
            setCurrentStep(i);
            break;
          }
        }
        setLoading(false);
        return;
      }

      // Use documentService to generate the document
      await documentService.generateDocument('gdpr-company-politics', formData, {
        fileName: 'GDPR_Politika_Kompanija',
        onStart: () => setLoading(true),
        onSuccess: () => {
          setLoading(false);
        },
        onError: (error) => {
          console.error('Грешка при генерирање на документ:', error);
          alert('Настана грешка при генерирање на документот. Ве молиме обидете се повторно.');
          setLoading(false);
        }
      });

    } catch (error) {
      console.error('Грешка при генерирање на документ:', error);
      alert('Настана грешка при генерирање на документот. Ве молиме обидете се повторно.');
      setLoading(false);
    }
  };

  // Helper to check if field should be visible
  const isFieldVisible = (field) => {
    if (!field.dependsOn) return true;

    const dependencyValue = formData[field.dependsOn.field];
    return dependencyValue === field.dependsOn.value;
  };

  // Get progress percentage
  const getProgress = () => {
    return ((currentStep + 1) / steps.length) * 100;
  };

  if (!user || !user.companyInfo) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          <h3>Не се најдени компаниски информации</h3>
          <p>За да генерирате документи, прво треба да ги внесете информациите за вашата компанија.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          📋 Политика за администрирање со правата на субјектите на персонални податоци
        </h1>
        <p className={styles.description}>
          {gdprCompanyPoliticsConfig.description}
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.formSection}>
          {/* Progress indicator */}
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${getProgress()}%` }}
              ></div>
            </div>
            <div className={styles.stepInfo}>
              Чекор {currentStep + 1} од {steps.length}: {steps[currentStep]?.title}
            </div>
          </div>

          {/* Step tabs */}
          <div className={styles.stepTabs}>
            {steps.map((step, index) => (
              <button
                key={step.id}
                className={`${styles.stepTab} ${
                  index === currentStep ? styles.activeTab : ''
                } ${
                  index < currentStep ? styles.completedTab : ''
                }`}
                onClick={() => {
                  if (index < currentStep || validateCurrentStep()) {
                    setCurrentStep(index);
                  }
                }}
                disabled={index > currentStep}
              >
                <span className={styles.stepNumber}>{index + 1}</span>
                <span className={styles.stepTitle}>{step.title}</span>
              </button>
            ))}
          </div>

          {/* Current step form */}
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>{steps[currentStep]?.title}</h2>
            <p className={styles.stepDescription}>{steps[currentStep]?.description}</p>

            <div className={styles.form}>
              {getCurrentStepFields()
                .filter(isFieldVisible)
                .map((field) => (
                  <FormField
                    key={field.name}
                    field={field}
                    value={formData[field.name] || (field.type === 'multiSelect' ? [] : '')}
                    onChange={(value) => handleInputChange(field.name, value)}
                    error={errors[field.name]}
                  />
                ))}
            </div>
          </div>

          {/* Terms and Conditions - Only show on last step */}
          {currentStep === steps.length - 1 && (
            <TermsField
              value={acceptTerms}
              onChange={(name, value) => setAcceptTerms(value)}
              disabled={loading}
            />
          )}

          {/* Navigation buttons */}
          <div className={styles.navigationButtons}>
            <button
              className={styles.secondaryButton}
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              ← Претходно
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                className={styles.primaryButton}
                onClick={handleNext}
              >
                Следно →
              </button>
            ) : (
              <button
                className={styles.generateButton}
                onClick={generateDocument}
                disabled={loading || !acceptTerms}
              >
                {loading ? 'Се генерира...' : '📄 Генерирај политика'}
              </button>
            )}
          </div>

          {/* Form summary on last step */}
          {currentStep === steps.length - 1 && (
            <div className={styles.formSummary}>
              <h3>Преглед на параметри</h3>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <strong>Компанија:</strong> {user.companyInfo.companyName}
                </div>
                <div className={styles.summaryItem}>
                  <strong>Деловна активност:</strong> {formData.primaryBusinessActivity}
                </div>
                <div className={styles.summaryItem}>
                  <strong>Сложеност на обработка:</strong> {formData.dataProcessingComplexity}
                </div>
                <div className={styles.summaryItem}>
                  <strong>Стандардно време за одговор:</strong> {formData.standardResponseTime}
                </div>
                {formData.hasDedicatedDPO && (
                  <div className={styles.summaryItem}>
                    <strong>ОФЗЛП:</strong> {formData.dpoIsInternal ? 'Интерен вработен' : 'Надворешен консултант'}
                  </div>
                )}
                <div className={styles.summaryItem}>
                  <strong>Одговорен оддел:</strong> {formData.responsibleDepartment}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.previewSection}>
          <DocumentPreview
            documentType="gdprCompanyPolitics"
            formData={formData}
            currentStep={steps[currentStep]?.id}
          />
        </div>
      </div>
    </div>
  );
};

export default GdprCompanyPoliticsPage;