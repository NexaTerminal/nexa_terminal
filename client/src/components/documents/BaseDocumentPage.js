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
import useTermsGate from '../../hooks/useTermsGate';
import FeatureTermsModal from '../terminal/FeatureTermsModal';
import ProRequestsApiService from '../../services/proRequestsApi';
import { CURRENT_VERSIONS } from '../../data/featureTerms';
import { useChatDock } from '../../contexts/ChatDockContext';
import { getAgent, agentForCategory } from '../../config/aiAgents';
import styles from '../../styles/terminal/documents/DocumentGeneration.module.css';

// Build the shareable preview URL (encodes form data + resolved company party).
// Shared by the inline LivePreviewLink and the post-terms actions modal.
const buildPreviewUrl = (formData, documentType, currentUser) => {
  const baseUrl = window.location.origin;
  const ci = currentUser?.companyInfo || {};
  const companyName = formData.companyName || ci.companyName || '';
  const companyAddress = formData.companyAddress || ci.companyAddress || ci.address || '';
  const companyTaxNumber = formData.companyTaxNumber || ci.companyTaxNumber || ci.taxNumber || '';
  const companyManager = formData.companyManager || ci.companyManager || ci.manager || ci.role || '';
  const dataWithCompanyInfo = {
    ...formData,
    companyName, companyAddress, companyTaxNumber, companyManager,
    companyRepresentative: companyManager,
  };
  const encodedData = btoa(encodeURIComponent(JSON.stringify(dataWithCompanyInfo)));
  return `${baseUrl}/preview/${documentType}?data=${encodedData}`;
};

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

  // ── Post-terms actions (Генерирај / AI проверка / Проверка со професионалец) ──
  const { openChat } = useChatDock();
  const { requireTerms, termsModal } = useTermsGate();
  const [actionsProNotice, setActionsProNotice] = useState(null);

  // Route to the agent that fits this document's category (route segment).
  const docCategory = (() => {
    const parts = (window.location.pathname || '').split('/').filter(Boolean);
    const i = parts.indexOf('documents');
    return i >= 0 && parts[i + 1] ? parts[i + 1] : '';
  })();
  const actionsAgent = getAgent(agentForCategory(docCategory));
  const docDisplayName = title && title !== 'Генерирање на документ' ? title : 'документот';

  const handleCheckAI = () => {
    openChat?.(actionsAgent.key, {
      seed: `Подготвувам „${docDisplayName}". Што треба да внимавам и кои се типичните ризици или грешки кај ваков документ?`,
      context: { kind: 'документ', label: docDisplayName, data: { category: docCategory, ...formData } },
    });
  };
  const handleCheckPro = () => {
    requireTerms('proRequest', async () => {
      setActionsProNotice(null);
      try {
        const res = await ProRequestsApiService.create({
          type: 'contract_review',
          subject: `Преглед: ${docDisplayName}`,
          context: {
            documentRef: buildPreviewUrl(formData, config.documentType, currentUser),
            documentName: docDisplayName,
          },
          consentVersion: CURRENT_VERSIONS.proRequest,
        });
        setActionsProNotice(res.success
          ? 'Испратено за преглед — следете го во „Моите барања".'
          : (res.message || 'Грешка при испраќање.'));
      } catch (e) { setActionsProNotice(e.message || 'Грешка при испраќање.'); }
    });
  };

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

                  {/* Actions are always available on the last step. */}
                  <div className={styles['inline-actions']}>
                    <button type="button" className={`${styles['inline-action-btn']} ${styles['inline-action-primary']}`} onClick={handleSubmit} disabled={isGenerating}>
                      {isGenerating ? 'Се генерира…' : 'Генерирај'}
                    </button>
                    <button type="button" className={styles['inline-action-btn']} onClick={handleCheckAI} disabled={isGenerating}>
                      AI проверка
                    </button>
                    <button type="button" className={styles['inline-action-btn']} onClick={handleCheckPro} disabled={isGenerating}>
                      Проверка со професионалец
                    </button>
                  </div>
                  {actionsProNotice && <div className={styles.actionsNotice}>{actionsProNotice}</div>}

                  {/* Share link appears once the terms are accepted. */}
                  {formData.acceptTerms && !config.disableLivePreview && (
                    <LivePreviewLink formData={formData} documentType={config.documentType} currentUser={currentUser} />
                  )}
                </>
              )}

              {/* Form Actions (step navigation; generate lives in the modal / buttons) */}
              <FormActions
                isFirstStep={isFirstStep}
                isLastStep={isLastStep}
                isGenerating={isGenerating}
                onPrevStep={prevStep}
                onNextStep={nextStep}
                onSubmit={handleSubmit}
                hideSubmit
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

      {/* Pro-review consent gate (triggered by „Проверка со професионалец") */}
      {termsModal && <FeatureTermsModal {...termsModal} />}
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
  onSubmit,
  hideSubmit = false,
}) => {
  // On the last step the generate action lives in the post-terms modal / inline
  // action buttons, so FormActions only carries step navigation there.
  if (isLastStep && hideSubmit) {
    if (isFirstStep) return null;
    return (
      <div className={styles['form-actions']}>
        <div className={styles['navigation-buttons']}>
          <button type="button" onClick={onPrevStep} className={`${styles.btn} ${styles['prev-btn']}`} disabled={isGenerating}>
            ← Назад
          </button>
        </div>
      </div>
    );
  }
  return (
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
};

/**
 * Quiet success bar — shown inline after the document downloads. Replaces the
 * old blocking success modal: one line with a copy-link action, a re-download
 * link and a muted expiry caption. No headings, boxes or emoji.
 */
const ShareableLinkSection = ({ shareUrl, fileName, expiresAt }) => {
  const [copied, setCopied] = useState(false);
  const { requireTerms, termsModal } = useTermsGate();
  const { openChat } = useChatDock();
  const [reviewNotice, setReviewNotice] = useState(null);

  // Route to the agent that fits this document's category (the kebab segment in
  // /terminal/documents/<category>/<doc>). Opt-in — the user clicks if they want.
  const category = (() => {
    const parts = (window.location.pathname || '').split('/').filter(Boolean);
    const i = parts.indexOf('documents');
    return i >= 0 && parts[i + 1] ? parts[i + 1] : '';
  })();
  const reviewAgent = getAgent(agentForCategory(category));
  const docLabel = fileName || 'документот';

  // „Прегледај со [agent]" — hand the just-generated document to the AI agent.
  const askAgentReview = () => {
    openChat?.(reviewAgent.key, {
      seed: `Штотуку генерирав „${docLabel}". Што треба да проверам кај ваков документ и кои се типичните ризици или грешки што да ги избегнам?`,
      context: { kind: 'документ', label: docLabel, data: { category } },
    });
  };

  // „Побарај преглед" — hand the generated document to a Pro for review.
  const requestProReview = () => {
    requireTerms('proRequest', async () => {
      setReviewNotice(null);
      try {
        const res = await ProRequestsApiService.create({
          type: 'contract_review',
          subject: fileName ? `Преглед: ${fileName}` : 'Преглед на документ',
          context: { documentRef: shareUrl, documentName: fileName || null },
          consentVersion: CURRENT_VERSIONS.proRequest,
        });
        setReviewNotice(res.success
          ? 'Испратено за преглед — следете го во „Моите барања".'
          : (res.message || 'Грешка при испраќање.'));
      } catch (e) { setReviewNotice(e.message || 'Грешка при испраќање.'); }
    });
  };

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

      {/* Opt-in review — AI agent or a human Pro. Both optional. */}
      <div className={styles['review-cta']}>
        <span className={styles['review-cta-label']}>Сакате втор пар очи?</span>
        <button type="button" className={styles['review-btn']} onClick={askAgentReview}>
          Прегледај со {reviewAgent.name}
        </button>
        <button type="button" className={styles['review-btn-ghost']} onClick={requestProReview}>
          Побарај преглед од професионалец
        </button>
      </div>

      {reviewNotice && <div className={styles['success-review-notice']}>{reviewNotice}</div>}
      {termsModal && <FeatureTermsModal {...termsModal} />}
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

/**
 * Live Preview Link — shareable link to a read-only preview of the entered data.
 * Shown under the action buttons once the user accepts the terms.
 */
const LivePreviewLink = ({ formData, documentType, currentUser }) => {
  const [copied, setCopied] = useState(false);
  const previewUrl = buildPreviewUrl(formData, documentType, currentUser);

  const copyToClipboard = async () => {
    try { await navigator.clipboard.writeText(previewUrl); }
    catch (_) { /* clipboard may be blocked; the field is selectable */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
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