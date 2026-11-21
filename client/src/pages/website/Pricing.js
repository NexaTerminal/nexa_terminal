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
      tagline: T('За мали и средни фирми што сами ги водат документите и усогласеноста.',
                 'For SMBs that run their own compliance and paperwork.'),
      features: [
        T('Автоматизирани документи (над 45 шаблони) и сопствени шаблони', 'Automated documents (45+ templates) + My Templates'),
        T('AI-асистенти и анализа на договори', 'Legal AI assistance + contract analysis'),
        T('Сите проверки на усогласеноста (правна, заштита на лични податоци, даноци, работни односи, сајбер-безбедност)', 'All compliance checks (legal, GDPR, tax, HR, cyber)'),
        T('Кадровски алатки: евиденција на вработени, проценка на кандидати, интервјуа', 'HR tools: employees, character assessment, interviews'),
        T('Помош од адвокат кога Ви е потребна', 'Connect with a lawyer when you need one'),
        T('До 3 корисници во фирмата', 'Up to 3 co-worker seats'),
      ],
      cta: T('Започнете бесплатно', 'Start free'),
      ctaTo: '/login',
      ctaAccent: false,
    },
    {
      key: 'pro',
      name: T('Про', 'Pro'),
      featured: true,
      priceLabel: T('По покана', 'Invite-only'),
      tagline: T('За адвокати — барања за правна помош преку мрежата Nexa.',
                 'For lawyers — qualified clients from businesses on the Nexa network.'),
      features: [
        T('Сè од пакетот Основен, плус:', 'Everything in Basic, plus:'),
        T('Барања од клиенти преку специјализираните страници на мрежата', 'Inbound clients & cases from the Nexa network'),
        T('До 25 сметки за Вашите клиенти', 'Up to 25 client accounts — manage your whole book'),
        T('Стручни одговори (Теми) и блог — видливост како стручњак', 'Topics Q&A + blog — visibility as an expert'),
        T('Професионален профил во мрежата', 'Provider profile in the network'),
        T('Ограничен број места во основачкиот круг', 'Limited founding cohort'),
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
        description={T('Бесплатно за фирми. За адвокати — пристап по покана во основачкиот круг на Nexa.',
                       'Free for businesses. For lawyers — invite-only access to the Nexa founding cohort.')}
        locale={isMk ? 'mk_MK' : 'en_US'}
        jsonLd={[NEXA_ORG, NEXA_WEBSITE, webPage({ url, name: T('Пакети', 'Plans'), description: '', language: isMk ? 'mk' : 'en' })]}
      />

      <section className={`nx-section ${styles.wrap}`}>
        <div className="nexa-container">
          <div className={styles.head} data-reveal>
            <span className="nx-pill">{T('Бесплатно за фирми', 'Free for businesses')}</span>
            <h1 className={styles.title}>{T('Бесплатно за фирми, по покана за адвокати', 'One plan free, one invite-only')}</h1>
            <p className={styles.lead}>
              {T('Фирмите ги користат алатките бесплатно. Адвокатите се приклучуваат по покана, во основачки круг со ограничен број места.',
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
