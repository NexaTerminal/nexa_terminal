import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import Icon from '../../components/website/Icon';
import useScrollReveal from '../../hooks/useScrollReveal';
import { NEXA_ORG, NEXA_WEBSITE, webPage } from '../../components/seo/schemaGraph';
import styles from './Home.module.css';

// nexa.mk — Product A (SMB) landing. Kept intentionally lean: hero, what the
// Terminal does, one CTA. Provider/leads content lives on leads.nexa.mk.
export default function Home() {
  const { t } = useTranslation('website');
  useScrollReveal();
  const lang = i18n.language || 'mk';
  const isMk = lang === 'mk';
  const url = 'https://nexa.mk/';

  const TERMINAL_FEATURES = [
    { key: 'feature1', icon: 'documents' },
    { key: 'feature2', icon: 'ai' },
    { key: 'feature3', icon: 'shield' },
    { key: 'feature4', icon: 'network' },
    { key: 'feature5', icon: 'trending' },
    { key: 'feature6', icon: 'layers' }
  ];

  return (
    <PublicLayout>
      <SEOHelmet
        title={t('home.seoTitle')}
        description={t('home.seoDesc')}
        canonical="/"
        locale={isMk ? 'mk_MK' : 'en_US'}
        altLocale={isMk ? 'en_US' : 'mk_MK'}
        jsonLd={[NEXA_ORG, NEXA_WEBSITE, webPage({ url, name: 'Nexa', description: t('home.seoDesc'), language: lang })]}
      />

      {/* ============ HERO ============ */}
      <section className={`${styles.hero} nx-hero-aurora`}>
        <span className="nx-orb nx-orb-1" aria-hidden></span>
        <span className="nx-orb nx-orb-2" aria-hidden></span>

        <div className={`nexa-container ${styles.heroInner}`}>
          <span className={`nx-pill ${styles.heroPill} nx-fade-in-up`}>
            <Icon name="globe" size={14} />
            {isMk ? 'Правни алатки за мали и средни бизниси во Македонија' : 'Legal tools for small and medium businesses in Macedonia'}
          </span>
          <h1 className="nx-fade-in-up nx-d-100">{t('home.heroTitle')}</h1>
          <p className={`${styles.heroSub} nx-fade-in-up nx-d-200`}>{t('home.heroSubtitle')}</p>
          <div className={`${styles.heroCtas} nx-fade-in-up nx-d-300`}>
            <Link to="/proverka" className="nexa-btn nexa-btn-accent nexa-btn-lg">
              {isMk ? 'Проверете ја вашата усогласеност' : 'Check your compliance'}
              <Icon name="arrowRight" size={18} />
            </Link>
            <Link to="/contact" className="nexa-btn nexa-btn-secondary nexa-btn-lg">
              {isMk ? 'Контактирајте нé' : 'Contact us'}
            </Link>
          </div>
        </div>
      </section>

      {/* ============ WHAT THE TERMINAL DOES ============ */}
      <section className="nx-section">
        <div className="nexa-container">
          <div className={`${styles.chapterMarker} ${styles.chapterMarkerCentered} nx-reveal`}>
            <h2 className={styles.chapterTitle}>{t('home.terminalHeading')}</h2>
            <p className={styles.chapterLead}>{t('home.terminalLead')}</p>
          </div>
          <div className={styles.featureGrid}>
            {TERMINAL_FEATURES.map((f, i) => (
              <div
                key={f.key}
                className={`${styles.feature} nx-card nx-card-hover nx-reveal`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <span className="nx-icon-wrap"><Icon name={f.icon} /></span>
                <h3>{t(`home.${f.key}Title`)}</h3>
                <p>{t(`home.${f.key}Desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className={`${styles.ctaFinal} nx-section-ink`}>
        <div className="nexa-container">
          <div className={`${styles.finalGrid} nx-reveal`}>
            <div className={styles.finalContent}>
              <h2 className={styles.finalTitle}>
                {isMk ? 'Автоматизирајте го Вашето работење' : 'Automate your operations'}
              </h2>
              <ul className={styles.finalFeatures}>
                {[
                  isMk ? 'Автоматизирани документи'  : 'Automated documents',
                  isMk ? 'Проверки за усогласеност'  : 'Compliance health checks',
                  isMk ? 'AI правен помошник'        : 'AI legal assistant',
                  isMk ? 'Анализа на договор'        : 'Contract analysis',
                  isMk ? 'Курсеви и едукација'       : 'Courses & education'
                ].map(f => (
                  <li key={f}>
                    <span className={styles.finalFeatureDot} aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <div className={styles.ctaButtons}>
                <Link to="/proverka" className="nexa-btn nexa-btn-accent nexa-btn-lg">
                  {isMk ? 'Започнете со бесплатна проверка' : 'Start with a free check'}
                  <Icon name="arrowRight" size={18} />
                </Link>
                <Link to="/contact" className="nexa-btn nexa-btn-glass nexa-btn-lg">
                  {isMk ? 'Контактирајте нé' : 'Contact us'}
                </Link>
              </div>
            </div>

            <div className={styles.finalVisual} aria-hidden>
              <div className={styles.finalMockStack}>
                <div className={`${styles.finalMockCard} ${styles.finalMockCard1}`}>
                  <span className={`${styles.finalMockIcon} ${styles.finalMockIconBlue}`}>
                    <Icon name="documents" size={18} />
                  </span>
                  <div>
                    <div className={styles.finalMockTitle}>
                      {isMk ? 'Договор за вработување' : 'Employment agreement'}
                    </div>
                    <div className={styles.finalMockMeta}>
                      {isMk ? 'Генериран за 30 сек' : 'Generated in 30s'}
                    </div>
                  </div>
                  <span className={styles.finalMockBadge}>DOCX</span>
                </div>

                <div className={`${styles.finalMockCard} ${styles.finalMockCard2}`}>
                  <span className={`${styles.finalMockIcon} ${styles.finalMockIconAmber}`}>
                    <Icon name="shield" size={18} />
                  </span>
                  <div>
                    <div className={styles.finalMockTitle}>
                      {isMk ? 'Правна проверка' : 'Legal screening'}
                    </div>
                    <div className={styles.finalMockMeta}>
                      {isMk ? '8 / 12 прашања' : '8 / 12 questions'}
                    </div>
                  </div>
                  <span className={styles.finalMockProgress}>
                    <span className={styles.finalMockProgressFill} style={{ width: '66%' }} />
                  </span>
                </div>

                <div className={`${styles.finalMockCard} ${styles.finalMockCard3}`}>
                  <span className={`${styles.finalMockIcon} ${styles.finalMockIconTeal}`}>
                    <Icon name="ai" size={18} />
                  </span>
                  <div>
                    <div className={styles.finalMockTitle}>
                      {isMk ? 'AI одговор' : 'AI answer'}
                    </div>
                    <div className={styles.finalMockMeta}>
                      {isMk ? 'Прашање за ДДВ · готов' : 'VAT question · ready'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
