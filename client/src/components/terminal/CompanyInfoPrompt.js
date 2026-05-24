import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import styles from './CompanyInfoPrompt.module.css';

/**
 * Modal that prompts for missing company info when the user enters the
 * Automated Documents area. Re-opens every time they land here while the
 * info is still incomplete. "Подоцна" defers for the session.
 *
 * Required fields:
 *   - companyName        (Име на компанијата)
 *   - companyAddress     (Адреса)
 *   - companyTaxNumber   (ЕДБ)
 *   - companyManager     (Управител — име и презиме)
 *   - officialEmail      (Е-пошта за деловна комуникација)
 *
 * Wording deliberately avoids the word "верификација" — this is presented
 * as "complete your company info to improve speed and experience".
 */

const REQUIRED = ['companyName', 'companyAddress', 'companyTaxNumber', 'companyManager', 'officialEmail'];

const LABELS = {
  companyName:      'Име на компанијата',
  companyAddress:   'Адреса',
  companyTaxNumber: 'ЕДБ (даночен број)',
  companyManager:   'Управител (име и презиме)',
  officialEmail:    'Е-пошта за деловна комуникација'
};

const PLACEHOLDERS = {
  companyName:      'на пр. „НЕКСА АМД ДООЕЛ Скопје"',
  companyAddress:   'на пр. „Партизански Одреди 102/2-14, Скопје"',
  companyTaxNumber: 'на пр. „MK4030005550168"',
  companyManager:   'на пр. „Мартин Бошкоски"',
  officialEmail:    'na пр. „info@vasata-firma.mk"'
};

const isComplete = (user) => {
  if (!user) return false;
  const ci = user.companyInfo || {};
  return !!(
    ci.companyName &&
    (ci.companyAddress || ci.address) &&
    (ci.companyTaxNumber || ci.taxNumber) &&
    (ci.companyManager || user.companyManager) &&
    (user.officialEmail || user.email)
  );
};

const SESSION_DEFER_KEY = 'nexa.companyInfo.deferredAt';

export default function CompanyInfoPrompt() {
  const { token, currentUser, setCurrentUser } = useAuth();

  // Initial open state: if info incomplete AND not deferred this session.
  const computeShouldOpen = () => {
    if (!currentUser) return false;
    if (isComplete(currentUser)) return false;
    try {
      const deferredAt = sessionStorage.getItem(SESSION_DEFER_KEY);
      return !deferredAt;
    } catch { return true; }
  };

  const [open, setOpen] = useState(computeShouldOpen);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // When currentUser arrives async, re-evaluate.
  useEffect(() => {
    setOpen(computeShouldOpen());
    if (currentUser) {
      const ci = currentUser.companyInfo || {};
      setForm({
        companyName:      ci.companyName || '',
        companyAddress:   ci.companyAddress || ci.address || '',
        companyTaxNumber: ci.companyTaxNumber || ci.taxNumber || '',
        companyManager:   ci.companyManager || currentUser.companyManager || '',
        officialEmail:    currentUser.officialEmail || currentUser.email || ''
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?._id, currentUser?.id]);

  if (!currentUser) return null;
  if (!open) return null;

  const missing = REQUIRED.filter(f => !form[f] || !form[f].trim());

  const onChange = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const defer = () => {
    try { sessionStorage.setItem(SESSION_DEFER_KEY, String(Date.now())); } catch {}
    setOpen(false);
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    setError('');
    if (missing.length > 0) {
      setError('Ве молиме пополнете ги сите полиња.');
      return;
    }
    setSubmitting(true);
    try {
      // Get a CSRF token (the existing /api/users/profile route is CSRF-gated).
      let csrfToken = null;
      try {
        const r = await fetch('/api/csrf-token', { credentials: 'include' });
        if (r.ok) { const d = await r.json(); csrfToken = d.csrfToken; }
      } catch {}

      const body = {
        companyInfo: {
          companyName:      form.companyName.trim(),
          companyAddress:   form.companyAddress.trim(),
          companyTaxNumber: form.companyTaxNumber.trim(),
          companyManager:   form.companyManager.trim()
        },
        officialEmail: form.officialEmail.trim(),
        companyManager: form.companyManager.trim() // legacy duplicate
      };

      const res = await axios.put('/api/users/profile', body, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
        },
        withCredentials: true
      });

      // Update local user state so the prompt vanishes on next render.
      if (setCurrentUser && res.data?.user) {
        setCurrentUser({ ...currentUser, ...res.data.user });
      } else if (setCurrentUser) {
        setCurrentUser({
          ...currentUser,
          officialEmail: body.officialEmail,
          companyManager: body.companyManager,
          companyInfo: { ...(currentUser.companyInfo || {}), ...body.companyInfo }
        });
      }

      setSuccess(true);
      try { sessionStorage.removeItem(SESSION_DEFER_KEY); } catch {}
      setTimeout(() => setOpen(false), 900);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Грешка при зачувување.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <button type="button" className={styles.closeBtn} onClick={defer} aria-label="Затвори">×</button>

        <div className={styles.eyebrow}>За полна функционалност</div>
        <h2 className={styles.title}>Внесете информации за компанијата</h2>
        <p className={styles.lead}>
          За да генерираме документи во финална верзија (со точни податоци за вашата фирма),
          потребни ни се основните информации подолу. Се внесуваат еднаш.
        </p>

        {success ? (
          <div className={styles.successBlock}>
            <div className={styles.checkIcon} aria-hidden>✓</div>
            <p>Зачувано! Сега документите ќе се генерираат со точни податоци за вашата фирма.</p>
          </div>
        ) : (
          <form onSubmit={submit} className={styles.form} noValidate>
            {REQUIRED.map(key => (
              <label key={key} className={styles.field}>
                <span className={styles.fieldLabel}>{LABELS[key]}</span>
                <input
                  type={key === 'officialEmail' ? 'email' : 'text'}
                  value={form[key] || ''}
                  onChange={(e) => onChange(key, e.target.value)}
                  placeholder={PLACEHOLDERS[key]}
                  className={!form[key] && missing.includes(key) ? styles.inputEmpty : ''}
                />
              </label>
            ))}

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.actions}>
              <button type="button" className={styles.btnGhost} onClick={defer} disabled={submitting}>
                Подоцна
              </button>
              <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                {submitting ? 'Се зачувува…' : 'Зачувај и продолжи'}
              </button>
            </div>
            <p className={styles.fineprint}>
              Податоците ги користиме само за пополнување на вашите документи. Можете да ги
              менувате во секое време од профилот.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
