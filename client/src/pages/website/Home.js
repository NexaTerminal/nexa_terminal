import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import Icon from '../../components/website/Icon';
import PlansSection from '../../components/website/PlansSection';
import useScrollReveal from '../../hooks/useScrollReveal';
import { NEXA_ORG, NEXA_WEBSITE, webPage } from '../../components/seo/schemaGraph';
import styles from './Home.module.css';

// nexa.mk — Product A (SMB) landing. Kept intentionally lean: hero, what the
// Terminal does, one CTA. Provider/leads content lives on leads.nexa.mk.
export default function Home() {
  const { t } = useTranslation('website');
  useScrollReveal();
  const { hash } = useLocation();
  // /#paketi (and the old /pricing redirect) scrolls to the plans section.
  useEffect(() => {
    if (!hash) return;
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 80);
    return () => clearTimeout(t);
  }, [hash]);
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

  // Mirrors scripts/seo-prerender.mjs so crawlers see the same data with or without JS.
  const softwareApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Nexa Terminal',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://nexa.mk',
    inLanguage: ['mk', 'en'],
    description: t('home.terminalLead'),
    publisher: { '@id': 'https://nexa.mk/#organization' },
    offers: { '@type': 'Offer', name: isMk ? 'Основен' : 'Basic', price: '0', priceCurrency: 'EUR', category: 'free' },
    featureList: TERMINAL_FEATURES.map(f => t(`home.${f.key}Title`)),
  };

  return (
    <PublicLayout>
      <SEOHelmet
        title={t('home.seoTitle')}
        description={t('home.seoDesc')}
        canonical="/"
        locale={isMk ? 'mk_MK' : 'en_US'}
        altLocale={isMk ? 'en_US' : 'mk_MK'}
        jsonLd={[NEXA_ORG, NEXA_WEBSITE, webPage({ url, name: 'Nexa', description: t('home.seoDesc'), language: lang }), softwareApp]}
      />

      {/* ============ HERO ============ */}
      <section className={`${styles.hero} nx-hero-aurora`}>
        <span className="nx-orb nx-orb-1" aria-hidden></span>
        <span className="nx-orb nx-orb-2" aria-hidden></span>

        <div className={`nexa-container ${styles.heroInner}`}>
          <span className={`nx-pill ${styles.heroPill} nx-fade-in-up`}>
            <Icon name="globe" size={14} />
            {isMk ? 'За мали и средни фирми во Македонија' : 'For small and medium businesses in North Macedonia'}
          </span>
          <h1 className="nx-fade-in-up nx-d-100">{t('home.heroTitle')}</h1>
          <p className={`${styles.heroSub} nx-fade-in-up nx-d-200`}>{t('home.heroSubtitle')}</p>
          <div className={`${styles.heroCtas} nx-fade-in-up nx-d-300`}>
            <Link to="/proverka" className="nexa-btn nexa-btn-accent nexa-btn-lg">
              {isMk ? 'Бесплатна проверка на усогласеноста' : 'Check your compliance — free'}
              <Icon name="arrowRight" size={18} />
            </Link>
            <Link to="/login" className="nexa-btn nexa-btn-secondary nexa-btn-lg">
              {isMk ? 'Започнете бесплатно' : 'Start free'}
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

      {/* ============ PLANS (was /pricing) ============ */}
      <PlansSection />
    </PublicLayout>
  );
}
