import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import Icon from '../../components/website/Icon';
import useScrollReveal from '../../hooks/useScrollReveal';
import { NEXA_ORG, NEXA_WEBSITE, webPage, terminalProduct } from '../../components/seo/schemaGraph';
import styles from './Pricing.module.css';

// Nexa — two-tier public chooser (Basic + Pro) with EUR/MKD currency toggle.
// EUR is the source of truth (set per the public pricing spec). MKD is
// derived at the documented National Bank parity 1 EUR = 61.5 MKD.
const EUR_TO_MKD = 61.5;
// Prices mirror server/constants/roles.js PLAN_PRICES (single source of truth).
const PLANS_EUR = [
  { key: 'basic', intent: null,  accent: false, prices: { monthly: 19, quarterly: 49, annual: 179 } },
  { key: 'pro',   intent: 'pro', accent: true,  prices: { monthly: 39, quarterly: 99, annual: 359 } }
];

const CYCLE_MONTHS = { monthly: 1, quarterly: 3, annual: 12 };
const savingsPct = (prices, cycle) => {
  if (cycle === 'monthly') return 0;
  const baseline = prices.monthly * CYCLE_MONTHS[cycle];
  return Math.round((1 - prices[cycle] / baseline) * 100);
};

const fmtPrice = (eur, currency) => {
  if (currency === 'mkd') {
    const mkd = Math.round(eur * EUR_TO_MKD);
    // Format with a thin space as thousands separator: "1 169"
    return mkd.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  return String(eur);
};

export default function Pricing() {
  const { t } = useTranslation('website');
  useScrollReveal();
  const lang = i18n.language || 'mk';
  const isMk = lang === 'mk';
  const url = 'https://nexa.mk/pricing';

  const [currency, setCurrency] = useState('eur');     // 'eur' | 'mkd'
  const [cycle, setCycle]       = useState('monthly'); // 'monthly' | 'quarterly' | 'annual'

  const CYCLE_LABEL = isMk
    ? { monthly: 'Месечно', quarterly: 'Квартално', annual: 'Годишно' }
    : { monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual' };
  const CYCLE_SUFFIX = isMk
    ? { monthly: '/ месец', quarterly: '/ квартал', annual: '/ година' }
    : { monthly: '/ month',  quarterly: '/ quarter', annual: '/ year' };
  const CYCLE_SUFFIX_MKD = isMk
    ? { monthly: 'ден / месец', quarterly: 'ден / квартал', annual: 'ден / година' }
    : { monthly: 'MKD / month', quarterly: 'MKD / quarter', annual: 'MKD / year' };

  const PLAN_COPY = {
    basic: {
      tag:   isMk ? 'За бизнисите'        : 'For SMBs',
      title: isMk ? 'Основен'             : 'Basic',
      body:  isMk
        ? 'Сите алатки на Терминалот за Вашата компанија.'
        : 'All Terminal tools for your company.',
      featuresHead: isMk ? 'Што добивате' : 'What you get',
      features: isMk ? [
        'Автоматизирани шаблони (работни односи, договори, безбедност и здравје, лични податоци, сметководствени и др.)',
        'Мои шаблони — прикачете свој .docx и автоматизирајте го',
        'Правен AI помошник',
        'Маркетинг AI помошник',
        'Анализа на договор',
        'Лични AI преференци (тон и стил)',
        'Правна, маркетинг, HR и сајбер проверки на усогласеност',
        'Барање за понуди — побарајте понуди од провајдери',
        'Блог статија на Nexa блогот — 1 месечно, објавена под Ваше име',
        'Банер во Nexa билтенот до 1000+ претплатници — еднаш квартално',
        'Виртуелен саем',
        'Курсеви и едукативни ресурси',
        'До 3 соработници во Вашата компанија'
      ] : [
        'Automated templates (employment, contracts, health & safety, personal data, accounting and more)',
        'My templates — upload your own .docx and automate it',
        'Legal AI assistant',
        'Marketing AI assistant',
        'Contract analysis',
        'Personal AI preferences (tone & style)',
        'Legal, marketing, HR and cybersecurity compliance checks',
        'Request for offers — source quotes from providers',
        'Blog post on the Nexa blog — 1 per month, published under your name',
        'Banner in the Nexa newsletter reaching 1000+ subscribers — once per quarter',
        'Virtual Fair',
        'Courses & learning resources',
        'Up to 3 co-workers in your company'
      ]
    },
    pro: {
      tag:   isMk ? 'За провајдери на услуги' : 'For service providers',
      title: isMk ? 'Про'                      : 'Pro',
      body:  isMk
        ? 'Сè во Основен + членство во Nexa мрежата и до 25 клиентски сметки.'
        : 'Everything in Basic + Nexa Network membership and up to 25 client accounts.',
      featuresHead: isMk ? 'Сè во Основен, плус:' : 'Everything in Basic, plus:',
      features: isMk ? [
        'До 25 клиентски под-сметки — водете ги Вашите клиенти под Вашата претплата',
        'Случаи (leads) добиени преку нашите сателит страни',
        'Виртуелен саем — штанд со Вашите производи или услуги',
        '2 блог статии месечно (наместо 1)',
        'Topics Q&A — експертски одговори на јавни прашања',
        'Барање за понуди (тендер) — давајте понуди на клиентски барања',
        'Уредничко место во месечниот билтен за прифатените блог статии'
      ] : [
        'Up to 25 client sub-accounts — manage your clients under your subscription',
        'Cases (leads) sourced via our satellite sites',
        'Virtual Fair — a booth with your products or services',
        '2 blog posts per month (instead of 1)',
        'Topics Q&A — expert answers to public questions',
        'Request for offers (tender) — respond to client requests',
        'Editorial spot in the monthly newsletter for accepted blog posts'
      ]
    }
  };

  return (
    <PublicLayout>
      <SEOHelmet
        title={t('pricing.seoTitle')}
        description={t('pricing.seoDesc')}
        canonical="/pricing"
        locale={isMk ? 'mk_MK' : 'en_US'}
        altLocale={isMk ? 'en_US' : 'mk_MK'}
        jsonLd={[NEXA_ORG, NEXA_WEBSITE, webPage({ url, name: t('pricing.title'), description: t('pricing.seoDesc'), language: lang }), terminalProduct(lang)]}
      />

      <section className={styles.section}>
        <div className="nexa-container">
          <header className={styles.pageIntro}>
            <span className={styles.pageIntroEyebrow}>
              <span className={styles.pageIntroDot} aria-hidden />
              {isMk ? 'Цени' : 'Pricing'}
            </span>
            <h1 className={styles.pageIntroTitle}>
              {isMk ? 'Изберете што Ви треба од Nexa.' : 'Pick what you need from Nexa.'}
            </h1>
            <p className={styles.pageIntroLead}>
              {isMk
                ? 'Две патеки: алатки за Вашиот бизнис, или членство во професионалната мрежа на Nexa. Започнете кога ќе бидете спремни — можете да го смените изборот во секое време.'
                : 'Two paths: tools for your business, or membership in the Nexa professional network. Start when you are ready — you can switch later any time.'}
            </p>
          </header>

          <div className={styles.toggleStack}>
            <div className={styles.currencyToggle} role="group" aria-label={isMk ? 'Циклус' : 'Billing cycle'}>
              {['monthly', 'quarterly', 'annual'].map(c => (
                <button key={c} type="button"
                  className={`${styles.currencyToggleBtn} ${cycle === c ? styles.currencyToggleBtnActive : ''}`}
                  onClick={() => setCycle(c)}
                  aria-pressed={cycle === c}>
                  {CYCLE_LABEL[c]}
                </button>
              ))}
            </div>

            <div className={styles.currencyToggleWrap} role="group" aria-label={isMk ? 'Валута' : 'Currency'}>
              <div className={styles.currencyToggle}>
                <button type="button"
                  className={`${styles.currencyToggleBtn} ${currency === 'eur' ? styles.currencyToggleBtnActive : ''}`}
                  onClick={() => setCurrency('eur')}
                  aria-pressed={currency === 'eur'}>
                  EUR
                </button>
                <button type="button"
                  className={`${styles.currencyToggleBtn} ${currency === 'mkd' ? styles.currencyToggleBtnActive : ''}`}
                  onClick={() => setCurrency('mkd')}
                  aria-pressed={currency === 'mkd'}>
                  MKD
                </button>
              </div>
              <span className={styles.currencyToggleHint}>
                {isMk ? `1 € = ${EUR_TO_MKD} ден` : `1 € = ${EUR_TO_MKD} MKD`}
              </span>
            </div>
          </div>

          <div className={styles.chooserCards}>
            {PLANS_EUR.map(plan => {
              const copy   = PLAN_COPY[plan.key];
              const to     = plan.intent ? `/login?intent=${plan.intent}` : '/login';
              const priceE = plan.prices[cycle];
              const saving = savingsPct(plan.prices, cycle);
              return (
                <Link key={plan.key}
                      to={to}
                      className={`${styles.chooserCard} ${plan.accent ? styles.chooserCardAccent : ''} nx-reveal`}>
                  <span className={styles.chooserTag}>{copy.tag}</span>
                  <h2 className={styles.chooserCardTitle}>{copy.title}</h2>
                  <p className={styles.chooserCardBody}>{copy.body}</p>

                  <div className={styles.chooserPriceLine}>
                    {currency === 'eur' && <span className={styles.chooserCurrency}>€</span>}
                    <span className={styles.chooserPriceNum}>{fmtPrice(priceE, currency)}</span>
                    <span className={styles.chooserPriceSuffix}>
                      {currency === 'mkd' ? CYCLE_SUFFIX_MKD[cycle] : CYCLE_SUFFIX[cycle]}
                    </span>
                    {saving > 0 && (
                      <span className={styles.chooserSaveBadge}>
                        {isMk ? `−${saving}%` : `Save ${saving}%`}
                      </span>
                    )}
                  </div>
                  <div className={styles.chooserSubline}>
                    {isMk ? 'Без обврска · сменете или откажете во секое време' : 'No commitment · switch or cancel anytime'}
                  </div>

                  {copy.features && copy.features.length > 0 && (
                    <div className={styles.chooserFeatures}>
                      <div className={styles.chooserFeaturesHead}>{copy.featuresHead}</div>
                      <ul className={styles.chooserFeaturesList}>
                        {copy.features.map((f, i) => (
                          <li key={i} className={styles.chooserFeatureItem}>
                            <svg className={styles.chooserFeatureIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <polyline points="5 12 10 17 19 7"/>
                            </svg>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <span className={styles.chooserCta}>
                    {isMk ? 'Започни' : 'Get started'} <span aria-hidden>→</span>
                  </span>
                </Link>
              );
            })}
          </div>

          <p className={styles.footnote}>{t('pricing.footnote')}</p>

          <section className={styles.flow} aria-label={isMk ? 'Како функционира уплатата' : 'How payment works'}>
            <div className={styles.flowHead}>
              <span className={styles.pageIntroEyebrow}>
                <span className={styles.pageIntroDot} aria-hidden />
                {isMk ? 'Како функционира уплатата' : 'How payment works'}
              </span>
              <p className={styles.flowLead}>
                {isMk
                  ? 'Регистрирајте се и изберете план. Ви испраќаме профактура на е-пошта, а со уплатата веднаш го отклучувате користењето на Терминалот.'
                  : 'Register and pick a plan. We email you a pro-forma invoice, and payment unlocks the Terminal immediately.'}
              </p>
            </div>
            <ol className={styles.flowSteps}>
              {[
                { n: '1', t: isMk ? 'Регистрирајте се' : 'Register',        d: isMk ? 'Бесплатно, за неколку минути' : 'Free, in a few minutes' },
                { n: '2', t: isMk ? 'Изберете план'    : 'Pick a plan',     d: isMk ? 'Основен или Про'             : 'Basic or Pro' },
                { n: '3', t: isMk ? 'Прими профактура' : 'Receive invoice', d: isMk ? 'На е-пошта, за Вашето сметководство' : 'By email, for your books' },
                { n: '4', t: isMk ? 'Уплати и користи' : 'Pay and use',     d: isMk ? 'Активирањето е веднашно'      : 'Activation is immediate' }
              ].map((s) => (
                <li key={s.n} className={styles.flowStep}>
                  <span className={styles.flowNum}>{s.n}</span>
                  <div>
                    <div className={styles.flowStepTitle}>{s.t}</div>
                    <div className={styles.flowStepDesc}>{s.d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </section>
    </PublicLayout>
  );
}
