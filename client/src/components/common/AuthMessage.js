import React from 'react';
import styles from './AuthMessage.module.css';

const AuthMessage = ({ type, message, onClose, autoHide = true }) => {
  // Auto-hide after 5 seconds if autoHide is enabled
  React.useEffect(() => {
    if (autoHide && message) {
      const timer = setTimeout(() => {
        onClose && onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [message, autoHide, onClose]);

  if (!message) return null;

  const getMessageIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '💬';
    }
  };

  const getMessageTitle = (type) => {
    switch (type) {
      case 'success': return 'Успешно!';
      case 'error': return 'Грешка';
      case 'warning': return 'Внимание';
      case 'info': return 'Информација';
      default: return '';
    }
  };

  return (
    <div className={`${styles.messageContainer} ${styles[type]}`}>
      <div className={styles.messageContent}>
        <div className={styles.messageHeader}>
          <span className={styles.messageIcon}>
            {getMessageIcon(type)}
          </span>
          <span className={styles.messageTitle}>
            {getMessageTitle(type)}
          </span>
          {onClose && (
            <button 
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Затвори порака"
            >
              ×
            </button>
          )}
        </div>
        <div className={styles.messageText}>
          {message}
        </div>
      </div>
    </div>
  );
};

export default AuthMessage;