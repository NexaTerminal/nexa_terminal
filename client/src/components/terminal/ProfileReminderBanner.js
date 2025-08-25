import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/terminal/ProfileReminderBanner.module.css';

const ProfileReminderBanner = () => {
  const { currentUser } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if user's profile is already complete or banner is dismissed
  if (!currentUser || currentUser.profileComplete || isDismissed) {
    return null;
  }

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <svg className={styles.icon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM12 20C13.1 20 14 19.1 14 18C14 16.9 13.1 16 12 16C10.9 16 10 16.9 10 18C10 19.1 10.9 20 12 20ZM19 13H16V11H19C19.6 11 20 11.4 20 12S19.6 13 19 13ZM8 11V13H5C4.4 13 4 12.6 4 12S4.4 11 5 11H8Z" 
              fill="currentColor"
            />
          </svg>
        </div>
        <div className={styles.text}>
          <h4 className={styles.title}>Подобрете го вашето корисничко искуство</h4>
          <p className={styles.subtitle}>
            Пополнете го вашиот профил за да добиете пристап до сите функции и подобро искуство.
          </p>
        </div>
        <div className={styles.actions}>
          <Link to="/terminal/complete-profile" className={styles.completeButton}>
            Пополни профил
          </Link>
          <button 
            onClick={() => setIsDismissed(true)} 
            className={styles.dismissButton}
            aria-label="Затвори"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M18 6L6 18M6 6L18 18" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileReminderBanner;
