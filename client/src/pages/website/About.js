import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import EcosystemMap from '../../components/website/EcosystemMap';
import Icon from '../../components/website/Icon';
import useScrollReveal from '../../hooks/useScrollReveal';
import { NEXA_ORG, NEXA_WEBSITE, webPage, personMartin } from '../../components/seo/schemaGraph';
import styles from './About.module.css';

const SECTIONS = [
  { id: 'what-is-nexa', k: 's1Heading' },
  { id: 'problem', k: 's2Heading' },
  { id: 'ecosystem-map', k: 's3Heading' },
  { id: 'terminal', k: 's4Heading' },
  { id: 'guide-sites', k: 's5Heading' },
  { id: 'topics', k: 's6Heading' },
  { id: 'newsletter', k: 's7Heading' },
  { id: 'for-businesses', k: 's8Heading' },
  { id: 'for-professionals', k: 's9Heading' },
  { id: 'how-it-connects', k: 's10Heading' },
  { id: 'trust', k: 's11Heading' },
  { id: 'contact', k: 's13Heading' }
];

const GUIDE_SITES = [
  { name: 'SamoDaPrasham', href: 'https://samodaprasham.mk', areaMK: 'Правни прашања за физички лица', areaEN: 'Legal questions for individuals' },
  { name: 'Immigration.mk', href: 'https://immigration.mk', areaMK: 'Имиграција во Северна Македонија', areaEN: 'Immigration to North Macedonia' },
  { name: 'Macedonian Citizenship', href: 'https://macedoniancitizenship.mk', areaMK: 'Аплицирање за државјанство', areaEN: 'Citizenship applications' },
  { name: 'Company.nexa.mk', href: 'https://company.nexa.mk', areaMK: 'Регистрација на компанија (ДОО/АД)', areaEN: 'Company registration (DOO/AD)' },
  { name: 'IPLaw.nexa.mk', href: 'https://iplaw.nexa.mk', areaMK: 'Трговски марки, патенти, авторски права', areaEN: 'Trademarks, patents, copyright' }
];

export default function About() {
  const { t } = useTranslation('website');
  useScrollReveal();
  const lang = i18n.language || 'mk';
  const url = 'https://nexa.mk/about';

  const jsonLd = [
    NEXA_ORG,
    NEXA_WEBSITE,
    webPage({ url, name: t('about.title'), description: t('about.seoDesc'), language: lang }),
    personMartin
  ];

  return (
    <PublicLayout>
      <SEOHelmet
        title={t('about.seoTitle')}
        description={t('about.seoDesc')}
        canonical="/about"
        locale={lang === 'mk' ? 'mk_MK' : 'en_US'}
        altLocale={lang === 'mk' ? 'en_US' : 'mk_MK'}
        jsonLd={jsonLd}
      />
      <header className={`nx-hero-aurora ${styles.hero}`}>
        <span className="nx-orb nx-orb-1" aria-hidden></span>
        <span className="nx-orb nx-orb-2" aria-hidden></span>
        <div className={`nexa-container ${styles.heroInner}`}>
          <span className="nx-pill nx-fade-in-up">
            <Icon name="network" size={14} />
            {lang === 'mk' ? 'Деловен екосистем' : 'Business ecosystem'}
          </span>
          <h1 className="nx-fade-in-up nx-d-100">{t('about.title')}</h1>
          <p className={`${styles.lead} nx-fade-in-up nx-d-200`}>{t('about.s1P1')}</p>
        </div>
      </header>
      <div className={`nexa-container ${styles.layout}`}>
        <aside className={styles.sidebar} aria-label={t('about.sidebarHeading')}>
          <div className={styles.sidebarSticky}>
            <h4>{t('about.sidebarHeading')}</h4>
            <ul>
              {SECTIONS.map(s => (
                <li key={s.id}><a href={`#${s.id}`}>{t(`about.${s.k}`)}</a></li>
              ))}
            </ul>
          </div>
        </aside>
        <article className={styles.article}>

          <section id="what-is-nexa">
            <h2>{t('about.s1Heading')}</h2>
            <p>{t('about.s1P1')}</p>
            <p>{t('about.s1P2')}</p>
            <p>{t('about.s1P3')}</p>
          </section>

          <section id="problem">
            <h2>{t('about.s2Heading')}</h2>
            <p>{t('about.s2P1')}</p>
            <p>{t('about.s2P2')}</p>
          </section>

          <section id="ecosystem-map">
            <h2>{t('about.s3Heading')}</h2>
            <p>{t('about.s3P1')}</p>
            <EcosystemMap />
          </section>

          <section id="terminal">
            <h2>{t('about.s4Heading')}</h2>
            <p>{t('about.s4P1')}</p>
            <h3>{t('about.s4DocsTitle')}</h3>
            <p>{t('about.s4DocsDesc')}</p>
            <h3>{t('about.s4AiTitle')}</h3>
            <p>{t('about.s4AiDesc')}</p>
            <h3>{t('about.s4HealthTitle')}</h3>
            <p>{t('about.s4HealthDesc')}</p>
            <h3>{t('about.s4MarketTitle')}</h3>
            <p>{t('about.s4MarketDesc')}</p>
            <h3>{t('about.s4CreditsTitle')}</h3>
            <p>{t('about.s4CreditsDesc')}</p>
          </section>

          <section id="guide-sites">
            <h2>{t('about.s5Heading')}</h2>
            <p>{t('about.s5P1')}</p>
            <ul className={styles.siteList}>
              {GUIDE_SITES.map(s => (
                <li key={s.name}>
                  <h3>
                    <a href={s.href} rel="noopener">{s.name} →</a>
                  </h3>
                  <p>{lang === 'mk' ? s.areaMK : s.areaEN}</p>
                </li>
              ))}
            </ul>
          </section>

          <section id="topics">
            <h2>{t('about.s6Heading')}</h2>
            <p>{t('about.s6P1')}</p>
            <p><a href="https://topics.nexa.mk" rel="noopener">topics.nexa.mk →</a></p>
          </section>

          <section id="newsletter">
            <h2>{t('about.s7Heading')}</h2>
            <p>{t('about.s7P1')}</p>
          </section>

          <section id="for-businesses">
            <h2>{t('about.s8Heading')}</h2>
            <p>{t('about.s8P1')}</p>
            <p><a href="/pricing">{t('home.pricingTeaserHeading')} →</a></p>
          </section>

          <section id="for-professionals">
            <h2>{t('about.s9Heading')}</h2>
            <p>{t('about.s9P1')}</p>
            <p><a href="/pricing">{t('pricing.title')} →</a></p>
          </section>

          <section id="how-it-connects">
            <h2>{t('about.s10Heading')}</h2>
            <p>{t('about.s10P1')}</p>
          </section>

          <section id="trust">
            <h2>{t('about.s11Heading')}</h2>
            <p>{t('about.s11P1')}</p>
            <p>{t('about.s11P2')} <a href="https://mba.org.mk/index.php/mk/imenik-advokati/imenik-aktivni-advokati" rel="noopener">mba.org.mk →</a></p>
          </section>

          <section id="contact">
            <h2>{t('about.s13Heading')}</h2>
            <p>{t('about.s13P1')}</p>
            <p><a href="/contact" className="nexa-btn nexa-btn-accent">{t('nav.contact')} →</a></p>
          </section>

        </article>
      </div>
    </PublicLayout>
  );
}
