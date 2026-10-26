import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import TerminalShell from '../../components/terminal/TerminalShell';
import styles from './MyData.module.css';

/**
 * In-app privacy policy — the SAME text as the public /privacy-policy (website
 * i18n `privacy.*`), so there is one policy to keep correct.
 */

const SECTIONS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11'];

export default function PrivacyPolicy() {
  const { t } = useTranslation('website');
  return (
    <TerminalShell>
      <div className={styles.page}>
        <header>
          <span className={styles.eyebrow}>Приватност</span>
          <h1 className={styles.title}>{t('privacy.title')}</h1>
          <p className={styles.small}>{t('privacy.updated')}</p>
        </header>
        <section className={styles.panel}>
          {SECTIONS.map((s) => (
            <div key={s}>
              <h2 className={styles.panelHead}>{t(`privacy.${s}H`)}</h2>
              <p className={styles.lead}>{t(`privacy.${s}`)}</p>
            </div>
          ))}
        </section>
        <p className={styles.small}>
          Вашите AI податоци и дневникот на активност ги управувате на <Link to="/terminal/my-data">Мои податоци</Link>.
        </p>
      </div>
    </TerminalShell>
  );
}
