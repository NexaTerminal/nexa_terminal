import React from 'react';
import styles from '../../styles/common/PublicFooter.module.css';

export default function PublicFooter() {
  return (
    <footer className={styles.minimalFooter}>
      <div className={styles.footerContent}>
        <span className={styles.footerText}>© 2025 Nexa Terminal. Сите права задржани.</span>
        <div className={styles.footerLinks}>
          <a href="mailto:info@nexa.mk" className={styles.footerLink}>info@nexa.mk</a>
        </div>
      </div>
    </footer>
  );
}
