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

// Nexa 3.0 — three-plan public chooser with EUR/MKD currency toggle.
// EUR is the source of truth (set per the public pricing spec). MKD is
// derived at the documented National Bank parity 1 EUR = 61.5 MKD.
const EUR_TO_MKD = 61.5;
// Prices mirror server/constants/roles.js PLAN_PRICES (single source of truth).
const PLANS_EUR = [
  { key: 'platform', intent: null,      accent: false, prices: { monthly: 19, quarterly: 49,  annual: 179 } },
  { key: 'kantora',  intent: 'kantora', accent: true,  prices: { monthly: 39, quarterly: 99,  annual: 359 } },
  { key: 'studio',   intent: 'studio',  accent: false, prices: { monthly: 59, quarterly: 149, annual: 549 } }
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
    platform: {
      tag:   isMk ? 'За бизнисите'        : 'For SMBs',
      title: isMk ? 'Основен'             : 'Basic',
      body:  isMk
        ? 'Сите алатки на Терминалот за индивидуална употреба.'
        : 'All Terminal tools for individual use.',
      featuresHead: isMk ? 'Што добивате' : 'What you get',
      features: isMk ? [
        'Автоматизирани шаблони (работни односи, договори, безбедност и здравје, лични податоци, сметководствени и др.)',
        'Мои шаблони — прикачете свој .docx и автоматизирајте го',
        'Правен AI помошник',
        'Маркетинг AI помошник',
        'Анализа на договор',
        'Лични AI преференци (тон и стил)',
        'Правна проверка на усогласеност',
        'Маркетинг проверка',
        'HR и оперативна проверка',
        'Сајбер безбедност проверка',
        'Курсеви и едукативни ресурси'
      ] : [
        'Automated templates (employment, contracts, health & safety, personal data, accounting and more)',
        'My templates — upload your own .docx and automate it',
        'Legal AI assistant',
        'Marketing AI assistant',
        'Contract analysis',
        'Personal AI preferences (tone & style)',
        'Legal compliance check',
        'Marketing compliance check',
        'HR & operations compliance check',
        'Cybersecurity check',
        'Courses & learning resources'
      ]
    },
    kantora: {
      tag:   isMk ? 'За кантори / тимови'  : 'For small teams',
      title: isMk ? 'Про'                  : 'Pro',
      body:  isMk
        ? 'Сè во Основен + членство во Nexa мрежата.'
        : 'Everything in Basic + Nexa Network membership.',
      featuresHead: isMk ? 'Сè во Основен, плус:' : 'Everything in Basic, plus:',
      features: isMk ? [
        'До 5 под-корисници',
        'Месечна Nexa блог позиција',
        'Случаи (leads) добиени преку нашите сателит страни',
        'Виртуелен саем — штанд со Вашите производи или услуги',
        'Барање за понуди (тендер) — 1 барање и 1 измена месечно',
        'Позиција во Nexa Newsletter'
      ] : [
        'Up to 5 sub-users',
        'Monthly Nexa blog placement',
        'Cases (leads) sourced via our satellite sites',
        'Virtual Fair — a booth with your products or services',
        'Request for offers (tender) — 1 request and 1 edit per month',
        'Placement in the Nexa Newsletter'
      ]
    },
    studio: {
      tag:   isMk ? 'За канцеларии / студиа' : 'For studios',
      title: isMk ? 'Ултра'                  : 'Ultra',
      body:  isMk
        ? 'Сè во Про, со поголеми квоти и Topics Q&A.'
        : 'Everything in Pro, with larger quotas and Topics Q&A.',
      featuresHead: isMk ? 'Сè во Про, плус:' : 'Everything in Pro, plus:',
      features: isMk ? [
        'До 10 под-корисници',
        'Барање за понуди (тендер) — 3 барања и 3 измени месечно',
        'Topics Q&A — експертски одговори на јавни прашања'
      ] : [
        'Up to 10 sub-users',
        'Request for offers (tender) — 3 requests and 3 edits per month',
        'Topics Q&A — expert answers to public questions'
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
                    {isMk ? '8 дена бесплатен пробен период, без картичка' : '8-day free trial, no card required'}
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
                    {isMk ? 'Пробај бесплатно' : 'Try free'} <span aria-hidden>→</span>
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
                  ? 'По регистрацијата добивате бесплатен пристап до Терминалот. Во рамки на или по пробниот период, по избор на план, Ви испраќаме профактура. Со уплатата веднаш го отклучувате користењето.'
                  : 'After signup you get free access to the Terminal. During or after the trial, when you choose a plan, we issue a pro-forma invoice. Payment unlocks usage immediately.'}
              </p>
            </div>
            <ol className={styles.flowSteps}>
              {[
                { n: '1', t: isMk ? 'Пробен период'    : 'Trial',          d: isMk ? '8 дена, без картичка'        : '8 days, no card' },
                { n: '2', t: isMk ? 'Изберете план'    : 'Pick a plan',    d: isMk ? 'Кога ќе бидете спремни'      : 'When you are ready' },
                { n: '3', t: isMk ? 'Прими профактура' : 'Receive invoice', d: isMk ? 'На е-пошта, за Вашето сметководство' : 'By email, for your books' },
                { n: '4', t: isMk ? 'Уплати и користи' : 'Pay and use',    d: isMk ? 'Активирањето е веднашно'      : 'Activation is immediate' }
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
