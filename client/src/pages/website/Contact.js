import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import i18n from '../../i18n/i18n';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import ConsentCheckbox from '../../components/website/ConsentCheckbox';
import Icon from '../../components/website/Icon';
import useScrollReveal from '../../hooks/useScrollReveal';
import { NEXA_ORG, NEXA_WEBSITE, contactPage } from '../../components/seo/schemaGraph';
import styles from './Contact.module.css';

export default function Contact() {
  const { t } = useTranslation('website');
  useScrollReveal();
  const lang = i18n.language || 'mk';
  const url = 'https://nexa.mk/contact';
  const params = new URLSearchParams(useLocation().search);
  const defaultType = params.get('type') === 'super-user' ? 'B' : 'general';

  const [form, setForm] = useState({
    type: defaultType, name: '', email: '', phone: '', message: '', consent: false
  });
  const [status, setStatus] = useState(null);

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
          practiceArea: form.type === 'B' ? 'super-user-application' : 'general-legal',
          city: '',
          language: lang,
          payload: { name: form.name, email: form.email, phone: form.phone, message: form.message, inquiryType: form.type, consent: true }
        })
      });
      setStatus(res.ok ? 'ok' : 'error');
    } catch { setStatus('error'); }
  };

  return (
    <PublicLayout>
      <SEOHelmet
        title={t('contact.seoTitle')}
        description={t('contact.seoDesc')}
        canonical="/contact"
        locale={lang === 'mk' ? 'mk_MK' : 'en_US'}
        altLocale={lang === 'mk' ? 'en_US' : 'mk_MK'}
        jsonLd={[NEXA_ORG, NEXA_WEBSITE, contactPage({ url, language: lang })]}
      />

      <section className={`nx-hero-aurora ${styles.hero}`}>
        <span className="nx-orb nx-orb-1" aria-hidden></span>
        <span className="nx-orb nx-orb-2" aria-hidden></span>
        <div className={`nexa-container ${styles.heroInner}`}>
          <span className="nx-pill nx-fade-in-up">
            <Icon name="mail" size={14} />
            {lang === 'mk' ? 'Контакт' : 'Get in touch'}
          </span>
          <h1 className="nx-fade-in-up nx-d-100">{t('contact.title')}</h1>
        </div>
      </section>

      {/* Contact methods cards */}
      <section className="nx-section">
        <div className="nexa-container">
          <div className={styles.methodGrid}>
            <a href="mailto:info@nexa.mk" className={`nx-card nx-card-hover ${styles.methodCard} nx-reveal`}>
              <span className="nx-icon-wrap"><Icon name="mail" size={22} /></span>
              <h3>{lang === 'mk' ? 'Е-пошта' : 'Email'}</h3>
              <p>info@nexa.mk</p>
              <span className={styles.methodHint}>{lang === 'mk' ? 'Одговараме во 2 работни дена' : 'We reply within 2 business days'}</span>
            </a>
            <a href="tel:+38978534258" className={`nx-card nx-card-hover ${styles.methodCard} nx-reveal`} style={{ transitionDelay: '80ms' }}>
              <span className="nx-icon-wrap nx-icon-wrap-emerald"><Icon name="phone" size={22} /></span>
              <h3>{lang === 'mk' ? 'Телефон' : 'Phone'}</h3>
              <p>+389 78 534 258</p>
              <span className={styles.methodHint}>{lang === 'mk' ? 'Пон–Пет · 09:00–17:00' : 'Mon–Fri · 09:00–17:00'}</span>
            </a>
            <div className={`nx-card ${styles.methodCard} nx-reveal`} style={{ transitionDelay: '160ms' }}>
              <span className="nx-icon-wrap nx-icon-wrap-amber"><Icon name="pin" size={22} /></span>
              <h3>{lang === 'mk' ? 'Канцеларија' : 'Office'}</h3>
              <p>{t('contact.officeAddress')}</p>
              <span className={styles.methodHint}>{lang === 'mk' ? 'Само со закажување' : 'By appointment'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="nx-section nx-section-soft">
        <div className="nexa-container nexa-container-narrow">
          <div className={`${styles.formHead} nx-reveal`}>
            <span className="nx-eyebrow">{lang === 'mk' ? 'Пишете ни' : 'Write to us'}</span>
            <h2>{lang === 'mk' ? 'Имате прашање или предлог?' : 'Have a question or proposal?'}</h2>
          </div>
          {status === 'ok' ? (
            <div className={`${styles.successCard} nx-reveal`}>
              <Icon name="check" size={28} />
              <p>{lang === 'mk' ? 'Пораката е примена. Ќе одговориме во рок од два работни дена.' : 'Message received. We will reply within two business days.'}</p>
            </div>
          ) : (
            <form onSubmit={submit} className={`${styles.form} nx-reveal`}>
              <label>{t('contact.typeLabel')}
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="general">{t('contact.typeGeneral')}</option>
                  <option value="A">{t('contact.typeA')}</option>
                  <option value="B">{t('contact.typeB')}</option>
                </select>
              </label>
              <div className={styles.row2}>
                <label>{t('contact.name')}
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </label>
                <label>{t('contact.email')}
                  <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </label>
              </div>
              <label>{t('contact.phone')}
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </label>
              <label>{t('contact.message')}
                <textarea rows={5} required value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
              </label>
              <ConsentCheckbox checked={form.consent} onChange={(v) => setForm({...form, consent: v})} />
              <button type="submit" disabled={!form.consent || status === 'sending'} className="nexa-btn nexa-btn-accent nexa-btn-lg">
                {status === 'sending' ? (lang === 'mk' ? 'Се испраќа…' : 'Sending…') : t('contact.submit')}
                <Icon name="arrowRight" size={18} />
              </button>
              {status === 'error' && (
                <p className={styles.err}>{lang === 'mk' ? 'Грешка. Обидете се повторно или пишете директно на info@nexa.mk.' : 'Error. Please try again or write directly to info@nexa.mk.'}</p>
              )}
            </form>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
