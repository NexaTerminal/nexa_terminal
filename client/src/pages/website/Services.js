import { Link } from 'react-router-dom';
import i18n from '../../i18n/i18n';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import Icon from '../../components/website/Icon';
import ServiceInquiryForm from '../../components/website/ServiceInquiryForm';
import ServiceIllustration from '../../components/website/ServiceIllustration';
import useScrollReveal from '../../hooks/useScrollReveal';
import { NEXA_ORG, NEXA_WEBSITE, webPage, breadcrumbList } from '../../components/seo/schemaGraph';
import { SERVICES, SERVICES_COMMON } from '../../data/services';
import styles from './Services.module.css';

// nexa.mk/uslugi — manual consulting & project-management services hub.
export default function Services() {
  useScrollReveal();
  const lang = (i18n.language || 'mk') === 'en' ? 'en' : 'mk';
  const c = SERVICES_COMMON[lang];
  const url = 'https://nexa.mk/uslugi';

  const offerCatalog = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${url}#service`,
    name: 'Nexa — ' + c.navLabel,
    url,
    description: c.seoDesc,
    image: 'https://nexa.mk/images/services/hub.jpg',
    areaServed: { '@type': 'Country', name: 'North Macedonia' },
    availableLanguage: ['mk', 'en'],
    provider: { '@id': 'https://nexa.mk/#organization' },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: c.navLabel,
      itemListElement: SERVICES.map(s => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s[lang].title, description: s[lang].short, url: `${url}/${s.slug}` },
      })),
    },
  };

  return (
    <PublicLayout>
      <SEOHelmet
        title={c.seoTitle}
        description={c.seoDesc}
        canonical="/uslugi"
        locale={lang === 'mk' ? 'mk_MK' : 'en_US'}
        altLocale={lang === 'mk' ? 'en_US' : 'mk_MK'}
        ogImage="/images/services/hub.jpg"
        ogImageWidth={1600}
        ogImageHeight={900}
        ogImageAlt={c.navLabel}
        jsonLd={[NEXA_ORG, NEXA_WEBSITE, webPage({ url, name: c.seoTitle, description: c.seoDesc, language: lang }), breadcrumbList([['Nexa', '/'], [c.navLabel, '/uslugi']]), offerCatalog]}
      />

      <section className={`${styles.hero} nx-hero-aurora`}>
        <span className="nx-orb nx-orb-1" aria-hidden></span>
        <span className="nx-orb nx-orb-2" aria-hidden></span>
        <div className={`nexa-container ${styles.heroInner}`}>
          <span className="nx-pill nx-fade-in-up"><Icon name="briefcase" size={14} />{c.pill}</span>
          <h1 className="nx-fade-in-up nx-d-100">{c.heroTitle}</h1>
          <p className={`${styles.heroLead} nx-fade-in-up nx-d-200`}>{c.heroLead}</p>
          <div className="nx-fade-in-up nx-d-300">
            <a href="#kontakt" className="nexa-btn nexa-btn-accent nexa-btn-lg">
              {c.heroCta} <Icon name="arrowRight" size={18} />
            </a>
          </div>
          <div className={`${styles.heroArt} nx-fade-in-up nx-d-400`}>
            <ServiceIllustration slug="hub" label={c.navLabel} />
          </div>
        </div>
      </section>

      {/* Photo — full-bleed with overlay */}
      <section className={styles.photoBand}>
        <img className={styles.photoImg} src={"/images/services/hub.jpg"} alt={c.navLabel} loading="lazy" width="1600" height="900" />
        <div className={styles.photoShade} aria-hidden="true"></div>
        <div className={`nexa-container ${styles.photoText} nx-reveal`}>
          <span className={styles.photoEyebrow}>{c.pill}</span>
          <p className={styles.photoQuote}>{c.photoQuote}</p>
          <a href="#kontakt" className={`nexa-btn nexa-btn-glass ${styles.photoCta}`}>
            {c.heroCta} <Icon name="arrowRight" size={16} />
          </a>
        </div>
      </section>

      <section className="nx-section">
        <div className="nexa-container">
          <header className={styles.sectionHead}><h2 className={styles.sectionTitle}>{c.servicesHeading}</h2></header>
          <div className={styles.serviceGrid}>
            {SERVICES.map((s, i) => (
              <Link key={s.slug} to={`/uslugi/${s.slug}`}
                    className={`${styles.serviceCard} nx-card nx-card-hover nx-reveal`}
                    style={{ transitionDelay: `${i * 60}ms` }}>
                <ServiceIllustration slug={s.slug} label={s[lang].title} size="sm" />
                <h3>{s[lang].title}</h3>
                <p>{s[lang].short}</p>
                <span className={styles.more}>{c.more} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="nx-section nx-section-soft">
        <div className="nexa-container">
          <header className={styles.sectionHead}><h2 className={styles.sectionTitle}>{c.processHeading}</h2></header>
          <ol className={styles.process}>
            {c.process.map((p, i) => (
              <li key={p.t} className="nx-reveal">
                <span className={styles.stepNum}>{i + 1}</span>
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </li>
            ))}
          </ol>
          <p className={styles.sectionLead}>{c.partnersNote}</p>
        </div>
      </section>

      <section className="nx-section">
        <div className="nexa-container">
          <header className={styles.sectionHead}><h2 className={styles.sectionTitle}>{c.experienceHeading}</h2></header>
          <div className={styles.trio}>
            {c.experience.map(x => (
              <div key={x.t} className={`${styles.listCard} nx-reveal`}>
                <span className="nx-icon-wrap"><Icon name={x.icon} /></span>
                <h3>{x.t}</h3>
                <p>{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="kontakt" className="nx-section nx-section-soft">
        <div className={`nexa-container ${styles.formWrap}`}>
          <header className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{c.formHeading}</h2>
            <p className={styles.sectionLead}>{c.formLead}</p>
          </header>
          <ServiceInquiryForm lang={lang} />
        </div>
      </section>
    </PublicLayout>
  );
}
