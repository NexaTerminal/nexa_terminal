import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PublicLayout from '../../components/website/PublicLayout';
import FormField from '../../components/forms/FormField';
import { AuthContext } from '../../contexts/AuthContext';
import { PublicModeContext } from '../../contexts/PublicModeContext';
import { getShareableConfig, fieldsForStep } from '../../config/documents/shareableDocuments';
import { getPackRenderer } from '../../config/documents/publicPackRenderers';
import { getPublicDocMeta, generatePublicDoc } from '../../services/publicDocumentApi';
import styles from '../../styles/terminal/documents/DocumentGeneration.module.css';

// Stub auth value so step components that call useAuth() don't throw outside the
// AuthProvider. Public visitors have no account; the company party comes from the
// owner server-side.
const STUB_AUTH = { currentUser: null, isAuthenticated: false, loading: false };

/**
 * Public document intake page (/dokument/:token).
 *
 * A stranger opens a Pro user's share link, fills the form and generates the .docx.
 * No login; the owner's credits are charged server-side. Reuses the exact same form
 * UI as the authenticated app — generic field renderer for config-driven documents,
 * and the pack pages' own step renderers for the central-register packs.
 */
const PublicDocumentPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [meta, setMeta] = useState(null);
  const [config, setConfig] = useState(null);
  const [pack, setPack] = useState(null); // { renderStepContent, renderPreview } | null
  const [locked, setLocked] = useState([]); // field names the owner fixed
  const [formData, setFormData] = useState({});
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPublicDocMeta(token)
      .then((m) => {
        if (cancelled) return;
        const cfg = getShareableConfig(m.apiEndpoint);
        if (!cfg) { setError('Овој документ не е достапен за споделување.'); setStatus('error'); return; }
        setMeta(m);
        setConfig(cfg);
        setPack(getPackRenderer(m.apiEndpoint));
        setLocked(Array.isArray(m.locked) ? m.locked : []);
        setFormData({ ...(cfg.initialFormData || {}), ...(m.prefill || {}) });
        setStatus('ready');
      })
      .catch((e) => { if (!cancelled) { setError(e.message || 'Невалиден линк.'); setStatus('error'); } });
    return () => { cancelled = true; };
  }, [token]);

  const handleInputChange = (name, value) => setFormData((prev) => ({ ...prev, [name]: value }));

  const steps = (config && config.steps) || [];
  const totalSteps = steps.length || 1;
  const isLast = step >= totalSteps;
  const currentStep = steps.find((s) => s.id === step) || steps[step - 1];

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const fileName = (config.fileName) || meta.documentType || 'dokument';
      await generatePublicDoc(token, formData, fileName);
      setDone(true);
    } catch (e) {
      setError(e.message || 'Грешка при генерирање.');
    } finally {
      setGenerating(false);
    }
  };

  const renderBody = () => {
    if (pack) {
      // Reuse the pack page's bespoke step UI (+ its right panel, which for some packs
      // holds functional inputs). Both are stacked in the single public column.
      return (
        <>
          {pack.renderStepContent({ currentStep: step, formData, handleInputChange, errors: {}, isGenerating: generating })}
          {pack.renderPreview && (
            <div className={styles['form-section']}>
              {pack.renderPreview({ formData, currentStep: step, onChange: handleInputChange })}
            </div>
          )}
        </>
      );
    }
    // Generic config-driven renderer.
    if (!currentStep) return null;
    return (
      <div className={styles['form-section']}>
        <h3>{currentStep.title}</h3>
        {currentStep.description && <p>{currentStep.description}</p>}
        {fieldsForStep(config, currentStep).map((field) => (
          <FormField
            key={field.name}
            field={field}
            value={formData[field.name]}
            onChange={handleInputChange}
            formData={formData}
            disabled={generating || locked.includes(field.name)}
          />
        ))}
      </div>
    );
  };

  return (
    <PublicLayout>
      <AuthContext.Provider value={STUB_AUTH}>
        <PublicModeContext.Provider value={true}>
          <div className={styles['document-generation-container']}>
            <div className={styles['form-container']}>
              {status === 'loading' && <p>⏳ Се вчитува…</p>}

              {status === 'error' && (
                <div className={styles['form-section']}>
                  <h3>Линкот не е достапен</h3>
                  <p className={styles['error-message']}>{error}</p>
                  <p>Побарајте нов линк од лицето што ви го испрати.</p>
                </div>
              )}

              {status === 'ready' && config && (
                <>
                  <div className={styles['form-section']}>
                    <h2>{config.title || meta.documentType}</h2>
                    {meta.ownerName
                      ? <p>Овој документ ви е споделен од <strong>{meta.ownerName}</strong> преку Nexa. Пополнете ги полињата и преземете го документот.</p>
                      : <p>Пополнете ги полињата и преземете го документот. Подготвено преку Nexa.</p>}
                  </div>

                  {done ? (
                    <div className={styles['form-section']}>
                      <h3>✅ Документот е преземен</h3>
                      <p>Проверете ја папката „Преземања" (Downloads). Можете да го генерирате повторно ако е потребно.</p>
                      <button type="button" className={`${styles.btn} ${styles['next-btn']}`} onClick={() => setDone(false)}>
                        Назад кон формата
                      </button>
                      <SignupCta />
                    </div>
                  ) : (
                    <>
                      {renderBody()}

                      {error && <p className={styles['error-message']}>{error}</p>}

                      <div className={styles['form-actions']}>
                        <div className={styles['navigation-buttons']}>
                          {step > 1 && (
                            <button type="button" className={`${styles.btn} ${styles['prev-btn']}`} disabled={generating} onClick={() => setStep((s) => s - 1)}>
                              ← Назад
                            </button>
                          )}
                          {!isLast && (
                            <button type="button" className={`${styles.btn} ${styles['next-btn']}`} disabled={generating} onClick={() => setStep((s) => s + 1)}>
                              Следно →
                            </button>
                          )}
                          {isLast && (
                            <button type="button" className={`${styles.btn} ${styles['next-btn']}`} disabled={generating} onClick={handleGenerate}>
                              {generating ? 'Се генерира…' : 'Генерирај документ'}
                            </button>
                          )}
                        </div>
                      </div>

                      <SignupCta />
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </PublicModeContext.Provider>
      </AuthContext.Provider>
    </PublicLayout>
  );
};

const SignupCta = () => (
  <div className={styles['info-box']}>
    <p><strong>Сакате сами да генерирате вакви документи?</strong></p>
    <p>Направете бесплатна сметка на Nexa и автоматизирајте ги вашите деловни документи.</p>
    <Link to="/login?src=doc-share" className={`${styles.btn} ${styles['next-btn']}`}>Започни со Nexa</Link>
  </div>
);

export default PublicDocumentPage;
