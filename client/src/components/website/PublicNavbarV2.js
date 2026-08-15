import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import { isLeadsStorefront, otherStorefrontUrl } from '../../lib/storefront';
import styles from './PublicNavbarV2.module.css';

export default function PublicNavbarV2() {
  const { t } = useTranslation('website');
  const [open, setOpen] = useState(false);
  const lang = i18n.language || 'mk';
  const isMk = lang === 'mk';
  const switchLang = (lng) => i18n.changeLanguage(lng);

  // Both storefronts are intentionally minimal: Landing (logo) · Blog · Contact.
  // Pricing/About live inside the flow (contact + login), not the marketing nav.
  const links = [
    { to: '/blog', label: t('nav.blog') },
    { to: '/contact', label: t('nav.contact') }
  ];

  // Cross-product link so the two sibling sites stay reachable from each other
  // (and the logo always returns to THIS site's home). On leads.nexa.mk it
  // points to the SMB site; on nexa.mk it points to the lawyers' site.
  const onLeads = isLeadsStorefront();
  const crossHref = otherStorefrontUrl('/');
  const crossLabel = onLeads
    ? (isMk ? 'Nexa за бизниси' : 'Nexa for business')
    : (isMk ? 'Nexa за правници' : 'Nexa for lawyers');

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
          <a href={crossHref} className={styles.crossLink}>
            {crossLabel}<span aria-hidden> ↗</span>
          </a>
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
            className={`${styles.hamburger} ${open ? styles.hamburgerOpen : ''}`}
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
        <a href={crossHref} onClick={() => setOpen(false)}>
          {crossLabel}<span aria-hidden> ↗</span>
        </a>
        <div className={styles.mobileLangSwitch} role="group" aria-label="Language">
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
        <Link to="/login" className={styles.loginBtn} onClick={() => setOpen(false)}>{t('nav.terminalLogin')}</Link>
      </div>
    </nav>
  );
}
