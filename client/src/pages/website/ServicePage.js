import { Link, useParams } from 'react-router-dom';
import i18n from '../../i18n/i18n';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import Icon from '../../components/website/Icon';
import FaqAccordion from '../../components/website/FaqAccordion';
import ServiceInquiryForm from '../../components/website/ServiceInquiryForm';
import ServiceIllustration from '../../components/website/ServiceIllustration';
import useScrollReveal from '../../hooks/useScrollReveal';
import { NEXA_ORG, webPage } from '../../components/seo/schemaGraph';
import { SERVICES, SERVICES_COMMON, getService } from '../../data/services';
import styles from './Services.module.css';

// nexa.mk/uslugi/:slug — one consulting service, rendered from data/services/*.
// Layout rule: every section is centred and symmetric.

const SectionHead = ({ title, lead }) => (
  <header className={styles.sectionHead}>
    <h2 className={styles.sectionTitle}>{title}</h2>
    {lead && <p className={styles.sectionLead}>{lead}</p>}
  </header>
);

const ListCard = ({ icon, title, items }) => (
  <div className={`${styles.listCard} nx-reveal`}>
    <span className="nx-icon-wrap"><Icon name={icon} /></span>
    <h3>{title}</h3>
    <ul>{items.map(x => <li key={x}>{x}</li>)}</ul>
  </div>
);

export default function ServicePage() {
  useScrollReveal();
  const { slug } = useParams();
  const lang = (i18n.language || 'mk') === 'en' ? 'en' : 'mk';
  const c = SERVICES_COMMON[lang];
  const service = getService(slug);

  if (!service) {
    return (
      <PublicLayout>
        <div className={`nexa-container ${styles.notFound}`}>
          <p>{c.notFound}</p>
          <Link to="/uslugi">{c.allServices}</Link>
        </div>
      </PublicLayout>
    );
  }

  const s = service[lang];
  const url = `https://nexa.mk/uslugi/${service.slug}`;
  const others = SERVICES.filter(x => x.slug !== service.slug);
  const jsonLd = [
    NEXA_ORG,
    webPage({ url, name: s.title, description: s.short, language: lang }),
    { '@context': 'https://schema.org', '@type': 'Service', name: s.title, description: s.short, url, areaServed: 'MK', provider: { '@id': 'https://nexa.mk/#organization' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: s.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ];

  return (
    <PublicLayout>
      <SEOHelmet
        title={`${s.title} · Nexa`}
        description={s.short}
        canonical={`/uslugi/${service.slug}`}
        locale={lang === 'mk' ? 'mk_MK' : 'en_US'}
        altLocale={lang === 'mk' ? 'en_US' : 'mk_MK'}
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <section className={`${styles.hero} nx-hero-aurora`}>
        <span className="nx-orb nx-orb-1" aria-hidden></span>
        <span className="nx-orb nx-orb-2" aria-hidden></span>
        <div className={`nexa-container ${styles.heroInner}`}>
          <Link to="/uslugi" className={styles.back}>{c.allServices}</Link>
          <span className="nx-pill nx-fade-in-up"><Icon name={service.icon} size={14} />{s.title}</span>
          <h1 className="nx-fade-in-up nx-d-100">{s.heroTitle}</h1>
          <p className={`${styles.heroLead} nx-fade-in-up nx-d-200`}>{s.heroLead}</p>
          <div className="nx-fade-in-up nx-d-300">
            <a href="#kontakt" className="nexa-btn nexa-btn-accent nexa-btn-lg">
              {c.heroCta} <Icon name="arrowRight" size={18} />
            </a>
          </div>
          <div className={`${styles.heroArt} nx-fade-in-up nx-d-400`}>
            <ServiceIllustration slug={service.slug} label={s.title} />
          </div>
        </div>
      </section>

      {/* Photo */}
      <section className={styles.photoBand}>
        <div className="nexa-container">
          <figure className={`${styles.photo} nx-reveal`}>
            <img src={`/images/services/${service.slug}.jpg`} alt={s.title} loading="lazy" width="1600" height="900" />
          </figure>
        </div>
      </section>

      {/* Why it matters */}
      <section className="nx-section">
        <div className={`nexa-container ${styles.narrow}`}>
          <SectionHead title={c.introHeading} />
          <div className={styles.prose}>
            {s.intro.map((p, i) => <p key={i} className="nx-reveal">{p}</p>)}
          </div>
        </div>
      </section>

      {/* Typical situation */}
      {s.example && (
        <section className="nx-section nx-section-tint">
          <div className="nexa-container">
            <figure className={`${styles.example} nx-reveal`}>
              <span className={styles.exampleMark} aria-hidden="true">“</span>
              <figcaption className={styles.exampleLabel}>{c.exampleHeading}</figcaption>
              <blockquote>{s.example}</blockquote>
              <p className={styles.exampleNote}>{c.exampleNote}</p>
            </figure>
          </div>
        </section>
      )}

      {/* When + who */}
      <section className="nx-section nx-section-soft">
        <div className={`nexa-container ${styles.pair}`}>
          <ListCard icon="bolt" title={c.signalsHeading} items={s.signals} />
          <ListCard icon="users" title={c.forWhomHeading} items={s.forWhom} />
        </div>
      </section>

      {/* Roadmap */}
      <section className="nx-section">
        <div className="nexa-container">
          <SectionHead title={c.roadmapHeading} lead={c.roadmapNote} />
          <ol className={styles.roadmap}>
            {s.roadmap.map((ph, i) => (
              <li key={ph.phase} className={`${styles.phase} nx-reveal`}>
                <span className={styles.phaseNum}>{i + 1}</span>
                <div className={styles.phaseCard}>
                  <h3>{ph.phase}</h3>
                  <span className={styles.duration}><Icon name="clock" size={13} />{ph.duration}</span>
                  <p>{ph.text}</p>
                  <ul className={styles.activities}>
                    {ph.activities.map(a => <li key={a}>{a}</li>)}
                  </ul>
                  <div className={styles.output}>
                    <span>{c.outputLabel}</span>
                    {ph.output}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Local specifics */}
      <section className="nx-section nx-section-soft">
        <div className="nexa-container">
          <SectionHead title={c.localHeading} />
          <div className={styles.cardGrid}>
            {s.localNotes.map(n => (
              <div key={n.t} className={`${styles.infoCard} nx-reveal`}>
                <span className={styles.infoIcon}><Icon name="pin" size={18} /></span>
                <h3>{n.t}</h3>
                <p>{n.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mistakes */}
      <section className="nx-section">
        <div className="nexa-container">
          <SectionHead title={c.mistakesHeading} lead={c.mistakesLead} />
          <div className={styles.cardGrid}>
            {s.mistakes.map((m, i) => (
              <div key={m.t} className={`${styles.mistakeCard} nx-reveal`}>
                <span className={styles.mistakeNum}>{String(i + 1).padStart(2, '0')}</span>
                <h3>{m.t}</h3>
                <p>{m.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deliverables + what we need */}
      <section className="nx-section nx-section-soft">
        <div className={`nexa-container ${styles.pair}`}>
          <ListCard icon="documents" title={c.deliverablesHeading} items={s.deliverables} />
          <ListCard icon="layers" title={c.clientDocsHeading} items={s.clientDocs} />
        </div>
      </section>

      {/* Roles */}
      <section className="nx-section">
        <div className="nexa-container">
          <SectionHead title={c.rolesHeading} lead={c.partnersNote} />
          <div className={styles.trio}>
            <ListCard icon="briefcase" title={c.rolesWe} items={s.roles.we} />
            <ListCard icon="network" title={c.rolesPartners} items={s.roles.partners} />
            <ListCard icon="users" title={c.rolesYou} items={s.roles.you} />
          </div>
        </div>
      </section>

      {/* How we work */}
      <section className="nx-section nx-section-soft">
        <div className="nexa-container">
          <SectionHead title={c.processHeading} />
          <ol className={styles.process}>
            {c.process.map((p, i) => (
              <li key={p.t} className="nx-reveal">
                <span className={styles.stepNum}>{i + 1}</span>
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="nx-section">
        <div className={`nexa-container ${styles.faqWrap}`}>
          <SectionHead title={c.faqHeading} />
          <FaqAccordion items={s.faq} />
        </div>
      </section>

      {/* Contact */}
      <section id="kontakt" className="nx-section nx-section-soft">
        <div className={`nexa-container ${styles.formWrap}`}>
          <SectionHead title={c.formHeading} lead={c.formLead} />
          <ServiceInquiryForm key={service.slug} lang={lang} defaultService={service.slug} />
        </div>
      </section>

      {/* Other services */}
      <section className="nx-section">
        <div className="nexa-container">
          <SectionHead title={c.otherServices} />
          <div className={styles.otherGrid}>
            {others.map(o => (
              <Link key={o.slug} to={`/uslugi/${o.slug}`} className={`${styles.otherCard} nx-card nx-card-hover`}>
                <ServiceIllustration slug={o.slug} label={o[lang].title} size="sm" />
                <span>{o[lang].title}</span>
              </Link>
            ))}
          </div>
          <p className={styles.disclaimer}>{c.disclaimer}</p>
        </div>
      </section>
    </PublicLayout>
  );
}
