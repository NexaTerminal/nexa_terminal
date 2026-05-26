import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import useScrollReveal from '../../hooks/useScrollReveal';
import { NEXA_ORG, NEXA_WEBSITE, webPage, terminalProduct, superUserService } from '../../components/seo/schemaGraph';
import styles from './Pricing.module.css';

// Three plans. All start with the same trial flow — visitor clicks the card,
// lands on /login, signs up, runs the 8-day trial, then picks plan from inside.
const PLANS = [
  { uiKey: 'plan1', apiPlan: 'standard',
    features: ['docs', 'news', 'compliance', 'operative', 'marketing', 'contract', 'ai'],
    includesLabel: 'includes' },
  { uiKey: 'plan2', apiPlan: 'admin_5',
    features: ['seats5', 'docsUnlimited', 'newsletter', 'satellites', 'topics', 'priority'],
    includesLabel: 'everythingPlus' },
  { uiKey: 'plan3', apiPlan: 'admin_10',
    features: ['seats10', 'docsUnlimited', 'newsletter', 'satellites', 'topics', 'creditPool', 'priority'],
    includesLabel: 'everythingPlus' }
];

// EUR prices using psychological 9-endings. Quarterly ≈ −15%, Annual ≈ −24%.
const PRICES = {
  standard: { monthly: 39,  quarterly: 99,  annual: 359  },
  admin_5:  { monthly: 79,  quarterly: 199, annual: 719  },
  admin_10: { monthly: 149, quarterly: 379, annual: 1349 }
};

const baseline12mo  = (p) => PRICES[p].monthly * 12;
const annualSpend   = (p, c) => c === 'monthly' ? PRICES[p].monthly * 12
                              : c === 'quarterly' ? PRICES[p].quarterly * 4
                              : PRICES[p].annual;
const savePercent   = (p, c) => c === 'monthly' ? 0
  : Math.round(((baseline12mo(p) - annualSpend(p, c)) / baseline12mo(p)) * 100);
const effectiveMonthly = (p, c) => Math.round(annualSpend(p, c) / 12);

export default function Pricing() {
  const { t } = useTranslation('website');
  useScrollReveal();
  const lang = i18n.language || 'mk';
  const isMk = lang === 'mk';
  const url = 'https://nexa.mk/pricing';

  const [cycle, setCycle] = useState('monthly');

  const CycleBtn = ({ value, label }) => (
    <button
      type="button"
      className={`${styles.cycleBtn} ${cycle === value ? styles.cycleBtnActive : ''}`}
      onClick={() => setCycle(value)}
      aria-pressed={cycle === value}
    >
      {label}
      {value === 'quarterly' && <span className={styles.cycleHint}>−15%</span>}
      {value === 'annual'    && <span className={styles.cycleHint}>−24%</span>}
    </button>
  );

  const billedAs = isMk
    ? { monthly: 'месечно',  quarterly: 'квартално', annual: 'годишно' }
    : { monthly: 'monthly',  quarterly: 'quarterly', annual: 'yearly' };
  const suffixFor = (c) => c === 'monthly'   ? (isMk ? '/месец'   : '/month')
                         : c === 'quarterly' ? (isMk ? '/квартал' : '/quarter')
                         :                     (isMk ? '/година'  : '/year');

  const Card = ({ uiKey, apiPlan, features, includesLabel, accent }) => {
    const price = PRICES[apiPlan][cycle];
    const save  = savePercent(apiPlan, cycle);
    const eff   = effectiveMonthly(apiPlan, cycle);

    return (
      <Link
        to="/login"
        className={`${styles.card} ${accent ? styles.cardAccent : ''}`}
        aria-label={t(`pricing.${uiKey}.name`)}
      >
        <div className={styles.cardHead}>
          <div className={styles.planMeta}>
            <h3>{t(`pricing.${uiKey}.name`)}</h3>
            <p>{t(`pricing.${uiKey}.tagline`)}</p>
          </div>
          {accent && <span className={styles.popular}>{t('pricing.popular')}</span>}
        </div>

        <div className={styles.priceBlock}>
          <div className={styles.priceLine}>
            <span className={styles.currency}>€</span>
            <span className={styles.priceNum}>{price}</span>
            <span className={styles.priceSuffix}>{suffixFor(cycle)}</span>
          </div>
          <div className={styles.priceMeta}>
            <span>{billedAs[cycle]}</span>
            {cycle !== 'monthly' && (
              <span className={styles.eff}>{isMk ? `≈ €${eff}/месец` : `≈ €${eff}/month`}</span>
            )}
            {save > 0 && (
              <span className={styles.saveTag}>{isMk ? `Заштеда ${save}%` : `Save ${save}%`}</span>
            )}
          </div>
        </div>

        <div className={styles.includes}>
          <div className={styles.includesLabel}>{t(`pricing.${includesLabel}`)}</div>
          <ul className={styles.featureList}>
            {features.map(f => (
              <li key={f}>
                <svg className={styles.check} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{t(`pricing.features.${f}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <span className={styles.trialBanner}>
          {isMk ? 'Пробајте бесплатен период, без обврска' : 'Try the free period, no commitment'}
          <span className={styles.trialArrow} aria-hidden>→</span>
        </span>
      </Link>
    );
  };

  return (
    <PublicLayout>
      <SEOHelmet
        title={t('pricing.seoTitle')}
        description={t('pricing.seoDesc')}
        canonical="/pricing"
        locale={isMk ? 'mk_MK' : 'en_US'}
        altLocale={isMk ? 'en_US' : 'mk_MK'}
        jsonLd={[NEXA_ORG, NEXA_WEBSITE, webPage({ url, name: t('pricing.title'), description: t('pricing.seoDesc'), language: lang }), terminalProduct(lang), superUserService(lang)]}
      />

      <section className={styles.section}>
        <div className="nexa-container">
          <header className={styles.pageIntro}>
            <span className={styles.pageIntroEyebrow}>
              <span className={styles.pageIntroDot} aria-hidden />
              {isMk ? 'Цени' : 'Pricing'}
            </span>
            <h1 className={styles.pageIntroTitle}>
              {isMk ? 'Едноставни тарифи. Без изненадувања.' : 'Simple plans. No surprises.'}
            </h1>
            <p className={styles.pageIntroLead}>
              {isMk
                ? 'Започнете со 8-дневен пробен период. Изберете план кога ќе бидете спремни — можете да го смените во секое време.'
                : 'Start with an 8-day trial. Pick a plan when you are ready — you can change it any time.'}
            </p>
          </header>

          <div className={styles.cycleWrap} role="group" aria-label="Billing cycle">
            <CycleBtn value="monthly"   label={isMk ? 'Месечно'   : 'Monthly'} />
            <CycleBtn value="quarterly" label={isMk ? 'Квартално' : 'Quarterly'} />
            <CycleBtn value="annual"    label={isMk ? 'Годишно'   : 'Yearly'} />
          </div>

          <div className={styles.cards}>
            <Card {...PLANS[0]} />
            <Card {...PLANS[1]} accent />
            <Card {...PLANS[2]} />
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
