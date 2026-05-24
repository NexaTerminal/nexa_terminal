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

const FEATURES = [
  { key: 'feature1', icon: 'documents', accent: '' },
  { key: 'feature2', icon: 'ai',        accent: 'emerald' },
  { key: 'feature3', icon: 'shield',    accent: 'amber' },
  { key: 'feature4', icon: 'briefcase', accent: '' }
];

const STATS = [
  { k: 'templates',  value: '50+',  label: { mk: 'правни шаблони',         en: 'legal templates' } },
  { k: 'modules',    value: '4',    label: { mk: 'модули за усогласеност', en: 'compliance modules' } },
  { k: 'sites',      value: '7',    label: { mk: 'поврзани платформи',     en: 'connected properties' } },
  { k: 'languages',  value: '2',    label: { mk: 'јазици (MK · EN)',       en: 'languages (MK · EN)' } }
];

export default function Home() {
  const { t } = useTranslation('website');
  useScrollReveal();
  const lang = i18n.language || 'mk';
  const url = 'https://nexa.mk/';

  return (
    <PublicLayout>
      <SEOHelmet
        title={t('home.seoTitle')}
        description={t('home.seoDesc')}
        canonical="/"
        locale={lang === 'mk' ? 'mk_MK' : 'en_US'}
        altLocale={lang === 'mk' ? 'en_US' : 'mk_MK'}
        jsonLd={[NEXA_ORG, NEXA_WEBSITE, webPage({ url, name: 'Nexa', description: t('home.seoDesc'), language: lang })]}
      />

      {/* ============ HERO ============ */}
      <section className={`${styles.hero} nx-hero-aurora`}>
        <span className="nx-orb nx-orb-1" aria-hidden></span>
        <span className="nx-orb nx-orb-2" aria-hidden></span>

        <div className={`nexa-container ${styles.heroInner}`}>
          <span className={`nx-pill ${styles.heroPill} nx-fade-in-up`}>
            <Icon name="globe" size={14} />
            {lang === 'mk' ? 'Деловен екосистем за Северна Македонија' : 'Business ecosystem for North Macedonia'}
          </span>
          <h1 className="nx-fade-in-up nx-d-100">{t('home.heroTitle')}</h1>
          <p className={`${styles.heroSub} nx-fade-in-up nx-d-200`}>{t('home.heroSubtitle')}</p>
          <div className={`${styles.heroCtas} nx-fade-in-up nx-d-300`}>
            <Link to="/login" className="nexa-btn nexa-btn-accent nexa-btn-lg">
              {t('home.ctaTerminal')}
              <Icon name="arrowRight" size={18} />
            </Link>
            <Link to="/for-professionals" className="nexa-btn nexa-btn-secondary nexa-btn-lg">
              {t('home.ctaProfessionals')}
            </Link>
          </div>
          <p className={`${styles.heroTertiary} nx-fade-in-up nx-d-400`}>
            <Link to="/about">{t('home.ctaSeeHow')}</Link>
          </p>

          <div className={`${styles.stats} nx-fade-in-up nx-d-500`}>
            {STATS.map(s => (
              <div key={s.k} className={styles.stat}>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label[lang === 'mk' ? 'mk' : 'en']}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ECOSYSTEM MAP ============ */}
      <section className="nx-section">
        <div className="nexa-container">
          <div className={`${styles.sectionHead} nx-reveal`}>
            <span className="nx-eyebrow">{lang === 'mk' ? 'Екосистем' : 'Ecosystem'}</span>
            <h2>{t('home.ecosystemHeading')}</h2>
            <p>
              {lang === 'mk'
                ? 'Седум платформи дизајнирани да работат заедно — една платена сметка, целосна вредност.'
                : 'Seven properties designed to work together — one paid account, the whole stack.'}
            </p>
          </div>
          <div className="nx-reveal">
            <EcosystemMap />
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="nx-section nx-section-soft">
        <div className="nexa-container">
          <div className={`${styles.sectionHead} nx-reveal`}>
            <span className="nx-eyebrow">{lang === 'mk' ? 'Терминал' : 'Terminal'}</span>
            <h2>{t('home.terminalHeading')}</h2>
            <p>
              {lang === 'mk'
                ? 'Сè што ви треба за управување со деловното работење — на едно место, без пишување нула.'
                : 'Everything you need to run business operations — in one place, zero boilerplate.'}
            </p>
          </div>
          <div className={styles.featureGrid}>
            {FEATURES.map((f, i) => (
              <div key={f.key} className={`nx-card nx-card-hover ${styles.feature} nx-reveal`} style={{ transitionDelay: `${i * 60}ms` }}>
                <span className={`nx-icon-wrap ${f.accent === 'emerald' ? 'nx-icon-wrap-emerald' : ''} ${f.accent === 'amber' ? 'nx-icon-wrap-amber' : ''}`}>
                  <Icon name={f.icon} size={22} />
                </span>
                <h3>{t(`home.${f.key}Title`)}</h3>
                <p>{t(`home.${f.key}Desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ AUDIENCE SPLIT ============ */}
      <section className="nx-section">
        <div className="nexa-container">
          <div className={`${styles.sectionHead} nx-reveal`}>
            <span className="nx-eyebrow">{lang === 'mk' ? 'За кого' : 'Audience'}</span>
            <h2>{t('home.audienceHeading')}</h2>
          </div>
          <div className={styles.audienceGrid}>
            <div className={`nx-card nx-card-hover ${styles.audienceCard} nx-reveal`}>
              <span className="nx-icon-wrap"><Icon name="building" size={22} /></span>
              <h3>{t('home.audienceBusinessTitle')}</h3>
              <p>{t('home.audienceBusinessDesc')}</p>
              <Link to="/login" className="nexa-btn nexa-btn-secondary">
                {t('home.audienceBusinessCta')} <Icon name="arrowRight" size={16} />
              </Link>
            </div>
            <div className={`nx-card nx-card-hover ${styles.audienceCard} ${styles.audienceCardPro} nx-reveal`} style={{ transitionDelay: '120ms' }}>
              <span className="nx-icon-wrap"><Icon name="users" size={22} /></span>
              <h3>{t('home.audienceProTitle')}</h3>
              <p>{t('home.audienceProDesc')}</p>
              <Link to="/for-professionals" className="nexa-btn nexa-btn-accent">
                {t('home.audienceProCta')} <Icon name="arrowRight" size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="nx-section nx-section-soft">
        <div className="nexa-container">
          <div className={`${styles.sectionHead} nx-reveal`}>
            <span className="nx-eyebrow">{lang === 'mk' ? 'Како функционира' : 'How it works'}</span>
            <h2>{lang === 'mk' ? 'Од регистрација до резултат за помалку од 8 минути' : 'From signup to result in under 8 minutes'}</h2>
          </div>
          <ol className={styles.steps}>
            {[
              {
                title: lang === 'mk' ? 'Регистрирајте се' : 'Sign up',
                body:  lang === 'mk' ? 'Изберете план при регистрација. Добивате 8-дневен пробен период без обврска.' : 'Pick a plan at signup. You get an 8-day trial, no commitment.'
              },
              {
                title: lang === 'mk' ? 'Генерирајте документ' : 'Generate a document',
                body:  lang === 'mk' ? 'Изберете шаблон, пополнете го формуларот, преземете го готовиот DOCX.' : 'Choose a template, fill the form, download a ready-to-sign DOCX.'
              },
              {
                title: lang === 'mk' ? 'Прашајте го AI помошникот' : 'Ask the AI assistant',
                body:  lang === 'mk' ? 'Анализирајте договор за ризик, проверете го работниот односс или поставете правно прашање.' : 'Analyze a contract for risk, review employment terms, ask a legal question.'
              },
              {
                title: lang === 'mk' ? 'Поврзете се со професионалец' : 'Connect with a professional',
                body:  lang === 'mk' ? 'Кога ви треба човек — маркетплејсот ви открива проверени адвокати и сметководители.' : 'When you need a human — the marketplace surfaces verified lawyers and accountants.'
              }
            ].map((s, i) => (
              <li key={i} className={`nx-reveal ${styles.stepItem}`} style={{ transitionDelay: `${i * 80}ms` }}>
                <div className={styles.stepNum}>{i + 1}</div>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ PRICING TEASER ============ */}
      <section className="nx-section">
        <div className="nexa-container">
          <div className={`${styles.sectionHead} nx-reveal`}>
            <span className="nx-eyebrow">{lang === 'mk' ? 'Цени' : 'Pricing'}</span>
            <h2>{t('home.pricingTeaserHeading')}</h2>
            <p>
              {lang === 'mk'
                ? 'Транспарентни планови. Без скриени трошоци, без обврска, можете да откажете во секое време.'
                : 'Transparent plans. No hidden fees, no commitment, cancel any time.'}
            </p>
          </div>
          <div className={styles.pricingGrid}>
            <div className={`nx-card ${styles.priceCard} nx-reveal`}>
              <h3>{t('pricing.plan1.name')}</h3>
              <div className={styles.priceTag}>€40<span className={styles.priceTagSuffix}>{t('pricing.perMonth')}</span></div>
              <p>{t('pricing.plan1.tagline')}</p>
              <Link to="/pricing" className="nexa-btn nexa-btn-secondary">
                {t('pricing.title')} <Icon name="arrowRight" size={16} />
              </Link>
            </div>
            <div className={`nx-card ${styles.priceCard} ${styles.priceCardAccent} nx-reveal`} style={{ transitionDelay: '120ms' }}>
              <span className={styles.popularBadge}>
                <Icon name="star" size={12} /> {lang === 'mk' ? 'Најфлексибилен' : 'Most flexible'}
              </span>
              <h3>{t('pricing.plan2.name')}</h3>
              <div className={styles.priceTag}>€80<span className={styles.priceTagSuffix}>{t('pricing.perMonth')}</span></div>
              <p>{t('pricing.plan2.tagline')}</p>
              <Link to="/pricing" className="nexa-btn nexa-btn-accent">
                {t('pricing.title')} <Icon name="arrowRight" size={16} />
              </Link>
            </div>
            <div className={`nx-card ${styles.priceCard} nx-reveal`} style={{ transitionDelay: '240ms' }}>
              <h3>{t('pricing.plan3.name')}</h3>
              <div className={styles.priceTag}>€150<span className={styles.priceTagSuffix}>{t('pricing.perMonth')}</span></div>
              <p>{t('pricing.plan3.tagline')}</p>
              <Link to="/pricing" className="nexa-btn nexa-btn-secondary">
                {t('pricing.title')} <Icon name="arrowRight" size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className={`${styles.ctaFinal} nx-section-ink`}>
        <div className="nexa-container">
          <div className={`${styles.ctaInner} nx-reveal`}>
            <h2>{lang === 'mk' ? 'Подготвени сте да го пробате Терминалот?' : 'Ready to try the Terminal?'}</h2>
            <p>
              {lang === 'mk'
                ? '8 дена бесплатно. Не бара картичка. Откажете во секое време.'
                : '8 days free. No card required. Cancel any time.'}
            </p>
            <div className={styles.ctaButtons}>
              <Link to="/login" className="nexa-btn nexa-btn-accent nexa-btn-lg">
                {lang === 'mk' ? 'Започни бесплатно' : 'Start free'}
                <Icon name="arrowRight" size={18} />
              </Link>
              <Link to="/contact" className="nexa-btn nexa-btn-glass nexa-btn-lg">
                {lang === 'mk' ? 'Контактирај нé' : 'Contact us'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
