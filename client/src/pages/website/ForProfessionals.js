import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import FaqAccordion from '../../components/website/FaqAccordion';
import ConsentCheckbox from '../../components/website/ConsentCheckbox';
import Icon from '../../components/website/Icon';
import useScrollReveal from '../../hooks/useScrollReveal';
import { NEXA_ORG, NEXA_WEBSITE, webPage, superUserService, faqPage } from '../../components/seo/schemaGraph';
import styles from './ForProfessionals.module.css';

const FAQ_KEYS = ['feeSplit', 'barAssoc', 'howManyLeads', 'cancel', 'clientUse'];
const WHAT_KEYS = [
  { key: 'what1', icon: 'briefcase', accent: '' },
  { key: 'what2', icon: 'trending',  accent: 'emerald' },
  { key: 'what3', icon: 'layers',    accent: 'amber' },
  { key: 'what4', icon: 'star',      accent: '' }
];
const PRACTICE_AREAS = [
  { value: 'consumer-legal',     mk: 'Потрошувачко право',    en: 'Consumer legal' },
  { value: 'immigration',        mk: 'Имиграција',              en: 'Immigration' },
  { value: 'citizenship',        mk: 'Државјанство',            en: 'Citizenship' },
  { value: 'company-registration', mk: 'Регистрација на компании', en: 'Company registration' },
  { value: 'ip-law',             mk: 'Интелектуална сопственост', en: 'IP law' },
  { value: 'tax-accounting',     mk: 'Даноци и сметководство',  en: 'Tax & accounting' },
  { value: 'labor-law',          mk: 'Работно право',           en: 'Labor law' },
  { value: 'general-legal',      mk: 'Општо правно',            en: 'General legal' }
];

export default function ForProfessionals() {
  const { t } = useTranslation('website');
  useScrollReveal();
  const lang = i18n.language || 'mk';
  const url = 'https://nexa.mk/for-professionals';

  const [form, setForm] = useState({
    name: '', firm: '', email: '', city: '', message: '', areas: [], consent: false
  });
  const [status, setStatus] = useState(null);

  const toggleArea = (val) => {
    setForm(f => ({
      ...f,
      areas: f.areas.includes(val) ? f.areas.filter(a => a !== val) : [...f.areas, val]
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.consent) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/leads/inbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceSite: 'nexa',
          practiceArea: 'super-user-application',
          city: form.city,
          language: lang,
          payload: {
            name: form.name, firm: form.firm, email: form.email,
            message: form.message, practiceAreas: form.areas, consent: true
          }
        })
      });
      setStatus(res.ok ? 'ok' : 'error');
    } catch { setStatus('error'); }
  };

  const faqItems = FAQ_KEYS.map(k => ({ q: t(`faq.${k}.q`), a: t(`faq.${k}.a`) }));

  return (
    <PublicLayout>
      <SEOHelmet
        title={t('forPro.seoTitle')}
        description={t('forPro.seoDesc')}
        canonical="/for-professionals"
        locale={lang === 'mk' ? 'mk_MK' : 'en_US'}
        altLocale={lang === 'mk' ? 'en_US' : 'mk_MK'}
        jsonLd={[
          NEXA_ORG, NEXA_WEBSITE,
          webPage({ url, name: t('forPro.heroTitle'), description: t('forPro.seoDesc'), language: lang }),
          superUserService(lang),
          faqPage(faqItems)
        ]}
      />

      {/* ============ HERO ============ */}
      <section className={`nx-hero-dark ${styles.hero}`}>
        <span className="nx-orb nx-orb-1" aria-hidden></span>
        <span className="nx-orb nx-orb-2" aria-hidden></span>
        <span className="nx-orb nx-orb-3" aria-hidden></span>

        <div className={`nexa-container ${styles.heroInner}`}>
          <span className="nx-pill nx-pill-glass nx-fade-in-up">
            <Icon name="users" size={14} />
            {lang === 'mk' ? 'За адвокати, сметководители и консултанти' : 'For lawyers, accountants and consultants'}
          </span>
          <h1 className="nx-fade-in-up nx-d-100">{t('forPro.heroTitle')}</h1>
          <p className={`${styles.heroSub} nx-fade-in-up nx-d-200`}>{t('forPro.heroSub')}</p>
          <div className={`${styles.heroCtas} nx-fade-in-up nx-d-300`}>
            <a href="#apply" className="nexa-btn nexa-btn-accent nexa-btn-lg">
              {t('forPro.ctaCall')} <Icon name="arrowRight" size={18} />
            </a>
            <a href="#what" className="nexa-btn nexa-btn-glass nexa-btn-lg">
              {lang === 'mk' ? 'Што добивате' : 'See what you get'}
            </a>
          </div>
        </div>
      </section>

      {/* ============ WHAT YOU GET ============ */}
      <section id="what" className="nx-section">
        <div className="nexa-container">
          <div className={`${styles.sectionHead} nx-reveal`}>
            <span className="nx-eyebrow">{lang === 'mk' ? 'Што добивате' : 'What you get'}</span>
            <h2>{t('forPro.whatHeading')}</h2>
          </div>
          <div className={styles.whatGrid}>
            {WHAT_KEYS.map((w, i) => (
              <div key={w.key} className={`nx-card nx-card-hover ${styles.whatCard} nx-reveal`} style={{ transitionDelay: `${i * 70}ms` }}>
                <span className={`nx-icon-wrap ${w.accent === 'emerald' ? 'nx-icon-wrap-emerald' : ''} ${w.accent === 'amber' ? 'nx-icon-wrap-amber' : ''}`}>
                  <Icon name={w.icon} size={22} />
                </span>
                <h3>{t(`forPro.${w.key}Title`)}</h3>
                <p>{t(`forPro.${w.key}Desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ECONOMICS QUOTE ============ */}
      <section className={`nx-section nx-section-soft ${styles.quoteSection}`}>
        <div className="nexa-container">
          <div className={`${styles.quoteBox} nx-reveal`}>
            <span className={styles.quoteMark}>"</span>
            <p className={styles.bigQuote}>{t('forPro.economics')}</p>
            <div className={styles.quoteFoot}>
              <Icon name="bolt" size={16} />
              <span>{lang === 'mk' ? 'Економија на членството' : 'Membership economics'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ EXCLUSIVITY ============ */}
      <section className="nx-section">
        <div className="nexa-container">
          <div className={`${styles.exclusivityCard} nx-reveal`}>
            <Icon name="shield" size={36} className={styles.exclusivityIcon} />
            <h2>{t('forPro.exclusivityHeading')}</h2>
            <p>{t('forPro.exclusivity')}</p>
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section className="nx-section nx-section-soft">
        <div className="nexa-container">
          <div className={`${styles.sectionHead} nx-reveal`}>
            <span className="nx-eyebrow">{lang === 'mk' ? 'Цена' : 'Pricing'}</span>
            <h2>{t('forPro.pricingHeading')}</h2>
          </div>
          <div className={styles.priceRow}>
            {[
              { label: t('forPro.pricingMonthly'),   accent: false },
              { label: t('forPro.pricingQuarterly'), accent: true  },
              { label: t('forPro.pricingAnnual'),    accent: false }
            ].map((p, i) => (
              <div key={i} className={`nx-card ${styles.priceCard} ${p.accent ? styles.priceCardAccent : ''} nx-reveal`} style={{ transitionDelay: `${i * 80}ms` }}>
                <Icon name="check" size={18} className={styles.priceCheck} />
                <div className={styles.priceTag}>{p.label}</div>
              </div>
            ))}
          </div>
          <p className={styles.note}>{t('forPro.pricingNote')}</p>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="nx-section">
        <div className="nexa-container">
          <div className={`${styles.sectionHead} nx-reveal`}>
            <span className="nx-eyebrow">{lang === 'mk' ? 'Процес' : 'Process'}</span>
            <h2>{t('forPro.howHeading')}</h2>
          </div>
          <ol className={styles.steps}>
            {[t('forPro.how1'), t('forPro.how2'), t('forPro.how3')].map((label, i) => (
              <li key={i} className={`nx-reveal`} style={{ transitionDelay: `${i * 80}ms` }}>
                <span className={styles.stepCircle}>{i + 1}</span>
                <span className={styles.stepLabel}>{label}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="nx-section nx-section-soft">
        <div className="nexa-container nexa-container-narrow">
          <div className={`${styles.sectionHead} nx-reveal`}>
            <span className="nx-eyebrow">FAQ</span>
            <h2>{t('forPro.faqHeading')}</h2>
          </div>
          <div className="nx-reveal">
            <FaqAccordion items={faqItems} />
          </div>
        </div>
      </section>

      {/* ============ APPLY ============ */}
      <section id="apply" className="nx-section">
        <div className="nexa-container nexa-container-narrow">
          <div className={`${styles.sectionHead} nx-reveal`}>
            <span className="nx-eyebrow">{lang === 'mk' ? 'Аплицирај' : 'Apply'}</span>
            <h2>{t('forPro.applyHeading')}</h2>
          </div>
          {status === 'ok' ? (
            <div className={`${styles.successCard} nx-reveal`}>
              <Icon name="check" size={28} />
              <p>{lang === 'mk' ? 'Апликацијата е примена. Ќе ве контактираме во рок од 2 работни дена.' : 'Application received. We will contact you within 2 business days.'}</p>
            </div>
          ) : (
            <form onSubmit={submit} className={`${styles.form} nx-reveal`}>
              <label>{t('forPro.formName')}
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </label>
              <label>{t('forPro.formFirm')}
                <input required value={form.firm} onChange={e => setForm({...form, firm: e.target.value})} />
              </label>
              <label>{t('contact.email')}
                <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </label>
              <label>{t('forPro.formCity')}
                <input required value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
              </label>
              <fieldset className={styles.areas}>
                <legend>{t('forPro.formPracticeAreas')}</legend>
                {PRACTICE_AREAS.map(a => (
                  <label key={a.value} className={styles.areaItem}>
                    <input type="checkbox" checked={form.areas.includes(a.value)} onChange={() => toggleArea(a.value)} />
                    {lang === 'mk' ? a.mk : a.en}
                  </label>
                ))}
              </fieldset>
              <label>{t('forPro.formMessage')}
                <textarea rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
              </label>
              <ConsentCheckbox checked={form.consent} onChange={(v) => setForm({...form, consent: v})} />
              <button type="submit" disabled={!form.consent || status === 'sending'} className="nexa-btn nexa-btn-accent nexa-btn-lg">
                {status === 'sending' ? (lang === 'mk' ? 'Се испраќа…' : 'Sending…') : t('forPro.formSubmit')}
                <Icon name="arrowRight" size={18} />
              </button>
              {status === 'error' && (
                <p className={styles.err}>{lang === 'mk' ? 'Грешка. Обидете се повторно или пишете на info@nexa.mk.' : 'Error. Please try again or write to info@nexa.mk.'}</p>
              )}
            </form>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
