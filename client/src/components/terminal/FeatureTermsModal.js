import React, { useState, useRef, useEffect } from 'react';
import { getFeatureTerms } from '../../data/featureTerms';
import styles from '../../styles/terminal/TermsAcceptanceModal.module.css';

/**
 * Feature-specific terms acceptance modal (blog / case / topic / fair).
 *
 * Pops up before a posting/usage action when the user hasn't yet accepted the
 * current version of that feature's terms. Requires scrolling to the bottom and
 * ticking the checkbox before "Прифати и продолжи" is enabled. Reuses the shared
 * TermsAcceptanceModal styles for visual consistency.
 */
const FeatureTermsModal = ({ feature, isOpen, onAccept, onDecline }) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasCheckedBox, setHasCheckedBox] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false);
      setHasCheckedBox(false);
    }
  }, [isOpen, feature]);

  const handleScroll = () => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 12 && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  if (!isOpen) return null;

  const cfg = getFeatureTerms(feature);
  if (!cfg) return null;

  const canAccept = hasScrolledToBottom && hasCheckedBox;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2>{cfg.title}</h2>
          <p className={styles.scrollInstruction}>
            {!hasScrolledToBottom
              ? '⬇️ Ве молиме прочитајте ги целосно условите (скролајте до крај)'
              : '✅ Ги прочитавте условите'}
          </p>
        </div>

        <div className={styles.modalContent} ref={contentRef} onScroll={handleScroll}>
          <div className={styles.termsContent}>
            {cfg.sections.map((s, i) => (
              <section key={i} className={styles.section}>
                <h3>{s.heading}</h3>
                {(s.paragraphs || []).map((p, j) =>
                  s.warning && j === 0 ? (
                    <div key={j} className={styles.warningBox}><p>{p}</p></div>
                  ) : (
                    <p key={j}>{p}</p>
                  )
                )}
                {s.bullets && s.bullets.length > 0 && (
                  <ul>{s.bullets.map((b, k) => <li key={k}>{b}</li>)}</ul>
                )}
              </section>
            ))}
            <div className={styles.fullTermsLink}>
              <p>
                📄 Целосните општи услови:{' '}
                <a href="/terms-conditions" target="_blank" rel="noopener noreferrer">
                  nexa.mk/terms-conditions
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="featureTermsCheckbox"
              checked={hasCheckedBox}
              onChange={(e) => setHasCheckedBox(e.target.checked)}
              disabled={!hasScrolledToBottom}
              className={styles.checkbox}
            />
            <label htmlFor="featureTermsCheckbox" className={!hasScrolledToBottom ? styles.disabledLabel : ''}>
              Ги прочитав и ги прифаќам условите
            </label>
          </div>
          <div className={styles.buttonContainer}>
            <button onClick={onDecline} className={styles.declineButton} type="button">Откажи</button>
            <button onClick={onAccept} disabled={!canAccept} className={styles.acceptButton} type="button">
              {canAccept ? 'Прифати и продолжи' : 'Скролајте до крај и потврдете'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureTermsModal;
