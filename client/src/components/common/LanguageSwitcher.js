import React from 'react';
import styles from './LanguageSwitcher.module.css';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, isTerminalRoute } = useLanguage();

  // Hide language switcher on terminal routes
  if (isTerminalRoute) {
    return null;
  }

  return (
    <div className={styles['language-switcher']}>
      <button
        className={`${styles['language-button']} ${currentLanguage === 'en' ? styles.active : ''}`}
        onClick={() => changeLanguage('en')}
        title={t('common.english')}
      >
        EN
      </button>
      <button
        className={`${styles['language-button']} ${currentLanguage === 'mk' ? styles.active : ''}`}
        onClick={() => changeLanguage('mk')}
        title={t('common.macedonian')}
      >
        MK
      </button>
    </div>
  );
};

export default LanguageSwitcher;
