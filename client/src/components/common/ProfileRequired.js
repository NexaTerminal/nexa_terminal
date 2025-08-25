import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import styles from '../../styles/terminal/ProfileRequired.module.css';

const ProfileRequired = ({ children, feature = "this feature" }) => {
  const { currentUser } = useAuth();

  // If profile is complete, render the children
  if (currentUser?.profileComplete) {
    return children;
  }

  // Otherwise, show profile completion requirement
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM12 20C13.1 20 14 19.1 14 18C14 16.9 13.1 16 12 16C10.9 16 10 16.9 10 18C10 19.1 10.9 20 12 20ZM19 13H16V11H19C19.6 11 20 11.4 20 12S19.6 13 19 13ZM8 11V13H5C4.4 13 4 12.6 4 12S4.4 11 5 11H8ZM12 6C9.8 6 8 7.8 8 10V14C8 16.2 9.8 18 12 18C14.2 18 16 16.2 16 14V10C16 7.8 14.2 6 12 6Z" 
              fill="currentColor"
            />
          </svg>
        </div>
        <h2>Profile Completion Required</h2>
        <p>
          To access {feature}, please complete your business profile with your company information 
          and contact details.
        </p>
        <div className={styles.actions}>
          <Link to="/complete-profile" className={styles.primaryButton}>
            Complete Profile Now
          </Link>
          <Link to="/terminal" className={styles.secondaryButton}>
            Back to Dashboard
          </Link>
        </div>
        <div className={styles.features}>
          <h3>Unlock these features:</h3>
          <ul>
            <li>Company verification</li>
            <li>Document generation</li>
            <li>Investment opportunities</li>
            <li>Social posting</li>
            <li>Business networking</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfileRequired;
