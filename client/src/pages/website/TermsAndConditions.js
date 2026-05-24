import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import { NEXA_ORG, NEXA_WEBSITE, webPage } from '../../components/seo/schemaGraph';
import styles from './LegalPage.module.css';

const SECTIONS = ['s1','s2','s3','s4','s5','s6','s7','s8','s9','s10'];

export default function TermsAndConditions() {
  const { t } = useTranslation('website');
  const lang = i18n.language || 'mk';
  const url = 'https://nexa.mk/terms-conditions';
  return (
    <PublicLayout>
      <SEOHelmet
        title={t('terms.seoTitle')}
        description={t('terms.seoTitle')}
        canonical="/terms-conditions"
        locale={lang === 'mk' ? 'mk_MK' : 'en_US'}
        altLocale={lang === 'mk' ? 'en_US' : 'mk_MK'}
        jsonLd={[NEXA_ORG, NEXA_WEBSITE, webPage({ url, name: t('terms.title'), description: t('terms.seoTitle'), language: lang })]}
      />
      <article className={styles.page}>
        <div className="nexa-container">
          <h1>{t('terms.title')}</h1>
          <p className={styles.updated}>{t('terms.updated')}</p>
          {SECTIONS.map(s => (
            <section key={s}>
              <h2>{t(`terms.${s}H`)}</h2>
              <p>{t(`terms.${s}`)}</p>
            </section>
          ))}
        </div>
      </article>
    </PublicLayout>
  );
}
