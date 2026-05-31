import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import Icon from '../../components/website/Icon';
import useScrollReveal from '../../hooks/useScrollReveal';
import { NEXA_ORG, NEXA_WEBSITE, webPage, terminalProduct } from '../../components/seo/schemaGraph';
import styles from './Pricing.module.css';

// Nexa 3.0 — two-card public chooser. The detailed price/cycle/feature
// breakdowns live inside the Terminal SubscriptionGate (single source of
// truth for paid signups). The public page presents a binary choice:
// individual SMB (visible price) vs professional network (application-based).
const SMB_PRICE_EUR = 19;

export default function Pricing() {
  const { t } = useTranslation('website');
  useScrollReveal();
  const lang = i18n.language || 'mk';
  const isMk = lang === 'mk';
  const url = 'https://nexa.mk/pricing';

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

          <div className={styles.chooserCards}>
            {/* Card 1 — SMB: Nexa Platform */}
            <Link to="/login" className={`${styles.chooserCard} nx-reveal`}>
              <span className={styles.chooserTag}>{isMk ? 'За бизнисите' : 'For SMBs'}</span>
              <h2 className={styles.chooserCardTitle}>
                {isMk ? 'Nexa Платформа' : 'Nexa Platform'}
              </h2>
              <p className={styles.chooserCardBody}>
                {isMk
                  ? 'Сите алатки на Терминалот за индивидуална употреба — автоматизирани документи, AI помош, проверки за усогласеност, анализа на договори.'
                  : 'All Terminal tools for individual use — automated documents, AI assistance, compliance health checks, contract analysis.'}
              </p>
              <div className={styles.chooserPriceLine}>
                <span className={styles.chooserCurrency}>€</span>
                <span className={styles.chooserPriceNum}>{SMB_PRICE_EUR}</span>
                <span className={styles.chooserPriceSuffix}>{isMk ? '/ месец' : '/ month'}</span>
              </div>
              <div className={styles.chooserSubline}>
                {isMk ? '8 дена бесплатен пробен период, без картичка' : '8-day free trial, no card required'}
              </div>
              <span className={styles.chooserCta}>
                {isMk ? 'Започнете' : 'Get started'} <span aria-hidden>→</span>
              </span>
            </Link>

            {/* Card 2 — Network: application-based, no price shown */}
            <Link to="/login?intent=network" className={`${styles.chooserCard} ${styles.chooserCardAccent} nx-reveal`}>
              <span className={styles.chooserTag}>{isMk ? 'За професионалците' : 'For professionals'}</span>
              <h2 className={styles.chooserCardTitle}>
                {isMk ? 'Nexa Мрежа' : 'Nexa Network'}
              </h2>
              <p className={styles.chooserCardBody}>
                {isMk
                  ? 'Терминалот + членство во Nexa мрежата. Дистрибуција преку билтенот, сателитските сајтови и Topics Q&A. Тим од 5 или 10 под-сметки за Вашите клиенти.'
                  : 'The Terminal plus membership in the Nexa network. Distribution via the newsletter, satellite sites and Topics Q&A. Team of 5 or 10 sub-seats for your clients.'}
              </p>
              <div className={styles.chooserPriceLine}>
                <span className={styles.chooserApplyBased}>
                  {isMk ? 'По апликација' : 'Application-based'}
                </span>
              </div>
              <div className={styles.chooserSubline}>
                {isMk ? 'Оценуваме секоја кандидатура индивидуално' : 'We review each application individually'}
              </div>
              <span className={styles.chooserCta}>
                {isMk ? 'Аплицирајте' : 'Apply'} <span aria-hidden>→</span>
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
