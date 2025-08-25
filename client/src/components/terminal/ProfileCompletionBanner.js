import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/terminal/ProfileCompletionBanner.module.css';

const ProfileCompletionBanner = () => {
  const { currentUser } = useAuth();

  // Don't show if user's profile is already complete
  if (!currentUser || currentUser.profileComplete) {
    return null;
  }

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V9C15 9.8 14.3 10.5 13.5 10.5S12 9.8 12 9V7.5L6 8V10C6 10.8 5.3 11.5 4.5 11.5S3 10.8 3 10V8L9 7.5V9C9 10.7 10.3 12 12 12S15 10.7 15 9V7.5L21 7V9Z" 
              fill="currentColor"
            />
          </svg>
        </div>
        <div className={styles.text}>
          <h3>Complete Your Profile</h3>
          <p>
            To unlock all features and start using the platform fully, please complete your profile 
            with your business information.
          </p>
        </div>
        <div className={styles.actions}>
          <Link to="/complete-profile" className={styles.primaryButton}>
            Complete Profile
          </Link>
          <button className={styles.dismissButton} onClick={() => {
            // You can add dismiss functionality here if needed
            // For now, we'll keep it simple
          }}>
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionBanner;
