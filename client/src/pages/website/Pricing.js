import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import Icon from '../../components/website/Icon';
import useScrollReveal from '../../hooks/useScrollReveal';
import { useAuth } from '../../contexts/AuthContext';
import { NEXA_ORG, NEXA_WEBSITE, webPage, terminalProduct, superUserService } from '../../components/seo/schemaGraph';
import styles from './Pricing.module.css';

// Plan registry — shared with the SubscriptionGate modal.
const PLANS = [
  { uiKey: 'plan1', apiPlan: 'standard', role: 'standard_user', features: ['docs','ai','contract','health','market','support'], includesLabel: 'includes' },
  { uiKey: 'plan2', apiPlan: 'admin_5',  role: 'admin_user',    features: ['seats5','leads','topics','newsletter','badge','priority'], includesLabel: 'everythingPlus' },
  { uiKey: 'plan3', apiPlan: 'admin_10', role: 'admin_user',    features: ['seats10','leads','topics','newsletter','badge','priority'], includesLabel: 'everythingPlus' }
];

const PRICES = {
  standard: { monthly: 40,  quarterly: 90,  annual: 360 },
  admin_5:  { monthly: 80,  quarterly: 240, annual: 720 },
  admin_10: { monthly: 150, quarterly: 450, annual: 1350 }
};

const baseline12mo = (apiPlan) => PRICES[apiPlan].monthly * 12;
const annualSpend  = (apiPlan, cycle) => {
  const p = PRICES[apiPlan][cycle];
  if (cycle === 'monthly')   return p * 12;
  if (cycle === 'quarterly') return p * 4;
  return p;
};
const savePercent = (apiPlan, cycle) => cycle === 'monthly' ? 0 :
  Math.round(((baseline12mo(apiPlan) - annualSpend(apiPlan, cycle)) / baseline12mo(apiPlan)) * 100);
const effectiveMonthly = (apiPlan, cycle) => Math.round(annualSpend(apiPlan, cycle) / 12);

export default function Pricing() {
  const { t } = useTranslation('website');
  useScrollReveal();
  const navigate = useNavigate();
  const { currentUser, token } = useAuth();
  const lang = i18n.language || 'mk';
  const url = 'https://nexa.mk/pricing';

  const [cycle, setCycle] = useState('monthly');
  const [requestState, setRequestState] = useState({ plan: null, status: 'idle', message: '' });

  const requestApproval = async (apiPlan) => {
    if (!currentUser) {
      navigate(`/login?signup=1&plan=${apiPlan}&cycle=${cycle}`);
      return;
    }
    // Block role mismatch: standard_user can't subscribe to admin plan; admin_user can't subscribe to standard.
    if (currentUser.role && currentUser.role !== 'admin' &&
        ((currentUser.role === 'standard_user' && apiPlan.startsWith('admin')) ||
         (currentUser.role === 'admin_user'    && apiPlan === 'standard'))) {
      setRequestState({
        plan: apiPlan, status: 'error',
        message: t('pricing.notAvailableForRole')
      });
      return;
    }
    setRequestState({ plan: apiPlan, status: 'sending', message: '' });
    try {
      await axios.post(
        '/api/subscription/request-approval',
        { plan: apiPlan, cycle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequestState({
        plan: apiPlan, status: 'ok',
        message: lang === 'mk'
          ? 'Барањето е примено. Проверете ја вашата е-пошта за инструкциите.'
          : 'Request received. Check your email for payment instructions.'
      });
    } catch (err) {
      setRequestState({
        plan: apiPlan, status: 'error',
        message: err.response?.data?.message || err.message
      });
    }
  };

  const CycleBtn = ({ value, label }) => (
    <button
      type="button"
      className={`${styles.cycleBtn} ${cycle === value ? styles.cycleBtnActive : ''}`}
      onClick={() => setCycle(value)}
      aria-pressed={cycle === value}
    >
      {label}
      {value === 'annual' && <span className={styles.cycleHint}>−25%</span>}
    </button>
  );

  const Card = ({ uiKey, apiPlan, role, features, includesLabel, accent }) => {
    const price = PRICES[apiPlan][cycle];
    const suffix = cycle === 'monthly' ? t('pricing.perMonth')
                 : cycle === 'quarterly' ? t('pricing.perQuarter')
                 : t('pricing.perYear');
    const save = savePercent(apiPlan, cycle);
    const eff = effectiveMonthly(apiPlan, cycle);
    const roleMismatch = !!currentUser && currentUser.role && currentUser.role !== 'admin' &&
      ((currentUser.role === 'standard_user' && role === 'admin_user') ||
       (currentUser.role === 'admin_user'    && role === 'standard_user'));
    const isLoading = requestState.plan === apiPlan && requestState.status === 'sending';
    const isDone    = requestState.plan === apiPlan && requestState.status === 'ok';
    const isErr     = requestState.plan === apiPlan && requestState.status === 'error';

    return (
      <div className={`${styles.card} ${accent ? styles.cardAccent : ''} ${roleMismatch ? styles.cardMuted : ''}`}>
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
            <span className={styles.priceSuffix}>{suffix}</span>
          </div>
          <div className={styles.priceMeta}>
            <span>{t(`pricing.billedAs.${cycle}`)}</span>
            {cycle !== 'monthly' && (
              <span className={styles.eff}>{t('pricing.effective', { value: eff })}</span>
            )}
            {save > 0 && (
              <span className={styles.saveTag}>{t('pricing.save', { percent: save })}</span>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={isLoading || isDone || roleMismatch}
          onClick={() => requestApproval(apiPlan)}
          className={`nexa-btn ${accent ? 'nexa-btn-accent' : 'nexa-btn-primary'} ${styles.cta}`}
        >
          {roleMismatch ? t('pricing.notAvailableForRole') :
           isLoading ? '…' : isDone ? '✓' : t(`pricing.${uiKey}.cta`)}
        </button>
        {(isDone || isErr) && (
          <div className={isErr ? styles.ctaError : styles.ctaSuccess}>{requestState.message}</div>
        )}

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
      </div>
    );
  };

  return (
    <PublicLayout>
      <SEOHelmet
        title={t('pricing.seoTitle')}
        description={t('pricing.seoDesc')}
        canonical="/pricing"
        locale={lang === 'mk' ? 'mk_MK' : 'en_US'}
        altLocale={lang === 'mk' ? 'en_US' : 'mk_MK'}
        jsonLd={[NEXA_ORG, NEXA_WEBSITE, webPage({ url, name: t('pricing.title'), description: t('pricing.seoDesc'), language: lang }), terminalProduct(lang), superUserService(lang)]}
      />

      <section className={`nx-hero-aurora ${styles.hero}`}>
        <span className="nx-orb nx-orb-1" aria-hidden></span>
        <span className="nx-orb nx-orb-2" aria-hidden></span>
        <div className={`nexa-container ${styles.heroInner}`}>
          <span className="nx-pill nx-fade-in-up">
            <Icon name="bolt" size={14} />
            {lang === 'mk' ? 'Транспарентни цени' : 'Transparent pricing'}
          </span>
          <h1 className="nx-fade-in-up nx-d-100">{t('pricing.title')}</h1>
          <p className="nx-fade-in-up nx-d-200">{t('pricing.intro')}</p>
        </div>
      </section>

      <section className={styles.section}>
        <div className="nexa-container">
          <div className={styles.cycleWrap} role="group" aria-label="Billing cycle">
            <CycleBtn value="monthly"   label={t('pricing.billing.monthly')} />
            <CycleBtn value="quarterly" label={t('pricing.billing.quarterly')} />
            <CycleBtn value="annual"    label={t('pricing.billing.annual')} />
          </div>

          <div className={styles.cards}>
            <Card {...PLANS[0]} />
            <Card {...PLANS[1]} accent />
            <Card {...PLANS[2]} />
          </div>

          <p className={styles.footnote}>{t('pricing.footnote')}</p>
        </div>
      </section>
    </PublicLayout>
  );
}
