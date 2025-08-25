import React from 'react';
import styles from '../../../styles/terminal/documents/DocumentGeneration.module.css';

const DocumentStepProgress = ({ steps, currentStep, onStepClick }) => {
  const calculateProgress = () => {
    return (currentStep / steps.length) * 100;
  };

  return (
    <div className={styles['progress-container']}>
      <div className={styles['progress-bar']}>
        <div 
          className={styles['progress-fill']} 
          style={{ width: `${calculateProgress()}%` }}
        ></div>
        <div className={styles['progress-label']}>
          {Math.round(calculateProgress())}% завршено
        </div>
      </div>
      
      <div className={styles['steps-container']}>
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`${styles['step-item']} ${
              step.id === currentStep ? styles.active : ''
            } ${step.id < currentStep ? styles.completed : ''}`}
            onClick={() => onStepClick && onStepClick(step.id)}
          >
            <div className={styles['step-number']}>
              {step.id < currentStep ? '✓' : step.id}
            </div>
            <div className={styles['step-content']}>
              <div className={styles['step-title']}>{step.title}</div>
              <div className={styles['step-description']}>{step.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentStepProgress;
