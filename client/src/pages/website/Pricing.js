import { Link } from 'react-router-dom';
import i18n from '../../i18n/i18n';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import Icon from '../../components/website/Icon';
import useScrollReveal from '../../hooks/useScrollReveal';
import { NEXA_ORG, NEXA_WEBSITE, webPage } from '../../components/seo/schemaGraph';
import styles from './Pricing.module.css';

/**
 * /pricing — public plans page (founding-pilot model).
 *
 * NO prices are shown publicly. Basic is free for businesses; Pro (lawyers) is
 * invite-only during the founding pilot — pricing is handled privately on close.
 * Internal prices live in server/constants/roles.js PLAN_PRICES (not exposed here).
 */
export default function Pricing() {
  useScrollReveal();
  const isMk = (i18n.language || 'mk') === 'mk';
  const T = (mk, en) => (isMk ? mk : en);
  const url = 'https://nexa.mk/pricing';

  const PLANS = [
    {
      key: 'basic',
      name: T('Основен', 'Basic'),
      priceLabel: T('Бесплатно', 'Free'),
      tagline: T('За мали и средни бизниси што сами водат усогласеност и документи.',
                 'For SMBs that run their own compliance and paperwork.'),
      features: [
        T('Автоматизирани документи (45+ шаблони) + Мои шаблони', 'Automated documents (45+ templates) + My Templates'),
        T('Правна AI помош + Анализа на договори', 'Legal AI assistance + contract analysis'),
        T('Сите проверки на усогласеност (правна, ГДПР, данок, HR, кибер)', 'All compliance checks (legal, GDPR, tax, HR, cyber)'),
        T('HR алатки: вработени, проценка на карактер, интервјуа', 'HR tools: employees, character assessment, interviews'),
        T('Поврзување со адвокат кога ви треба', 'Connect with a lawyer when you need one'),
        T('До 3 корисници во компанијата', 'Up to 3 co-worker seats'),
      ],
      cta: T('Започни бесплатно', 'Start free'),
      ctaTo: '/login',
      ctaAccent: false,
    },
    {
      key: 'pro',
      name: T('Про', 'Pro'),
      featured: true,
      priceLabel: T('По покана', 'Invite-only'),
      tagline: T('За адвокати — квалификувани клиенти од бизниси на Nexa мрежата.',
                 'For lawyers — qualified clients from businesses on the Nexa network.'),
      features: [
        T('Сè од Основен, плюс:', 'Everything in Basic, plus:'),
        T('Влезни клиенти и предмети од Nexa мрежата', 'Inbound clients & cases from the Nexa network'),
        T('До 25 клиентски сметки — управувај цели клиенти', 'Up to 25 client accounts — manage your whole book'),
        T('Теми (Q&A) + Блог — видливост како експерт', 'Topics Q&A + blog — visibility as an expert'),
        T('Профил на давател во мрежата', 'Provider profile in the network'),
        T('Ограничен основачки круг', 'Limited founding cohort'),
      ],
      cta: T('Контактирајте нè', 'Contact us'),
      ctaTo: '/contact',
      ctaAccent: true,
    },
  ];

  return (
    <PublicLayout>
      <SEOHelmet
        title={T('Пакети · Nexa', 'Plans · Nexa')}
        description={T('Бесплатно за бизниси. За адвокати — пристап по покана во основачкиот круг на Nexa.',
                       'Free for businesses. For lawyers — invite-only access to the Nexa founding cohort.')}
        locale={isMk ? 'mk_MK' : 'en_US'}
        jsonLd={[NEXA_ORG, NEXA_WEBSITE, webPage({ url, name: T('Пакети', 'Plans'), description: '', language: isMk ? 'mk' : 'en' })]}
      />

      <section className={`nx-section ${styles.wrap}`}>
        <div className="nexa-container">
          <div className={styles.head} data-reveal>
            <span className="nx-pill">{T('Бесплатно за бизниси', 'Free for businesses')}</span>
            <h1 className={styles.title}>{T('Еден пакет бесплатно, еден по покана', 'One plan free, one invite-only')}</h1>
            <p className={styles.lead}>
              {T('Бизнисите ги користат алатките бесплатно. Адвокатите се приклучуваат по покана во ограничен основачки круг.',
                 'Businesses use the tools for free. Lawyers join by invitation in a limited founding cohort.')}
            </p>
          </div>

          <div className={styles.grid}>
            {PLANS.map((p) => (
              <div key={p.key} className={`${styles.card} ${p.featured ? styles.cardFeatured : ''}`} data-reveal>
                {p.featured && <div className={styles.badge}>{T('Основачки круг', 'Founding cohort')}</div>}
                <div className={styles.cardName}>{p.name}</div>
                <p className={styles.cardTagline}>{p.tagline}</p>
                <div className={styles.priceRow}>
                  <span className={styles.priceNum}>{p.priceLabel}</span>
                </div>
                <Link to={p.ctaTo} className={`nexa-btn ${p.ctaAccent ? 'nexa-btn-accent' : 'nexa-btn-secondary'} nexa-btn-lg ${styles.cardCta}`}>
                  {p.cta}
                </Link>
                <ul className={styles.features}>
                  {p.features.map((f, i) => (
                    <li key={i} className={styles.feature}>
                      <Icon name="check" size={16} /> <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
