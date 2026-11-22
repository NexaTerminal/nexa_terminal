import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../website/Icon';
import ShareLinks from './ShareLinks';
import styles from './ProfileSite.module.css';
import { API_BASE, mediaUrl } from '../../lib/apiBase';

/**
 * The company one-pager rendered at /f/:slug — a small website the company can
 * share anywhere. Sections only render when they have content, so a short
 * profile still looks finished. Contact goes through Nexa (the company's email
 * is never required to be public).
 */

const SOCIAL_PATHS = {
  linkedin: 'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.6 8.65 21 11.1 21 14.3V21h-4v-5.9c0-1.4-.03-3.2-1.95-3.2-1.95 0-2.25 1.52-2.25 3.1V21H9z',
  facebook: 'M14 8h3V4h-3c-2.76 0-5 2.24-5 5v2H7v4h2v7h4v-7h3l1-4h-4V9c0-.55.45-1 1-1z',
  instagram: 'M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4zm4.5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM17.25 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z',
};
const SOCIAL_LABEL = { linkedin: 'LinkedIn', facebook: 'Facebook', instagram: 'Instagram' };

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'N';
const host = (url = '') => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } };
const telHref = (p = '') => `tel:${p.replace(/[^\d+]/g, '')}`;

function Logo({ src, name, className }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) return <img src={mediaUrl(src)} alt={`${name} лого`} className={className} onError={() => setBroken(true)} />;
  return <span className={`${className} ${styles.logoInitials}`} aria-hidden="true">{initials(name)}</span>;
}

function ContactForm({ slug }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', consent: false, website: '' });
  const [status, setStatus] = useState(null); // null | sending | ok | error
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.consent || status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch(`${API_BASE}/public/profile/${encodeURIComponent(slug)}/contact`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      setStatus(res.ok ? 'ok' : 'error');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'ok') {
    return (
      <div className={styles.formOk}>
        <span className={styles.formOkIcon}><Icon name="check" size={22} /></span>
        <strong>Пораката е испратена.</strong>
        <span>Ќе Ве контактираат на е-поштата што ја оставивте.</span>
      </div>
    );
  }
  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.formRow}>
        <label><span>Име и презиме</span><input required maxLength={100} value={form.name} onChange={set('name')} /></label>
        <label><span>Е-пошта</span><input required type="email" maxLength={150} value={form.email} onChange={set('email')} /></label>
      </div>
      <label><span>Телефон (опционално)</span><input maxLength={30} value={form.phone} onChange={set('phone')} /></label>
      <label><span>Порака</span><textarea required minLength={10} maxLength={2000} rows={5} value={form.message} onChange={set('message')}
        placeholder="Опишете што Ви треба — производ, услуга, соработка…" /></label>
      <input className={styles.hp} tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={set('website')} />
      <label className={styles.consent}>
        <input type="checkbox" checked={form.consent} onChange={set('consent')} />
        <span>Се согласувам податоците да се проследат до фирмата за да одговори на мојата порака (<a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Политика за приватност</a>).</span>
      </label>
      <button type="submit" className={styles.btnPrimary} disabled={!form.consent || status === 'sending'}>
        {status === 'sending' ? 'Се испраќа…' : 'Испрати порака'}
      </button>
      {status === 'error' && <p className={styles.formErr}>Пораката не беше испратена. Обидете се повторно.</p>}
    </form>
  );
}

export default function ProfileSite({ profile, shareUrl }) {
  const p = profile;
  const socials = useMemo(() => Object.entries(p.links || {}).filter(([, v]) => v), [p.links]);
  const hasContactDetails = !!(p.contactEmail || p.phone || p.website || p.city || socials.length);
  const nav = [
    p.about && ['za-nas', 'За нас'],
    p.offers?.length && ['nudime', 'Што нудиме'],
    ['kontakt', 'Контакт'],
  ].filter(Boolean);
  const year = new Date().getFullYear();

  return (
    <div className={styles.site}>
      {/* Sticky bar — the company's own brand, not Nexa's */}
      <header className={styles.bar}>
        <div className={styles.barInner}>
          <a href="#top" className={styles.brand}>
            <Logo src={p.avatarUrl} name={p.displayName} className={styles.brandLogo} />
            <span className={styles.brandName}>{p.displayName}</span>
          </a>
          <nav className={styles.nav} aria-label="Делови од страницата">
            {nav.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
          </nav>
          <a href="#kontakt" className={styles.barCta}>Контакт</a>
        </div>
      </header>

      {/* Hero — cover photo (or brand gradient), logo, name, headline */}
      <section id="top" className={styles.hero}>
        {p.coverUrl && <img className={styles.heroImg} src={mediaUrl(p.coverUrl)} alt="" aria-hidden="true" />}
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={styles.heroInner}>
          <Logo src={p.avatarUrl} name={p.displayName} className={styles.heroLogo} />
          <h1 className={styles.heroTitle}>{p.displayName}</h1>
          {p.headline && <p className={styles.heroLead}>{p.headline}</p>}
          <div className={styles.heroMeta}>
            {p.city && <span className={styles.metaPill}><Icon name="pin" size={14} />{p.city}</span>}
            {(p.badges || []).map(b => (
              b.href
                ? <a key={b.key} href={b.href} className={`${styles.metaPill} ${styles.badge}`}><Icon name="check" size={13} />{b.label}</a>
                : <span key={b.key} className={`${styles.metaPill} ${styles.badge}`}><Icon name="check" size={13} />{b.label}</span>
            ))}
          </div>
          <div className={styles.heroCtas}>
            <a href="#kontakt" className={styles.btnPrimary}>Контактирајте нè <Icon name="arrowRight" size={16} /></a>
            {p.phone && <a href={telHref(p.phone)} className={styles.btnGlass}><Icon name="phone" size={16} />{p.phone}</a>}
            {p.website && <a href={p.website} target="_blank" rel="noopener" className={styles.btnGlass}><Icon name="globe" size={16} />{host(p.website)}</a>}
          </div>
        </div>
      </section>

      {p.about && (
        <section id="za-nas" className={styles.section}>
          <div className={styles.narrow}>
            <span className={styles.eyebrow}>За нас</span>
            <h2 className={styles.h2}>Кои сме ние</h2>
            {p.about.split(/\n{2,}|\n/).filter(Boolean).map((para, i) => <p key={i} className={styles.aboutText}>{para}</p>)}
          </div>
        </section>
      )}

      {p.offers?.length > 0 && (
        <section id="nudime" className={`${styles.section} ${styles.sectionSoft}`}>
          <div className={styles.container}>
            <div className={styles.head}>
              <span className={styles.eyebrow}>Услуги и производи</span>
              <h2 className={styles.h2}>Што нудиме</h2>
            </div>
            <div className={`${styles.cards} ${[2, 4].includes(p.offers.length) ? styles.cardsPairs : ''}`}>
              {p.offers.map((o, i) => (
                <div key={o} className={styles.card}>
                  <span className={styles.cardNum}>{String(i + 1).padStart(2, '0')}</span>
                  <h3>{o}</h3>
                  <a href="#kontakt" className={styles.cardLink}>Побарајте понуда →</a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {p.lookingFor?.length > 0 && (
        <section className={styles.section}>
          <div className={styles.narrow}>
            <span className={styles.eyebrow}>Соработка</span>
            <h2 className={styles.h2}>Бараме</h2>
            <div className={styles.chips}>{p.lookingFor.map(t => <span key={t} className={styles.chip}>{t}</span>)}</div>
            <p className={styles.muted}>Можете да помогнете? <a href="#kontakt">Пишете ни</a>.</p>
          </div>
        </section>
      )}

      {/* Contact — details + form */}
      <section id="kontakt" className={`${styles.section} ${styles.sectionDark}`}>
        <div className={styles.container}>
          <div className={styles.head}>
            <span className={`${styles.eyebrow} ${styles.eyebrowLight}`}>Контакт</span>
            <h2 className={`${styles.h2} ${styles.h2Light}`}>Да разговараме</h2>
            <p className={styles.headLead}>Испратете порака — одговорот стигнува директно од {p.displayName}.</p>
          </div>
          <div className={`${styles.contactGrid} ${hasContactDetails ? '' : styles.contactGridSingle}`}>
            {hasContactDetails && (
              <div className={styles.details}>
                {p.contactEmail && <a href={`mailto:${p.contactEmail}`} className={styles.detail}><Icon name="mail" size={18} /><span>{p.contactEmail}</span></a>}
                {p.phone && <a href={telHref(p.phone)} className={styles.detail}><Icon name="phone" size={18} /><span>{p.phone}</span></a>}
                {p.website && <a href={p.website} target="_blank" rel="noopener" className={styles.detail}><Icon name="globe" size={18} /><span>{host(p.website)}</span></a>}
                {p.city && <span className={styles.detail}><Icon name="pin" size={18} /><span>{p.city}, Македонија</span></span>}
                {socials.length > 0 && (
                  <div className={styles.socials}>
                    {socials.map(([k, url]) => (
                      <a key={k} href={url} target="_blank" rel="noopener" aria-label={SOCIAL_LABEL[k]} title={SOCIAL_LABEL[k]}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d={SOCIAL_PATHS[k]} /></svg>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
            <ContactForm slug={p.slug} />
          </div>
        </div>
      </section>

      {shareUrl && (
        <section className={styles.shareSection}>
          <div className={styles.shareWide}>
            <p className={styles.shareTitle}>Сподели ја страницата</p>
            <ShareLinks url={shareUrl} title={p.displayName} text={p.headline} />
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        <span>© {year} {p.displayName}</span>
        <span className={styles.footerNexa}>
          Страница направена со <Link to="/">Nexa</Link> ·{' '}
          <Link to="/login?mode=register">Креирајте бесплатна страница за Вашата фирма →</Link>
        </span>
      </footer>
    </div>
  );
}
