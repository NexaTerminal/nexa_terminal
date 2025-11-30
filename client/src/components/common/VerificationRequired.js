import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import styles from '../../styles/VerificationRequired.module.css';

// ============================================
// UPDATED: Email verification disabled (2025-11-29)
// ============================================
// Now checks only company data completeness, not email verification
// Access granted once all required company fields are filled

const VerificationRequired = ({ children, feature = "оваа функција" }) => {
  const { currentUser } = useAuth();

  // Validate that all required company information is present
  const isCompanyInfoComplete = () => {
    if (!currentUser) return false;
    const requiredFields = [
      currentUser.companyInfo?.companyName,
      currentUser.companyInfo?.companyAddress || currentUser.companyInfo?.address,
      currentUser.companyInfo?.companyTaxNumber || currentUser.companyInfo?.taxNumber,
      currentUser.companyInfo?.companyManager || currentUser.companyManager,
      currentUser.officialEmail
    ];
    return requiredFields.every(field => field && field.trim());
  };

  // Check only if company info is complete (removed isVerified check)
  if (!isCompanyInfoComplete()) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.icon}>📋</div>
          <h2>Комплетирајте го профилот на компанијата</h2>
          <p>
            За да можете да користите <strong>{feature}</strong>, треба прво да ги
            пополните сите задолжителни податоци за компанијата.
          </p>

          <div className={styles.steps}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>✓</span>
              <span>Пополнете ги сите задолжителни полиња (име на компанија, адреса, даночен број, менаџер и email)</span>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>✓</span>
              <span>Кликнете на "Верификувај профил" за да добиете пристап до сите функции</span>
            </div>
          </div>

          {/* ============================================ */}
          {/* EMAIL VERIFICATION UI REMOVED (2025-11-29)   */}
          {/* ============================================ */}
          {/* Email verification steps and reminders removed */}
          {/* Access now granted immediately after completing company data */}

          {/* REMOVED: Email verification reminder
          {currentUser?.profileComplete && (
            <div className={styles.emailReminder}>
              <p>📧 Верификациониот email е пратен на:</p>
              <p className={styles.email}>{currentUser?.officialEmail}</p>
              <p>Проверете го вашиот inbox (и spam папката) и кликнете на линкот.</p>
            </div>
          )}
          */}

          <div className={styles.actions}>
            <Link to="/terminal/verification" className={styles.primaryButton}>
              Комплетирајте профил
            </Link>

            <Link to="/terminal" className={styles.backButton}>
              Назад на Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If verified, render the protected content
  return <>{children}</>;
};

export default VerificationRequired;