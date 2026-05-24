import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import styles from './PublicNavbarV2.module.css';

export default function PublicNavbarV2() {
  const { t } = useTranslation('website');
  const [open, setOpen] = useState(false);
  const lang = i18n.language || 'mk';

  const switchLang = (lng) => i18n.changeLanguage(lng);

  const links = [
    { to: '/about', label: t('nav.ecosystem') },
    { to: '/for-professionals', label: t('nav.forProfessionals') },
    { to: '/pricing', label: t('nav.pricing') },
    { to: '/blog', label: t('nav.blog') },
    { to: '/contact', label: t('nav.contact') }
  ];

  return (
    <nav className={styles.navbar} aria-label="Primary">
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} aria-label="Nexa">
          <img src="/nexa-logo-navbar.png" alt="Nexa" />
        </Link>
        <div className={styles.nav}>
          {links.map(l => (
            <Link key={l.to} to={l.to} className={styles.navLink}>{l.label}</Link>
          ))}
        </div>
        <div className={styles.right}>
          <div className={styles.langSwitch} role="group" aria-label="Language">
            <button
              type="button"
              className={`${styles.langBtn} ${lang === 'mk' ? styles.langBtnActive : ''}`}
              onClick={() => switchLang('mk')}
            >MK</button>
            <button
              type="button"
              className={`${styles.langBtn} ${lang === 'en' ? styles.langBtnActive : ''}`}
              onClick={() => switchLang('en')}
            >EN</button>
          </div>
          <Link to="/login" className={styles.loginBtn}>{t('nav.terminalLogin')}</Link>
          <button
            className={styles.hamburger}
            aria-label={t('nav.menu')}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      <div className={`${styles.mobileMenu} ${open ? styles.open : ''}`}>
        {links.map(l => (
          <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>{l.label}</Link>
        ))}
        <Link to="/login" className={styles.loginBtn} onClick={() => setOpen(false)}>{t('nav.terminalLogin')}</Link>
      </div>
    </nav>
  );
}
