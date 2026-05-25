import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import EcosystemMap from '../../components/website/EcosystemMap';
import Icon from '../../components/website/Icon';
import useScrollReveal from '../../hooks/useScrollReveal';
import { NEXA_ORG, NEXA_WEBSITE, webPage } from '../../components/seo/schemaGraph';
import styles from './Home.module.css';

export default function Home() {
  const { t } = useTranslation('website');
  useScrollReveal();
  const lang = i18n.language || 'mk';
  const isMk = lang === 'mk';
  const url = 'https://nexa.mk/';

  const ECO_EXPLAINERS = [
    {
      icon: 'documents',
      accent: '',
      title: isMk ? 'Експертски контент за вистинските прашања' : 'Expert content on the right questions',
      body:  isMk
        ? 'Секоја сателитска страница покрива конкретна тема — државјанство, имиграција, регистрација на ДОО, интелектуална сопственост, правни прашања за физички лица. Содржината е напишана од професионалци кои работат во таа област.'
        : 'Each satellite site covers a specific topic — citizenship, immigration, company registration, IP, legal Q&A for individuals. Content is written by professionals working in that field.'
    },
    {
      icon: 'globe',
      accent: 'emerald',
      title: isMk ? 'SEO + GEO оптимизирано' : 'SEO + GEO optimized',
      body:  isMk
        ? 'Сите страници се оптимизирани и за класично пребарување (Google) и за AI асистенти (GEO). Кога некој пишува „регистрација на ДОО Скопје" или прашува ChatGPT за македонска имиграција — нашите страници излегуваат како одговор.'
        : 'Every property is tuned for both classic search (Google) and AI assistants (GEO). When someone types "register a DOO in Skopje" or asks ChatGPT about Macedonian immigration — our pages surface as the answer.'
    },
    {
      icon: 'users',
      accent: 'amber',
      title: isMk ? 'Прашањата стигнуваат до Admin корисниците' : 'Inbound leads route to Admin users',
      body:  isMk
        ? 'Кога посетител пополни контакт-форма на било која сателитска страница, прашањето оди до Admin корисниците со соодветна област и град. Прв што ќе го превземе го добива клиентот — без аукции и без посредник.'
        : 'When a visitor fills in a contact form on any satellite site, the lead is routed to Admin users in the matching practice and city. First to claim wins — no auctions, no middleman.'
    }
  ];

  const STEPS = [
    {
      title: isMk ? 'Регистрирајте се за 30 секунди' : 'Sign up in 30 seconds',
      body:  isMk
        ? 'Само корисничко име и лозинка. Без картичка, без обврска. 8 дена целосен пристап до сè.'
        : 'Just a username and password. No card, no commitment. 8 days of full access to everything.'
    },
    {
      title: isMk ? 'Пробајте го Терминалот' : 'Try the Terminal',
      body:  isMk
        ? 'Генерирајте договор за 30 секунди. Анализирајте постоен договор. Спроведете проверка на усогласеност. Прашајте го AI помошникот.'
        : 'Generate a contract in 30 seconds. Analyze an existing contract. Run a compliance check. Ask the AI assistant.'
    },
    {
      title: isMk ? 'Останете кога ќе видите вредност' : 'Stay when you see the value',
      body:  isMk
        ? 'По 8 дена изберете план што ви одговара. Ако не сте задоволни — едноставно не плаќате и сметката се суспендира.'
        : 'After 8 days pick the plan that fits. Not happy — simply don\'t pay and the account suspends.'
    }
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
            {isMk ? 'Деловен екосистем за Северна Македонија' : 'Business ecosystem for North Macedonia'}
          </span>
          <h1 className="nx-fade-in-up nx-d-100">{t('home.heroTitle')}</h1>
          <p className={`${styles.heroSub} nx-fade-in-up nx-d-200`}>{t('home.heroSubtitle')}</p>
          <div className={`${styles.heroCtas} nx-fade-in-up nx-d-300`}>
            <Link to="/login" className="nexa-btn nexa-btn-accent nexa-btn-lg">
              {t('home.ctaTerminal')}
              <Icon name="arrowRight" size={18} />
            </Link>
            <Link to="/pricing" className="nexa-btn nexa-btn-secondary nexa-btn-lg">
              {t('home.ctaProfessionals')}
            </Link>
          </div>
          <p className={`${styles.heroTertiary} nx-fade-in-up nx-d-400`}>
            <Link to="/about">{t('home.ctaSeeHow')}</Link>
          </p>
        </div>
      </section>

      {/* ============ ECOSYSTEM ============ */}
      <section className="nx-section">
        <div className="nexa-container">
          <div className={`${styles.sectionHead} nx-reveal`}>
            <span className="nx-eyebrow">{isMk ? 'Екосистем' : 'Ecosystem'}</span>
            <h2>
              {isMk
                ? 'Шест водич-страници кои носат клиенти. Еден Терминал кој ја држи фирмата.'
                : 'Six guide sites that bring clients. One Terminal that runs the firm.'}
            </h2>
            <p>
              {isMk
                ? 'Покрај Терминалот, Nexa управува со екосистем од сателитски сајтови — секој оптимизиран за конкретно бизнис или правно прашање во Македонија. Тие сајтови ги привлекуваат посетителите. Прашањата што ги испраќаат стигнуваат до Admin корисниците на платформата.'
                : 'Beyond the Terminal, Nexa runs an ecosystem of satellite sites — each optimized for a specific business or legal question in Macedonia. Those sites attract visitors. The questions they send route to Admin users on the platform.'}
            </p>
          </div>

          <div className={styles.featureGrid}>
            {ECO_EXPLAINERS.map((e, i) => (
              <div
                key={e.title}
                className={`nx-card nx-card-hover ${styles.feature} nx-reveal`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <span className={`nx-icon-wrap ${e.accent === 'emerald' ? 'nx-icon-wrap-emerald' : ''} ${e.accent === 'amber' ? 'nx-icon-wrap-amber' : ''}`}>
                  <Icon name={e.icon} size={22} />
                </span>
                <h3>{e.title}</h3>
                <p>{e.body}</p>
              </div>
            ))}
          </div>

          <div className={`nx-reveal ${styles.ecoMapWrap}`}>
            <EcosystemMap />
          </div>
        </div>
      </section>

      {/* ============ TRY THE TERMINAL ============ */}
      <section className="nx-section nx-section-soft">
        <div className="nexa-container">
          <div className={`${styles.sectionHead} nx-reveal`}>
            <span className="nx-eyebrow">{isMk ? 'Започнете' : 'Get started'}</span>
            <h2>{isMk ? '8 дена бесплатно. Без картичка. Без обврска.' : '8 days free. No card. No commitment.'}</h2>
            <p>
              {isMk
                ? 'Пробајте го Терминалот пред да платите. Целосен пристап од прв ден — документи, AI, проверки за усогласеност, анализа на договори.'
                : 'Try the Terminal before paying. Full access from day one — documents, AI, compliance checks, contract analysis.'}
            </p>
          </div>

          <ol className={styles.steps}>
            {STEPS.map((s, i) => (
              <li key={i} className={`nx-reveal ${styles.stepItem}`} style={{ transitionDelay: `${i * 80}ms` }}>
                <div className={styles.stepNum}>{i + 1}</div>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className={`${styles.stepsCta} nx-reveal`}>
            <Link to="/login" className="nexa-btn nexa-btn-accent nexa-btn-lg">
              {isMk ? 'Започни бесплатно' : 'Start free'}
              <Icon name="arrowRight" size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className={`${styles.ctaFinal} nx-section-ink`}>
        <div className="nexa-container">
          <div className={`${styles.ctaInner} nx-reveal`}>
            <h2>{isMk ? 'Подготвени сте да го пробате Терминалот?' : 'Ready to try the Terminal?'}</h2>
            <p>
              {isMk
                ? '8 дена бесплатно. Не бара картичка. Откажете во секое време.'
                : '8 days free. No card required. Cancel any time.'}
            </p>
            <div className={styles.ctaButtons}>
              <Link to="/login" className="nexa-btn nexa-btn-accent nexa-btn-lg">
                {isMk ? 'Започни бесплатно' : 'Start free'}
                <Icon name="arrowRight" size={18} />
              </Link>
              <Link to="/contact" className="nexa-btn nexa-btn-glass nexa-btn-lg">
                {isMk ? 'Контактирај нé' : 'Contact us'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
