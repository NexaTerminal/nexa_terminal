import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCredit } from '../../contexts/CreditContext';
import styles from '../../styles/common/InsufficientCreditsModal.module.css';

/**
 * InsufficientCreditsModal Component
 *
 * Displays when a user attempts an action without sufficient credits.
 * Provides options to view credits page, invite friends, or wait for reset.
 *
 * Props:
 * - isOpen: boolean - Controls modal visibility
 * - onClose: function - Callback to close the modal
 * - requiredCredits: number - How many credits the action requires (default 1)
 * - actionName: string - Name of the action user tried to perform
 */
const InsufficientCreditsModal = ({
  isOpen,
  onClose,
  requiredCredits = 1,
  actionName = 'ова дејство'
}) => {
  const navigate = useNavigate();
  const { credits } = useCredit();

  if (!isOpen) return null;

  const handleViewCredits = () => {
    onClose();
    navigate('/terminal/credits');
  };

  const handleInviteFriends = () => {
    onClose();
    navigate('/terminal/invite');
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('mk-MK', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const shortage = requiredCredits - (credits?.balance || 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className={styles.backdrop}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Close Button */}
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Затвори"
        >
          ✕
        </button>

        {/* Icon */}
        <div className={styles.iconContainer}>
          <div className={styles.icon}>💳</div>
          <div className={styles.iconBg}></div>
        </div>

        {/* Title */}
        <h2 id="modal-title" className={styles.title}>
          Недоволно кредити
        </h2>

        {/* Message */}
        <div className={styles.message}>
          <p className={styles.mainText}>
            Немате доволно кредити за <strong>{actionName}</strong>.
          </p>

          <div className={styles.creditInfo}>
            <div className={styles.creditRow}>
              <span className={styles.label}>Достапни кредити:</span>
              <span className={styles.value}>{credits?.balance || 0}</span>
            </div>
            <div className={styles.creditRow}>
              <span className={styles.label}>Потребни кредити:</span>
              <span className={styles.value}>{requiredCredits}</span>
            </div>
            <div className={styles.separator}></div>
            <div className={styles.creditRow}>
              <span className={styles.label}>Недостасува:</span>
              <span className={`${styles.value} ${styles.shortage}`}>{shortage}</span>
            </div>
          </div>

          <div className={styles.resetInfo}>
            <span className={styles.resetIcon}>🔄</span>
            <span>
              Кредитите ќе се ресетираат на: {' '}
              <strong>{formatDate(credits?.nextResetDate)}</strong>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.primaryBtn}
            onClick={handleInviteFriends}
          >
            🎁 Покани пријатели за повеќе кредити
          </button>

          <button
            className={styles.secondaryBtn}
            onClick={handleViewCredits}
          >
            📊 Прегледај ги моите кредити
          </button>

          <button
            className={styles.tertiaryBtn}
            onClick={onClose}
          >
            Откажи
          </button>
        </div>

        {/* Help Text */}
        <div className={styles.helpText}>
          <p>
            Поканете 3+ пријатели и добијте <strong>+7 бонус кредити</strong> неделно!
          </p>
        </div>
      </div>
    </>
  );
};

export default InsufficientCreditsModal;
