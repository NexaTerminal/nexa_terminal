import React, { useState } from 'react';
import styles from '../../styles/admin/SuspendUserModal.module.css';

const SuspendUserModal = ({ isOpen, onClose, user, onSuspend }) => {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const predefinedReasons = [
    'Terms of Service violation',
    'Spam or inappropriate content',
    'Suspected fraudulent activity',
    'Multiple failed login attempts',
    'Inappropriate use of AI features',
    'Document generation misuse',
    'Community guidelines violation',
    'Security concerns',
    'Other (specify below)'
  ];

  const durationOptions = [
    { label: '1 day', value: 1 },
    { label: '3 days', value: 3 },
    { label: '7 days', value: 7 },
    { label: '14 days', value: 14 },
    { label: '30 days', value: 30 },
    { label: '90 days', value: 90 },
    { label: 'Permanent', value: 0 }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason || (reason === 'Other (specify below)' && !customReason.trim())) {
      return;
    }

    setLoading(true);

    try {
      const suspensionData = {
        reason: reason === 'Other (specify below)' ? customReason : reason,
        duration: parseInt(duration) || 0
      };

      await onSuspend(user._id, suspensionData);
      handleClose();
    } catch (error) {
      console.error('Suspension failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setDuration('');
    setCustomReason('');
    setLoading(false);
    onClose();
  };

  const formatUserName = () => {
    return user.companyInfo?.companyName || user.username || user.email;
  };

  const getDurationText = () => {
    if (!duration) return '';
    const numDuration = parseInt(duration);
    if (numDuration === 0) return 'permanently';
    return `for ${numDuration} day${numDuration > 1 ? 's' : ''}`;
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <div className={styles.warningIcon}>⚠️</div>
            <div>
              <h2>Suspend User</h2>
              <p>You are about to suspend the following user:</p>
            </div>
          </div>
          <button onClick={handleClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {formatUserName().charAt(0).toUpperCase()}
          </div>
          <div className={styles.userDetails}>
            <div className={styles.userName}>{formatUserName()}</div>
            <div className={styles.userEmail}>{user.email}</div>
            <div className={styles.userStats}>
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.required}>Reason for Suspension</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className={styles.select}
            >
              <option value="">Select a reason...</option>
              {predefinedReasons.map((reasonOption) => (
                <option key={reasonOption} value={reasonOption}>
                  {reasonOption}
                </option>
              ))}
            </select>
          </div>

          {reason === 'Other (specify below)' && (
            <div className={styles.formGroup}>
              <label className={styles.required}>Custom Reason</label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please specify the reason for suspension..."
                required
                className={styles.textarea}
                rows="3"
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.required}>Suspension Duration</label>
            <div className={styles.durationGrid}>
              {durationOptions.map((option) => (
                <label key={option.value} className={styles.radioOption}>
                  <input
                    type="radio"
                    name="duration"
                    value={option.value}
                    checked={duration === option.value.toString()}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                  />
                  <span className={styles.radioLabel}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {duration && (
            <div className={styles.confirmationBox}>
              <div className={styles.confirmationIcon}>🚫</div>
              <div>
                <p><strong>Suspension Summary:</strong></p>
                <p>
                  <strong>{formatUserName()}</strong> will be suspended {getDurationText()} 
                  {reason && ` for: ${reason === 'Other (specify below)' ? customReason : reason}`}
                </p>
                {duration !== '0' && (
                  <p className={styles.resumeDate}>
                    Access will be restored on: {' '}
                    <strong>
                      {new Date(Date.now() + (parseInt(duration) * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                    </strong>
                  </p>
                )}
                {duration === '0' && (
                  <p className={styles.permanentWarning}>
                    <strong>Permanent suspension requires manual restoration by an administrator.</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className={styles.effects}>
            <h4>Effects of Suspension:</h4>
            <ul>
              <li>User will be immediately logged out of all sessions</li>
              <li>Login attempts will be blocked</li>
              <li>All API access will be restricted</li>
              <li>User will receive a suspension notice via email</li>
              <li>Activity will be logged for audit purposes</li>
            </ul>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason || !duration || (reason === 'Other (specify below)' && !customReason.trim())}
              className={styles.suspendButton}
            >
              {loading ? (
                <>
                  <div className={styles.spinner}></div>
                  Suspending...
                </>
              ) : (
                <>
                  🚫 Confirm Suspension
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuspendUserModal;