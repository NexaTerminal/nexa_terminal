import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../common/Header';
import Sidebar from '../terminal/Sidebar';
import ProfileReminderBanner from '../terminal/ProfileReminderBanner';
import DocumentPreview from '../terminal/documents/DocumentPreview';
import FormField, { TermsField } from '../forms/FormField';
import DocumentSuccessModal from './DocumentSuccessModal';
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
    shareData,
    showSuccessModal,

    // Computed values
    isLastStep,
    isFirstStep,

    // Actions
    handleInputChange,
    nextStep,
    prevStep,
    handleSubmit,
    forceGeneration,
    closeSuccessModal,

    // Modal controls
    setShowMissingFieldsModal,

    // Steps configuration
    steps
  } = useDocumentForm(config);

  // Scroll to top on component mount (fixes mobile auto-scroll issue)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

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

              {/* Terms and Conditions - Only show on last step */}
              {isLastStep && (
                <>
                  <TermsField
                    value={formData.acceptTerms}
                    onChange={handleInputChange}
                    disabled={isGenerating}
                  />

                  {/* Live Preview Link - Only visible when terms are accepted */}
                  {formData.acceptTerms && (
                    <LivePreviewLink formData={formData} documentType={config.documentType} currentUser={currentUser} />
                  )}
                </>
              )}

              {/* Form Actions */}
              <FormActions
                isFirstStep={isFirstStep}
                isLastStep={isLastStep}
                isGenerating={isGenerating}
                onPrevStep={prevStep}
                onNextStep={nextStep}
                onSubmit={handleSubmit}
              />

              {/* Shareable Link Section - Shows after document is generated */}
              {shareData && shareData.shareUrl && (
                <ShareableLinkSection shareUrl={shareData.shareUrl} />
              )}
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

      {/* Success Modal with Shareable Link */}
      <DocumentSuccessModal
        isOpen={showSuccessModal}
        shareUrl={shareData?.shareUrl}
        fileName={shareData?.fileName}
        expiresAt={shareData?.expiresAt}
        onClose={closeSuccessModal}
        onDownloadAgain={() => {
          if (shareData?.shareUrl) {
            // Trigger download again using the shared document endpoint
            window.location.href = shareData.shareUrl.replace('/shared/', '/api/shared-documents/') + '/download';
          }
        }}
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
 * Live Preview Link Component
 * Always visible - allows users to preview/share form data before generating
 */
const LivePreviewLink = ({ formData, documentType, currentUser }) => {
  const [copied, setCopied] = useState(false);

  // Generate preview URL with encoded form data + user company info
  const generatePreviewUrl = () => {
    const baseUrl = window.location.origin;

    // Merge formData with company info from authenticated user
    const dataWithCompanyInfo = {
      ...formData,
      // Add company info for preview (if user is authenticated)
      companyName: currentUser?.companyInfo?.companyName,
      companyAddress: currentUser?.companyInfo?.address,
      companyTaxNumber: currentUser?.companyInfo?.taxNumber,
      companyRepresentative: currentUser?.companyInfo?.manager || currentUser?.companyInfo?.role,
      companyManager: currentUser?.companyInfo?.manager || currentUser?.companyInfo?.role
    };

    // Debug logging
    console.log('[LivePreviewLink] Company data being encoded:', {
      companyName: dataWithCompanyInfo.companyName,
      companyAddress: dataWithCompanyInfo.companyAddress,
      companyManager: dataWithCompanyInfo.companyManager,
      hasCurrentUser: !!currentUser,
      hasCompanyInfo: !!currentUser?.companyInfo
    });

    const encodedData = btoa(encodeURIComponent(JSON.stringify(dataWithCompanyInfo)));
    return `${baseUrl}/preview/${documentType}?data=${encodedData}`;
  };

  const previewUrl = generatePreviewUrl();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(previewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = previewUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className={styles['live-preview-section']}>

      <p className={styles['preview-description']}>
        Споделете го линкот за преглед на внесените податоци.
      </p>
      <div className={styles['preview-content']}>

        <input
          type="text"
          value={previewUrl}
          readOnly
          className={styles['preview-input']}
          onClick={(e) => e.target.select()}
        />
        <button
          onClick={copyToClipboard}
          className={`${styles['copy-preview-btn']} ${copied ? styles['copied'] : ''}`}
        >
          {copied ? '✓ Копирано' : 'Копирај'}
        </button>
      </div>
    </div>
  );
};

/**
 * Shareable Link Section Component
 * Displays the shareable link with copy button after document generation
 */
const ShareableLinkSection = ({ shareUrl }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className={styles['shareable-link-section']}>
      <div className={styles['shareable-link-header']}>
        <span className={styles['link-icon']}>🔗</span>
        <h4 className={styles['link-title']}>Линк за споделување</h4>
      </div>
      <div className={styles['shareable-link-content']}>
        <input
          type="text"
          value={shareUrl}
          readOnly
          className={styles['link-input']}
          onClick={(e) => e.target.select()}
        />
        <button
          onClick={copyToClipboard}
          className={`${styles['copy-link-btn']} ${copied ? styles['copied'] : ''}`}
        >
          {copied ? '✓ Копирано' : 'Копирај'}
        </button>
      </div>
      <p className={styles['link-description']}>
        Споделете го овој линк со други лица за да можат да го прегледаат, симнат и коментираат документот.
      </p>
    </div>
  );
};

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