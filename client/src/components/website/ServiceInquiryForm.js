import { useState } from 'react';
import { SERVICES, SERVICES_COMMON } from '../../data/services';
import styles from '../../pages/website/Services.module.css';

/** Inquiry form for the „Услуги" pages → POST /api/public/services/inquiry. */
export default function ServiceInquiryForm({ lang = 'mk', defaultService = '' }) {
  const c = SERVICES_COMMON[lang] || SERVICES_COMMON.mk;
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    service: defaultService, message: '', consent: false, website: '',
  });
  const [status, setStatus] = useState(null); // null | sending | ok | error
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.consent || status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch('/api/public/services/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, language: lang }),
      });
      setStatus(res.ok ? 'ok' : 'error');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'ok') return <div className={styles.formOk}>{c.ok}</div>;

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.formRow2}>
        <label className={styles.field}>
          <span>{c.fName}</span>
          <input required maxLength={100} value={form.name} onChange={set('name')} />
        </label>
        <label className={styles.field}>
          <span>{c.fEmail}</span>
          <input required type="email" maxLength={150} value={form.email} onChange={set('email')} />
        </label>
      </div>
      <div className={styles.formRow2}>
        <label className={styles.field}>
          <span>{c.fPhone}</span>
          <input maxLength={30} value={form.phone} onChange={set('phone')} />
        </label>
        <label className={styles.field}>
          <span>{c.fService}</span>
          <select value={form.service} onChange={set('service')}>
            <option value="">{c.fServiceOther}</option>
            {SERVICES.map(s => <option key={s.slug} value={s.slug}>{s[lang]?.title || s.mk.title}</option>)}
          </select>
        </label>
      </div>
      <label className={styles.field}>
        <span>{c.fMessage}</span>
        <textarea required minLength={10} maxLength={3000} rows={5} placeholder={c.fMessagePh}
                  value={form.message} onChange={set('message')} />
      </label>
      {/* Honeypot — hidden from people, filled by bots. */}
      <input className={styles.hp} tabIndex={-1} autoComplete="off" aria-hidden="true"
             value={form.website} onChange={set('website')} />
      <label className={styles.consent}>
        <input type="checkbox" checked={form.consent} onChange={set('consent')} />
        <span>{c.consent}</span>
      </label>
      <button type="submit" className="nexa-btn nexa-btn-accent nexa-btn-lg" disabled={!form.consent || status === 'sending'}>
        {status === 'sending' ? c.sending : c.submit}
      </button>
      {status === 'error' && <p className={styles.formErr}>{c.err}</p>}
    </form>
  );
}
