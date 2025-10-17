import React from 'react';
import styles from '../../styles/education/Certificate.module.css';
import { honorCode } from '../../data/honorCode';

const HonorCodeModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{honorCode.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.lastUpdated}>
            Последна измена: {honorCode.lastUpdated}
          </p>

          <div className={styles.honorCodeContent}>
            {honorCode.content.map((item, index) => (
              <div key={index} className={styles.honorCodeSection}>
                <h3>{item.section}</h3>
                <ul>
                  {item.points.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}

            <div className={styles.consequencesSection}>
              <h3>{honorCode.consequences.title}</h3>
              <ul className={styles.consequencesList}>
                {honorCode.consequences.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className={styles.agreementSection}>
              <p className={styles.agreementText}>{honorCode.agreement}</p>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.closeModalButton} onClick={onClose}>
            Затвори
          </button>
        </div>
      </div>
    </div>
  );
};

export default HonorCodeModal;
