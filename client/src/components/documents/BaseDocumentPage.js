import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../common/Header';
import Sidebar from '../terminal/Sidebar';
import ProfileReminderBanner from '../terminal/ProfileReminderBanner';
import DocumentPreview from '../terminal/documents/DocumentPreview';
import FormField, { TermsField } from '../forms/FormField';
import { useDocumentForm } from '../../hooks/useDocumentForm';
import styles from '../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Base Document Page Component
 * Reusable template for all document generation pages
 */
const BaseDocumentPage = ({ 
  config,
  renderStepContent,
  customPreviewComponent,
  title = "Генерирање на документ",
  description = "Пополнете ги потребните податоци за генерирање на документот"
}) => {
  const { currentUser } = useAuth();
  
  const {
    // State
    currentStep,
    formData,
    errors,
    isGenerating,
    showMissingFieldsModal,
    missingFields,
    currentStepData,

    // Computed values
    isLastStep,
    isFirstStep,
    
    // Actions
    handleInputChange,
    nextStep,
    prevStep,
    handleSubmit,
    forceGeneration,
    
    // Modal controls
    setShowMissingFieldsModal,
    
    // Steps configuration
    steps
  } = useDocumentForm(config);

  // Create preview data with fallbacks
  const previewData = React.useMemo(() => {
    const preview = { ...formData };
    
    // Add fallbacks for preview
    Object.keys(preview).forEach(key => {
      if (!preview[key] || (typeof preview[key] === 'string' && !preview[key].trim())) {
        preview[key] = `[${getFallbackLabel(key)}]`;
      }
    });
    
    return preview;
  }, [formData]);

  return (
    <div className={styles.documentPage}>
      <Header isTerminal={true} />
      <div className={styles.dashboardLayout}>
        <Sidebar />
        <main className={styles.dashboardMain}>
          
          <ProfileReminderBanner currentUser={currentUser} />
          
          <div className={styles.splitLayout}>
            {/* Form Section */}
            <div className={styles.formSection}>
              {/* Step Progress */}
              <StepProgress steps={steps} currentStep={currentStep} />
              
              <div className={styles['form-sections']}>
                <div className={styles['step-content']}>
                  {/* Dynamic Step Content */}
                  {renderStepContent && renderStepContent({
                    currentStep,
                    currentStepData,
                    formData,
                    handleInputChange,
                    errors,
                    isGenerating
                  })}
                  
                  {/* Default rendering if no custom renderer provided */}
                  {!renderStepContent && currentStepData && (
                    <DefaultStepRenderer
                      stepData={currentStepData}
                      formData={formData}
                      handleInputChange={handleInputChange}
                      errors={errors}
                      disabled={isGenerating}
                    />
                  )}
                </div>
              </div>

              {/* Terms and Conditions */}
              <TermsField
                value={formData.acceptTerms}
                onChange={handleInputChange}
                disabled={isGenerating}
              />

              {/* Form Actions */}
              <FormActions
                isFirstStep={isFirstStep}
                isLastStep={isLastStep}
                isGenerating={isGenerating}
                onPrevStep={prevStep}
                onNextStep={nextStep}
                onSubmit={handleSubmit}
              />
            </div>

            {/* Preview Section */}
            <div className={styles.previewSection}>
              {customPreviewComponent ? 
                customPreviewComponent({
                  formData,
                  currentStep,
                  onChange: handleInputChange
                }) :
                <DocumentPreview 
                  formData={previewData}
                  documentType={config.documentType}
                  currentStep={currentStep}
                />
              }
            </div>
          </div>
        </main>
      </div>

      {/* Missing Fields Modal */}
      <MissingFieldsModal
        isOpen={showMissingFieldsModal}
        missingFields={missingFields}
        isGenerating={isGenerating}
        onCancel={() => setShowMissingFieldsModal(false)}
        onConfirm={forceGeneration}
      />
    </div>
  );
};

/**
 * Step Progress Component
 */
const StepProgress = ({ steps, currentStep }) => (
  <div className={styles['step-progress-minimal']}>
    {steps.map((step) => (
      <div 
        key={step.id} 
        className={`${styles['step-dot']} ${
          step.id <= currentStep ? styles['dot-active'] : styles['dot-inactive']
        }`}
      />
    ))}
  </div>
);

/**
 * Default Step Renderer - renders fields based on configuration
 */
const DefaultStepRenderer = ({ stepData, formData, handleInputChange, errors, disabled }) => {
  if (!stepData.fields) return null;

  return (
    <div className={styles['form-section']}>
      <h3>{stepData.title}</h3>
      {stepData.description && <p>{stepData.description}</p>}
      
      {stepData.fields.map(field => (
        <FormField
          key={field.name}
          field={field}
          value={formData[field.name]}
          formData={formData}
          onChange={handleInputChange}
          error={errors[field.name]}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

/**
 * Form Actions Component
 */
const FormActions = ({ 
  isFirstStep, 
  isLastStep, 
  isGenerating, 
  onPrevStep, 
  onNextStep, 
  onSubmit 
}) => (
  <div className={styles['form-actions']}>
    <div className={styles['navigation-buttons']}>
      {!isFirstStep && (
        <button 
          type="button" 
          onClick={onPrevStep}
          className={`${styles.btn} ${styles['prev-btn']}`}
          disabled={isGenerating}
        >
          ← Назад
        </button>
      )}
      
      {isLastStep ? (
        <button 
          type="button" 
          onClick={onSubmit} 
          disabled={isGenerating}
          className={`${styles.btn} ${styles['generate-btn']}`}
        >
          {isGenerating ? 'Се генерира...' : 'Генерирај'}
        </button>
      ) : (
        <button 
          type="button" 
          onClick={onNextStep}
          className={`${styles.btn} ${styles['next-btn']}`}
          disabled={isGenerating}
        >
          Следно →
        </button>
      )}
    </div>
  </div>
);

/**
 * Missing Fields Modal Component
 */
const MissingFieldsModal = ({ 
  isOpen, 
  missingFields, 
  isGenerating, 
  onCancel, 
  onConfirm 
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>⚠️ Внимание</h3>
        </div>
        <div className={styles.modalBody}>
          <p>Следните полиња не се пополнети:</p>
          <ul className={styles.missingFieldsList}>
            {missingFields.map((field, index) => (
              <li key={index}>{field}</li>
            ))}
          </ul>
          <p>Дали сакате да продолжите без овие информации?</p>
        </div>
        <div className={styles.modalActions}>
          <button 
            onClick={onCancel}
            className={styles.cancelBtn}
            disabled={isGenerating}
          >
            Назад
          </button>
          <button 
            onClick={onConfirm}
            className={styles.confirmBtn}
            disabled={isGenerating}
          >
            {isGenerating ? 'Се генерира...' : 'Продолжи'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to get fallback labels for preview
const getFallbackLabel = (fieldName) => {
  const labels = {
    employeeName: 'Име на работник',
    employeeAddress: 'Адреса на работник',
    employeePIN: 'ЕМБГ',
    jobPosition: 'Работна позиција',
    workTasks: 'Работни обврски',
    netSalary: 'Плата',
    agreementDate: 'Датум',
    placeOfWork: 'Место на работа',
    dailyWorkTime: 'Работно време',
    // Add more as needed
  };
  
  return labels[fieldName] || fieldName;
};

export default BaseDocumentPage;