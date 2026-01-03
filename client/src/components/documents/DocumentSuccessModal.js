import React, { useState } from 'react';
import styles from '../../styles/terminal/documents/DocumentSuccessModal.module.css';

/**
 * Document Success Modal
 *
 * Displays after successful document generation with:
 * - Shareable link with one-click copy
 * - Link expiration information
 * - Features available to third parties
 * - Download button for immediate access
 */
const DocumentSuccessModal = ({
  isOpen,
  shareUrl,
  fileName,
  expiresAt,
  onClose,
  onDownloadAgain
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  /**
   * Copy shareable link to clipboard
   * Uses modern Clipboard API with fallback for older browsers
   */
  const copyToClipboard = async () => {
    try {
      // Modern Clipboard API (preferred)
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      // Fallback for older browsers
      try {
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
      } catch (fallbackErr) {
        console.error('Failed to copy to clipboard:', fallbackErr);
        alert('Не успеа копирањето. Обидете се рачно да го копирате линкот.');
      }
    }
  };

  /**
   * Format expiry date in Macedonian locale
   */
  const formatExpiryDate = (date) => {
    if (!date) return 'Непознато';

    const expiry = new Date(date);
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    try {
      return expiry.toLocaleDateString('mk-MK', options);
    } catch (error) {
      // Fallback if mk-MK locale not available
      return expiry.toLocaleDateString('en-US', options);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.successIcon}>✓</div>
          <h2>Документот е успешно генериран!</h2>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          <p className={styles.fileName}>
            <strong>{fileName}</strong>
          </p>

          <p className={styles.description}>
            Вашиот документ е зачуван и можете да го споделите со други лица користејќи го линкот подолу.
          </p>

          {/* Shareable Link Section */}
          <div className={styles.shareSection}>
            <label className={styles.shareLabel}>Линк за споделување:</label>
            <div className={styles.shareInputGroup}>
              <input
                type="text"
                value={shareUrl}
                readOnly
                className={styles.shareInput}
                onClick={(e) => e.target.select()}
              />
              <button
                onClick={copyToClipboard}
                className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
                aria-label={copied ? 'Копирано' : 'Копирај линк'}
              >
                {copied ? '✓ Копирано' : 'Копирај'}
              </button>
            </div>
          </div>

          {/* Expiry Info */}
          <div className={styles.expiryInfo}>
            <span className={styles.expiryIcon}>⏰</span>
            <span>
              Линкот истекува на: <strong>{formatExpiryDate(expiresAt)}</strong>
            </span>
          </div>

          {/* Features Info */}
          <div className={styles.featuresInfo}>
            <p className={styles.featuresTitle}>Другите лица можат да:</p>
            <ul className={styles.featuresList}>
              <li>📄 Прегледаат го документот</li>
              <li>⬇️ Симнат го документот</li>
              <li>✅ Потврдат го документот</li>
              <li>💬 Оставаат коментари</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.modalFooter}>
          <button
            onClick={onDownloadAgain}
            className={styles.secondaryButton}
          >
            Симни повторно
          </button>
          <button
            onClick={onClose}
            className={styles.primaryButton}
          >
            Затвори
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentSuccessModal;
