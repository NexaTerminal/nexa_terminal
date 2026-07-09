import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import Icon from '../../components/website/Icon';
import useScrollReveal from '../../hooks/useScrollReveal';
import { NEXA_ORG, NEXA_WEBSITE, webPage } from '../../components/seo/schemaGraph';
import styles from './Accountants.module.css';

/**
 * /smetkovoditeli — accountant partner landing page (master-plan Phase 8).
 *
 * Markets the EXISTING Pro capability (up to 25 client sub-accounts, each its
 * own login + company) to accounting firms as a "manage all your clients'
 * compliance from one account" offer. No new commercial terms are invented —
 * the offer is the Pro plan that already ships; CTA is register-as-Pro + contact.
 */
export default function Accountants() {
  const { t } = useTranslation('website');
  useScrollReveal();
  const isMk = (i18n.language || 'mk') === 'mk';
  const url = 'https://nexa.mk/smetkovoditeli';

  const STEPS = isMk ? [
    { n: '1', t: 'Отворете Pro сметка', d: 'Регистрирајте се како провајдер на услуги — вашата канцеларија добива Pro пристап.' },
    { n: '2', t: 'Додадете ги клиентите', d: 'Провизирајте до 25 клиентски фирми — секоја со сопствена најава и податоци, под вашата претплата.' },
    { n: '3', t: 'Управувајте од едно место', d: 'Документи, проверки за усогласеност и рокови за сите клиенти — од една контролна табла.' }
  ] : [
    { n: '1', t: 'Open a Pro account', d: 'Register as a service provider — your firm gets Pro access.' },
    { n: '2', t: 'Add your clients', d: 'Provision up to 25 client companies — each with its own login and data, under your subscription.' },
    { n: '3', t: 'Manage from one place', d: 'Documents, compliance checks and deadlines for every client — from a single dashboard.' }
  ];

  const BENEFITS = isMk ? [
    { icon: 'users', t: 'До 25 клиентски фирми', d: 'Секоја со сопствена најава, податоци и усогласеност — сите под вашата една претплата.' },
    { icon: 'documents', t: 'Документи за секој клиент', d: '45+ автоматизирани правни документи — договори, одлуки, политики — готови за 30 секунди.' },
    { icon: 'shield', t: 'Проверки за усогласеност', d: 'Правна, HR, маркетинг и сајбер проверка за секоја фирма што ја водите.' },
    { icon: 'clock', t: 'Рокови и потсетници', d: 'Следете ги договорите и обврските на сите клиенти — автоматски потсетници пред истек.' },
    { icon: 'network', t: 'Видливост во мрежата', d: 'Вашата експертиза пред нови клиенти преку блог, билтен и Topics Q&A.' },
    { icon: 'briefcase', t: 'Нови клиенти', d: 'Побарувања од нашите специјализирани сајтови стигнуваат до вас.' }
  ] : [
    { icon: 'users', t: 'Up to 25 client firms', d: 'Each with its own login, data and compliance — all under your single subscription.' },
    { icon: 'documents', t: 'Documents for every client', d: '45+ automated legal documents — contracts, decisions, policies — in 30 seconds.' },
    { icon: 'shield', t: 'Compliance checks', d: 'Legal, HR, marketing and cyber screening for every firm you manage.' },
    { icon: 'clock', t: 'Deadlines & reminders', d: 'Track every client’s contracts and obligations — automatic reminders before expiry.' },
    { icon: 'network', t: 'Visibility in the network', d: 'Your expertise in front of new clients via blog, newsletter and Topics Q&A.' },
    { icon: 'briefcase', t: 'New clients', d: 'Requests from our specialized sites reach you.' }
  ];

  return (
    <PublicLayout>
      <SEOHelmet
        title={isMk ? 'Nexa за сметководители — управувајте ги сите клиенти од едно место' : 'Nexa for accountants — manage all your clients from one place'}
        description={isMk
          ? 'Сметководителите ги водат документите, усогласеноста и роковите на сите свои клиенти преку една Pro сметка на Nexa — до 25 клиентски фирми.'
          : 'Accountants manage documents, compliance and deadlines for all their clients through one Nexa Pro account — up to 25 client firms.'}
        canonical="/smetkovoditeli"
        locale={isMk ? 'mk_MK' : 'en_US'}
        jsonLd={[NEXA_ORG, NEXA_WEBSITE, webPage({ url, name: 'Nexa за сметководители', description: '', language: isMk ? 'mk' : 'en' })]}
      />

      {/* HERO */}
      <section className={`${styles.hero} nx-hero-aurora`}>
        <span className="nx-orb nx-orb-1" aria-hidden></span>
        <div className={`nexa-container ${styles.heroInner}`}>
          <span className={`nx-pill ${styles.heroPill} nx-fade-in-up`}>
            <Icon name="briefcase" size={14} />
            {isMk ? 'За сметководители и книговодители' : 'For accountants and bookkeepers'}
          </span>
          <h1 className="nx-fade-in-up nx-d-100">
            {isMk ? 'Понудете им Nexa на сите ваши клиенти — од една сметка.' : 'Offer Nexa to all your clients — from one account.'}
          </h1>
          <p className={`${styles.heroSub} nx-fade-in-up nx-d-200`}>
            {isMk
              ? 'Вашата канцеларија веќе е точката на доверба за десетици фирми. Со Nexa Pro водете ги нивните документи, усогласеност и рокови од една контролна табла — до 25 клиентски фирми под вашата претплата.'
              : 'Your firm is already the trusted point for dozens of businesses. With Nexa Pro, manage their documents, compliance and deadlines from one dashboard — up to 25 client firms under your subscription.'}
          </p>
          <div className={`${styles.heroCtas} nx-fade-in-up nx-d-300`}>
            <Link to="/login?intent=pro" className="nexa-btn nexa-btn-accent nexa-btn-lg">
              {isMk ? 'Отворете Pro сметка' : 'Open a Pro account'}
              <Icon name="arrowRight" size={18} />
            </Link>
            <Link to="/contact" className="nexa-btn nexa-btn-secondary nexa-btn-lg">
              {isMk ? 'Разговарајте со нас' : 'Talk to us'}
            </Link>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="nx-section">
        <div className="nexa-container">
          <div className={`${styles.sectionHead} nx-reveal`}>
            <span className="nx-eyebrow">{isMk ? 'Зошто Nexa Pro' : 'Why Nexa Pro'}</span>
            <h2>{isMk ? 'Една сметка за целата ваша клиентска книга.' : 'One account for your whole client book.'}</h2>
          </div>
          <div className={styles.benefitGrid}>
            {BENEFITS.map((b) => (
              <div key={b.t} className={`${styles.benefit} nx-reveal`}>
                <span className={styles.benefitIcon}><Icon name={b.icon} size={22} /></span>
                <h3 className={styles.benefitTitle}>{b.t}</h3>
                <p className={styles.benefitDesc}>{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={`nx-section ${styles.stepsSection}`}>
        <div className="nexa-container">
          <div className={`${styles.sectionHead} nx-reveal`}>
            <span className="nx-eyebrow">{isMk ? 'Како функционира' : 'How it works'}</span>
            <h2>{isMk ? 'Три чекори до управувани клиенти.' : 'Three steps to managed clients.'}</h2>
          </div>
          <ol className={styles.steps}>
            {STEPS.map((s) => (
              <li key={s.n} className={`${styles.step} nx-reveal`}>
                <span className={styles.stepNum}>{s.n}</span>
                <div>
                  <div className={styles.stepTitle}>{s.t}</div>
                  <div className={styles.stepDesc}>{s.d}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="nx-section">
        <div className="nexa-container">
          <div className={`${styles.ctaCard} nx-reveal`}>
            <h2 className={styles.ctaTitle}>
              {isMk ? 'Спремни да ги внесете вашите клиенти?' : 'Ready to onboard your clients?'}
            </h2>
            <p className={styles.ctaText}>
              {isMk
                ? 'Отворете Pro сметка и додајте ја првата клиентска фирма денес, или контактирајте нè за да ве водиме низ процесот.'
                : 'Open a Pro account and add your first client firm today, or contact us and we’ll walk you through it.'}
            </p>
            <div className={styles.heroCtas}>
              <Link to="/login?intent=pro" className="nexa-btn nexa-btn-accent nexa-btn-lg">
                {isMk ? 'Отворете Pro сметка' : 'Open a Pro account'}
                <Icon name="arrowRight" size={18} />
              </Link>
              <Link to="/pricing" className="nexa-btn nexa-btn-secondary nexa-btn-lg">
                {isMk ? 'Погледни ги цените' : 'See pricing'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
