import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../common/Header';
import Sidebar from '../terminal/Sidebar';
import ProfileReminderBanner from '../terminal/ProfileReminderBanner';
import DocumentPreview from '../terminal/documents/DocumentPreview';
import FormField, { TermsField } from '../forms/FormField';
import ClientSelector from './ClientSelector';
import OwnCompanyModal from './OwnCompanyModal';
import { useDocumentForm } from '../../hooks/useDocumentForm';
import { visibleTier } from '../../lib/tier';
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

  // Scroll to top on component mount (fixes mobile auto-scroll issue)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Pro-only "generate for a client" selector. Selecting a saved client sets
  // clientId (the server rebuilds the company party from it) and prefills the
  // company fields for the live preview; clearing restores the lawyer's own
  // company. Basic users never see this.
  const vt = visibleTier(currentUser);
  const isPro = vt === 'B' || vt === 'ADMIN';
  const [showOwnCompanyModal, setShowOwnCompanyModal] = useState(false);

  const applyCompanySource = (src) => {
    handleInputChange('companyName', src.companyName || '');
    handleInputChange('companyAddress', src.companyAddress || src.address || '');
    handleInputChange('companyTaxNumber', src.companyTaxNumber || src.taxNumber || '');
    handleInputChange('companyManager', src.companyManager || src.manager || src.role || '');
  };

  const onSelectClient = (clientId, client) => {
    handleInputChange('clientId', clientId || '');
    if (!clientId) {
      // "Мојата фирма" — use the user's own company. If nothing is recorded yet,
      // prompt for it once; the modal saves it to the profile and prefills.
      if (!hasOwnCompanyInfo(currentUser)) {
        setShowOwnCompanyModal(true);
        return;
      }
      applyCompanySource(currentUser?.companyInfo || {});
      return;
    }
    applyCompanySource(client || {});
  };

  const handleOwnCompanySaved = (companyInfo) => {
    setShowOwnCompanyModal(false);
    handleInputChange('clientId', '');
    applyCompanySource(companyInfo);
  };

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
    <div className={`${styles.documentPage} ${styles.focusMode}`}>
      {/* Focus mode: the top navbar stays fixed; only the left sidebar auto-hides
          and slides in on left-edge hover, so the editor takes over the screen.
          The wrapper lets us slide the shared Sidebar without touching its module. */}
      <Header isTerminal={true} />
      <div className={styles.dashboardLayout}>
        <div className={styles.chromeSide}><Sidebar /></div>
        <main className={styles.dashboardMain}>

          {/* Own-company reminder is a Basic concern; Pro uses the client selector. */}
          {!isPro && <ProfileReminderBanner currentUser={currentUser} />}

          <div className={styles.splitLayout}>
            {/* Form Section */}
            <div className={styles.formSection}>
              {/* Pro: choose the client this document is for, at the top of the form. */}
              {isPro && <ClientSelector value={formData.clientId} onSelect={onSelectClient} />}

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
                  {formData.acceptTerms && !config.disableLivePreview && (
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

              {/* Quiet inline success bar — shows after the document downloads. */}
              {shareData && shareData.shareUrl && (
                <ShareableLinkSection
                  shareUrl={shareData.shareUrl}
                  fileName={shareData.fileName}
                  expiresAt={shareData.expiresAt}
                />
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

      {/* Own-company capture: shown when a Pro user picks "Мојата фирма" but has
          no company data recorded. Saves it to the profile and prefills. */}
      <OwnCompanyModal
        isOpen={showOwnCompanyModal}
        onClose={() => setShowOwnCompanyModal(false)}
        onSaved={handleOwnCompanySaved}
      />
    </div>
  );
};

/**
 * True when the user has the required company fields on file. Mirrors the
 * fields ClientSelector/onSelectClient prefill for "Мојата фирма".
 */
const hasOwnCompanyInfo = (user) => {
  const c = user?.companyInfo || {};
  return !!(
    c.companyName &&
    (c.companyAddress || c.address) &&
    (c.companyTaxNumber || c.taxNumber) &&
    (c.companyManager || c.manager || c.role)
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

    // Company party for the preview. formData already carries the correct company
    // (a Pro user's selected client, or their own company set via ClientSelector /
    // the own-company modal), so prefer it and only fall back to the user's own
    // companyInfo for Basic users who never touch the client selector. Checking
    // both field-name variants (companyAddress vs address, etc.).
    const ci = currentUser?.companyInfo || {};
    const companyName = formData.companyName || ci.companyName || '';
    const companyAddress = formData.companyAddress || ci.companyAddress || ci.address || '';
    const companyTaxNumber = formData.companyTaxNumber || ci.companyTaxNumber || ci.taxNumber || '';
    const companyManager = formData.companyManager || ci.companyManager || ci.manager || ci.role || '';
    const dataWithCompanyInfo = {
      ...formData,
      companyName,
      companyAddress,
      companyTaxNumber,
      companyManager,
      companyRepresentative: companyManager
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
      <div className={styles['preview-link-row']}>

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
 * Quiet success bar — shown inline after the document downloads. Replaces the
 * old blocking success modal: one line with a copy-link action, a re-download
 * link and a muted expiry caption. No headings, boxes or emoji.
 */
const ShareableLinkSection = ({ shareUrl, fileName, expiresAt }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadAgain = () => {
    window.location.href = shareUrl.replace('/shared/', '/api/shared-documents/') + '/download';
  };

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString('mk-MK', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className={styles['success-bar']}>
      <span className={styles['success-check']} aria-hidden>✓</span>
      <span className={styles['success-text']}>
        Генериран{fileName ? ` · ${fileName}` : ''}
      </span>
      <div className={styles['success-actions']}>
        <button type="button" className={styles['success-link']} onClick={copyToClipboard}>
          {copied ? 'Копирано' : 'Копирај линк'}
        </button>
        <button type="button" className={styles['success-link']} onClick={downloadAgain}>
          Преземи повторно
        </button>
        {expiryLabel && <span className={styles['success-expiry']}>Важи до {expiryLabel}</span>}
      </div>
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