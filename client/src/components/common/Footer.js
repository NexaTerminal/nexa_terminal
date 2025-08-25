import React from 'react';
import styles from './Footer.module.css';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Footer = ({ isTerminal = false }) => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3>Nexa</h3>
            <p>{t('footer.description', 'Empowering your business with modern solutions.')}</p>
          </div>
          <div className={styles.footerSection}>
            <h3>{t('footer.links', 'Links')}</h3>
            <Link to="/" className={styles.footerLink}>{t('common.home')}</Link>
            <Link to="/about" className={styles.footerLink}>{t('common.about')}</Link>
            <Link to="/login" className={styles.footerLink}>{t('common.login')}</Link>
          </div>
          <div className={styles.footerSection}>
            <h3>{t('footer.contact', 'Contact')}</h3>
            <div>Email: info@nexa.com</div>
            <div>Phone: +389 70 123 456</div>
            <div>{t('footer.address', 'Skopje, Macedonia')}</div>
          </div>
        </div>
        <div className={styles.copyright}>
          &copy; {currentYear} Nexa. {t('footer.rights', 'All rights reserved.')}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
