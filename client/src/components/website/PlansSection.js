import { Link } from 'react-router-dom';
import i18n from '../../i18n/i18n';
import Icon from './Icon';
import styles from './PlansSection.module.css';

/**
 * Nexa Terminal plans — homepage section (#paketi). Replaces the old /pricing
 * page, which now redirects here.
 *
 * NO prices are shown publicly. Basic is free for businesses; Pro (lawyers) is
 * invite-only during the founding pilot. Internal prices live in
 * server/constants/roles.js PLAN_PRICES.
 *
 * The callout below the cards keeps the software plans apart from the manual
 * consulting services (/uslugi), which are quoted separately.
 */
export default function PlansSection() {
  const isMk = (i18n.language || 'mk') === 'mk';
  const T = (mk, en) => (isMk ? mk : en);

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
      ctaTo: '/login?mode=register',
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
    <section id="paketi" className={`nx-section nx-section-soft ${styles.section}`}>
      <div className="nexa-container">
        <div className={`${styles.head} nx-reveal`}>
          <span className="nx-pill">{T('Софтвер · Nexa Terminal', 'Software · Nexa Terminal')}</span>
          <h2 className={styles.title}>{T('Пакети за Nexa Terminal', 'Nexa Terminal plans')}</h2>
          <p className={styles.lead}>
            {T('Фирмите ги користат алатките бесплатно. Адвокатите се приклучуваат по покана, во основачки круг со ограничен број места.',
               'Businesses use the tools for free. Lawyers join by invitation in a limited founding cohort.')}
          </p>
        </div>

        <div className={styles.grid}>
          {PLANS.map((p) => (
            <div key={p.key} className={`${styles.card} ${p.featured ? styles.cardFeatured : ''} nx-reveal`}>
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

        <div className={`${styles.separate} nx-reveal`}>
          <span className={styles.separateIcon}><Icon name="briefcase" size={20} /></span>
          <p>
            {isMk ? (
              <><strong>Советувањето и водењето проекти не се дел од пакетите.</strong> Due diligence, M&amp;A, стартапи и другите услуги се договараат посебно, со писмена понуда за секој проект.</>
            ) : (
              <><strong>Consulting and project management are not part of these plans.</strong> Due diligence, M&amp;A, startup and our other services are agreed separately, with a written proposal for each project.</>
            )}
          </p>
          <Link to="/uslugi" className={styles.separateLink}>{T('Услуги →', 'Services →')}</Link>
        </div>
      </div>
    </section>
  );
}
