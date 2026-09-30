import { useState } from 'react';
import { Link } from 'react-router-dom';
import i18n from '../../i18n/i18n';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import Icon from '../../components/website/Icon';
import useScrollReveal from '../../hooks/useScrollReveal';
import { NEXA_ORG, NEXA_WEBSITE, webPage } from '../../components/seo/schemaGraph';
import styles from './Pricing.module.css';

/**
 * /pricing — public two-tier pricing page (Nexa 3.1).
 *
 * Prices are now shown publicly. Keep the numbers in sync with
 * server/constants/roles.js PLAN_PRICES (source of truth) and the in-app
 * SubscriptionGate. Issuer is not VAT-liable, so the shown price is final.
 */
const PRICES = {
  basic: { monthly: 15, annual: 149 },
  pro:   { monthly: 39, annual: 390 }
};
const EUR_TO_MKD = 61.5; // display-only; invoices use INVOICE_EUR_TO_MKD server-side

export default function Pricing() {
  useScrollReveal();
  const isMk = (i18n.language || 'mk') === 'mk';
  const T = (mk, en) => (isMk ? mk : en);
  const [cycle, setCycle] = useState('annual');
  const url = 'https://nexa.mk/pricing';

  const mkd = (eur) => Math.round(eur * EUR_TO_MKD).toLocaleString(isMk ? 'mk-MK' : 'en-US');
  const unit = cycle === 'annual' ? T('/ година', '/ year') : T('/ месец', '/ month');

  const PLANS = [
    {
      key: 'basic',
      name: T('Основен', 'Basic'),
      tagline: T('За мали и средни бизниси што сами водат усогласеност и документи.',
                 'For SMBs that run their own compliance and paperwork.'),
      features: [
        T('Автоматизирани документи (45+ шаблони) + Мои шаблони', 'Automated documents (45+ templates) + My Templates'),
        T('Правна и маркетинг AI + Анализа на договори', 'Legal & marketing AI + contract analysis'),
        T('Сите проверки на усогласеност (правна, ГДПР, данок, HR, кибер)', 'All compliance checks (legal, GDPR, tax, HR, cyber)'),
        T('HR алатки: вработени, проценка на карактер, интервјуа', 'HR tools: employees, character assessment, interviews'),
        T('Регистар на набавки + Барање понуди', 'Procurement register + request for offers'),
        T('Банер во месечниот билтен', 'Newsletter banner slot'),
        T('До 3 корисници во компанијата', 'Up to 3 co-worker seats'),
      ],
      cta: T('Започни бесплатно', 'Start free'),
    },
    {
      key: 'pro',
      name: T('Про', 'Pro'),
      featured: true,
      tagline: T('За даватели на услуги — адвокати, сметководители, агенти, консултанти.',
                 'For service providers — lawyers, accountants, agents, consultants.'),
      features: [
        T('Сè од Основен, плюс:', 'Everything in Basic, plus:'),
        T('До 25 клиентски сметки — управувај цели клиенти', 'Up to 25 client accounts — manage your whole book'),
        T('Влезни клиенти и предмети од Nexa мрежата', 'Inbound clients & cases from the Nexa network'),
        T('Теми (Q&A) + Блог (2 објави месечно)', 'Topics Q&A + blog (2 posts/month)'),
        T('Профил на давател + Виртуелен саем', 'Provider profile + virtual fair'),
        T('Приоритетна видливост како експерт', 'Priority visibility as an expert'),
      ],
      cta: T('Започни бесплатно', 'Start free'),
    },
  ];

  const offerJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Nexa Terminal',
    description: T('Правна и деловна платформа за автоматизација за бизниси во Македонија.',
                   'Legal & business automation platform for companies in North Macedonia.'),
    brand: { '@type': 'Brand', name: 'Nexa' },
    offers: PLANS.map((p) => ({
      '@type': 'Offer',
      name: p.name,
      price: PRICES[p.key][cycle],
      priceCurrency: 'EUR',
      url,
      availability: 'https://schema.org/InStock',
    })),
  };

  return (
    <PublicLayout>
      <SEOHelmet
        title={T('Цени · Nexa', 'Pricing · Nexa')}
        description={T('Основен €149/год · Про €390/год. 8 дена бесплатно, без картичка. Транспарентни цени за правна и деловна автоматизација.',
                       'Basic €149/yr · Pro €390/yr. 8 days free, no card. Transparent pricing for legal & business automation.')}
        locale={isMk ? 'mk_MK' : 'en_US'}
        jsonLd={[NEXA_ORG, NEXA_WEBSITE, webPage({ url, name: T('Цени', 'Pricing'), description: '', language: isMk ? 'mk' : 'en' }), offerJsonLd]}
      />

      <section className={`nx-section ${styles.wrap}`}>
        <div className="nexa-container">
          <div className={styles.head} data-reveal>
            <span className="nx-pill">{T('8 дена бесплатно · без картичка', '8 days free · no card')}</span>
            <h1 className={styles.title}>{T('Едноставни, транспарентни цени', 'Simple, transparent pricing')}</h1>
            <p className={styles.lead}>
              {T('Изберете месечно или годишно. Со годишна претплата добивате околу 2 месеци гратис.',
                 'Pick monthly or annual. Annual gives you roughly 2 months free.')}
            </p>

            <div className={styles.cycleToggle} role="tablist" aria-label={T('Период', 'Billing period')}>
              <button type="button" role="tab" aria-selected={cycle === 'monthly'}
                className={`${styles.cycleBtn} ${cycle === 'monthly' ? styles.cycleActive : ''}`}
                onClick={() => setCycle('monthly')}>{T('Месечно', 'Monthly')}</button>
              <button type="button" role="tab" aria-selected={cycle === 'annual'}
                className={`${styles.cycleBtn} ${cycle === 'annual' ? styles.cycleActive : ''}`}
                onClick={() => setCycle('annual')}>
                {T('Годишно', 'Annual')}<span className={styles.cycleSave}>{T('2 месеци гратис', '2 months free')}</span>
              </button>
            </div>
          </div>

          <div className={styles.grid}>
            {PLANS.map((p) => (
              <div key={p.key} className={`${styles.card} ${p.featured ? styles.cardFeatured : ''}`} data-reveal>
                {p.featured && <div className={styles.badge}>{T('Најпопуларно', 'Most popular')}</div>}
                <div className={styles.cardName}>{p.name}</div>
                <p className={styles.cardTagline}>{p.tagline}</p>
                <div className={styles.priceRow}>
                  <span className={styles.priceNum}>€{PRICES[p.key][cycle]}</span>
                  <span className={styles.priceUnit}>{unit}</span>
                </div>
                <div className={styles.priceMkd}>≈ {mkd(PRICES[p.key][cycle])} {T('ден', 'MKD')}</div>
                <Link to="/login" className={`nexa-btn ${p.featured ? 'nexa-btn-accent' : 'nexa-btn-secondary'} nexa-btn-lg ${styles.cardCta}`}>
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

          <p className={styles.finePrint}>
            {T('Цените се без ДДВ — издавачот не е обврзник на ДДВ. Плаќање преку банкарски трансфер по профактура. Македонски денари се пресметуваат по курс ~61,5.',
               'Prices are VAT-exempt — the issuer is not VAT-liable. Payment by bank transfer against a pro-forma invoice. MKD shown at ~61.5 rate.')}
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
