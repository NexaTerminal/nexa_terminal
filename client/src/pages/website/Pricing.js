import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import useScrollReveal from '../../hooks/useScrollReveal';
import { getStorefront } from '../../lib/storefront';
import { NEXA_ORG, NEXA_WEBSITE, webPage, terminalProduct } from '../../components/seo/schemaGraph';
import styles from './Pricing.module.css';

// De-merge Phase 2+3 — the pricing page is a SINGLE-offer page per storefront:
//   main  (nexa.mk)       → Product A (Basic)
//   leads (leads.nexa.mk) → Product B (Pro)
// NOTE: Prices are deliberately NOT shown on this public page — they surface
// only in the terminal buy flow (SubscriptionGate) after the user registers and
// picks a plan. This page sells the value + feature set and routes to signup.

export default function Pricing() {
  const { t } = useTranslation('website');
  useScrollReveal();
  const lang = i18n.language || 'mk';
  const isMk = lang === 'mk';
  const url = 'https://nexa.mk/pricing';

  const store = getStorefront();
  const isLeads = store === 'leads';

  // Single offer per storefront (no price shown — chosen & priced in-terminal).
  const offer = isLeads
    ? { key: 'pro',   intent: 'pro' }
    : { key: 'basic', intent: null };

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
      tag:   isMk ? 'За правници и сметководители' : 'For lawyers & accountants',
      title: isMk ? 'Про'                          : 'Pro',
      body:  isMk
        ? 'Нови клиенти од нашата мрежа од специјализирани сајти — плус видливост како експерт.'
        : 'New clients from our network of specialized sites — plus visibility as an expert.',
      featuresHead: isMk ? 'Што добивате' : 'What you get',
      features: isMk ? [
        'Случаи (leads) од нашите сателит сајти — насочени по област и град',
        'Прв кој ќе прифати го добива случајот — без наддавање',
        'Topics Q&A — експертски одговори на јавни прашања што Google и AI ги цитираат',
        '2 блог статии месечно, објавени под Ваше име',
        'Место во месечниот билтен до 1000+ претплатници',
        'Присуство во нашата мрежа и во именикот по област',
        'До 25 клиентски под-сметки — водете ги Вашите клиенти под Вашата претплата',
        'Сите алатки на Терминалот (документи, AI, проверки) вклучени'
      ] : [
        'Cases (leads) from our satellite sites — routed by practice area and city',
        'First to claim wins the case — no bidding',
        'Topics Q&A — expert answers Google and AI assistants cite',
        '2 blog posts per month, published under your name',
        'A spot in the monthly newsletter to 1000+ subscribers',
        'Presence in our network and the practice-area directory',
        'Up to 25 client sub-accounts — manage your clients under your subscription',
        'All Terminal tools (documents, AI, checks) included'
      ]
    }
  };
  const copy = PLAN_COPY[offer.key];

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
              {isMk ? 'Планови' : 'Plans'}
            </span>
            <h1 className={styles.pageIntroTitle}>
              {isLeads
                ? (isMk ? 'Повеќе клиенти. Една претплата.' : 'More clients. One subscription.')
                : (isMk ? 'Сите алатки за Вашиот бизнис.' : 'Every tool for your business.')}
            </h1>
            <p className={styles.pageIntroLead}>
              {isLeads
                ? (isMk
                    ? 'Насочени случаи од нашата мрежа од специјализирани сајти, плус видливост како експерт.'
                    : 'Routed cases from our network of specialized sites, plus visibility as an expert.')
                : (isMk
                    ? 'Документи, AI помош, проверки на усогласеност и алатки за секојдневното работење.'
                    : 'Documents, AI help, compliance checks and everyday operations tools.')}
            </p>
          </header>

          <div className={styles.chooserCards}>
            <Link to={offer.intent ? `/login?intent=${offer.intent}` : '/login'}
                  className={`${styles.chooserCard} ${isLeads ? styles.chooserCardAccent : ''} nx-reveal`}>
              <span className={styles.chooserTag}>{copy.tag}</span>
              <h2 className={styles.chooserCardTitle}>{copy.title}</h2>
              <p className={styles.chooserCardBody}>{copy.body}</p>

              <div className={styles.chooserSubline}>
                {isMk
                  ? 'Регистрирајте се и изберете план — цената и профактурата ги гледате во Терминалот.'
                  : 'Register and choose a plan — you see the price and pro-forma invoice in the Terminal.'}
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
                { n: '2', t: isMk ? 'Изберете план'    : 'Pick a plan',     d: isLeads ? (isMk ? 'Про членство' : 'Pro membership') : (isMk ? 'Основен — годишна претплата' : 'Basic — annual') },
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
