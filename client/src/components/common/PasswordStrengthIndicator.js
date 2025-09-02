import React from 'react';
import { validatePassword } from '../../utils/passwordValidation';
import styles from './PasswordStrengthIndicator.module.css';

const PasswordStrengthIndicator = ({ password, showRequirements = true }) => {
  if (!password) return null;

  const validation = validatePassword(password);
  const { checks, strength, errors } = validation;

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 'weak': return '#ef4444';
      case 'fair': return '#f59e0b';
      case 'good': return '#22c55e';
      case 'strong': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStrengthText = (strength) => {
    switch (strength) {
      case 'weak': return 'Слаба лозинка';
      case 'fair': return 'Просечна лозинка';
      case 'good': return 'Добра лозинка';
      case 'strong': return 'Силна лозинка';
      default: return '';
    }
  };

  return (
    <div className={styles.container}>
      {/* Strength Bar */}
      <div className={styles.strengthBar}>
        <div className={styles.strengthLabel}>
          {getStrengthText(strength)}
        </div>
        <div className={styles.strengthMeter}>
          <div 
            className={styles.strengthFill}
            style={{ 
              width: `${(Object.values(checks).filter(Boolean).length / 5) * 100}%`,
              backgroundColor: getStrengthColor(strength)
            }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className={styles.requirements}>
          <div className={`${styles.requirement} ${checks.length ? styles.met : styles.unmet}`}>
            <span className={styles.checkIcon}>
              {checks.length ? '✓' : '○'}
            </span>
            <span className={styles.requirementText}>
              Најмалку 6 карактери
            </span>
          </div>

          <div className={`${styles.requirement} ${checks.hasLowercase ? styles.met : styles.unmet}`}>
            <span className={styles.checkIcon}>
              {checks.hasLowercase ? '✓' : '○'}
            </span>
            <span className={styles.requirementText}>
              Една мала буква (a-z)
            </span>
          </div>

          <div className={`${styles.requirement} ${checks.hasUppercase ? styles.met : styles.unmet}`}>
            <span className={styles.checkIcon}>
              {checks.hasUppercase ? '✓' : '○'}
            </span>
            <span className={styles.requirementText}>
              Една голема буква (A-Z)
            </span>
          </div>

          <div className={`${styles.requirement} ${checks.hasNumber ? styles.met : styles.unmet}`}>
            <span className={styles.checkIcon}>
              {checks.hasNumber ? '✓' : '○'}
            </span>
            <span className={styles.requirementText}>
              Еден број (0-9)
            </span>
          </div>

          <div className={`${styles.requirement} ${checks.hasSpecialChar ? styles.met : styles.unmet}`}>
            <span className={styles.checkIcon}>
              {checks.hasSpecialChar ? '✓' : '○'}
            </span>
            <span className={styles.requirementText}>
              Еден специјален карактер (!@#$...)
            </span>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className={styles.errors}>
          {errors.map((error, index) => (
            <div key={index} className={styles.errorMessage}>
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;