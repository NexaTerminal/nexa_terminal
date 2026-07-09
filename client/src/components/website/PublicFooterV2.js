import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './PublicFooterV2.module.css';

const SATELLITES = [
  { href: 'https://samodaprasham.mk', key: 'samodaprasham' },
  { href: 'https://immigration.mk', key: 'immigration' },
  { href: 'https://macedoniancitizenship.mk', key: 'citizenship' },
  { href: 'https://company.nexa.mk', key: 'company' },
  { href: 'https://iplaw.nexa.mk', key: 'iplaw' },
  { href: 'https://topics.nexa.mk', key: 'topics' }
];

export default function PublicFooterV2() {
  const { t } = useTranslation('website');
  return (
    <footer className={styles.footer}>
      <div className={styles.cols}>
        <div className={styles.col}>
          <h4>{t('footer.aboutHeading')}</h4>
          <p>{t('footer.aboutText')}</p>
          <Link to="/about">{t('footer.aboutLink')} →</Link>
        </div>
        <div className={styles.col}>
          <h4>{t('footer.ecosystemHeading')}</h4>
          <ul>
            {SATELLITES.map(s => (
              <li key={s.key}>
                <a href={s.href} rel="noopener">
                  {t(`ecosystem.${s.key}.name`)}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.col}>
          <h4>{t('footer.legalHeading')}</h4>
          <ul>
            <li><Link to="/terms-conditions">{t('footer.termsLink')}</Link></li>
            <li><Link to="/privacy-policy">{t('footer.privacyLink')}</Link></li>
            <li><Link to="/about">{t('footer.aboutNexa')}</Link></li>
            <li><Link to="/smetkovoditeli">{t('footer.accountantsLink')}</Link></li>
            <li><Link to="/contact">{t('footer.contactLink')}</Link></li>
            <li>
              <a
                className={styles.mbaLink}
                href="https://mba.org.mk/index.php/mk/imenik-advokati/imenik-aktivni-advokati"
                rel="noopener"
              >{t('footer.mbaLink')}</a>
            </li>
          </ul>
        </div>
        <div className={styles.col}>
          <h4>{t('footer.contactHeading')}</h4>
          <ul>
            <li>{t('footer.entityShort')}</li>
            <li>{t('footer.city')}</li>
            <li>+389 78 534 258</li>
            <li><a href="mailto:info@nexa.mk">info@nexa.mk</a></li>
          </ul>
        </div>
      </div>
      <div className={styles.bottom}>
        <span>{t('footer.copyright')}</span>
        <span>{t('footer.poweredBy')}</span>
      </div>
    </footer>
  );
}
