import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import styles from '../../styles/VerificationRequired.module.css';

const VerificationRequired = ({ children, feature = "оваа функција" }) => {
  const { currentUser } = useAuth();

  // Check if user is verified
  if (!currentUser?.isVerified) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.icon}>🔒</div>
          <h2>Верификација потребна</h2>
          <p>
            За да можете да користите <strong>{feature}</strong>, треба прво да ја 
            верификувате вашата компанија.
          </p>
          
          {!currentUser?.profileComplete ? (
            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNumber}>1</span>
                <span>Комплетирајте го профилот на компанијата</span>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNumber}>2</span>
                <span>Потврдете го верификациониот email</span>
              </div>
            </div>
          ) : (
            <div className={styles.emailReminder}>
              <p>📧 Верификациониот email е пратен на:</p>
              <p className={styles.email}>{currentUser?.officialEmail}</p>
              <p>Проверете го вашиот inbox (и spam папката) и кликнете на линкот.</p>
            </div>
          )}
          
          <div className={styles.actions}>
            {!currentUser?.profileComplete ? (
              <Link to="/terminal/verification" className={styles.primaryButton}>
                Верификувај компанија
              </Link>
            ) : (
              <Link to="/terminal/verification" className={styles.secondaryButton}>
                Повторно испрати email
              </Link>
            )}
            
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