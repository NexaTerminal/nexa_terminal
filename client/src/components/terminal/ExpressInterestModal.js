import { useState } from 'react';
import SubmitConsent from './SubmitConsent';
import MACEDONIAN_CITIES from '../../data/macedonianCities';
import styles from './ExpressInterestModal.module.css';

export default function ExpressInterestModal({ inquiry, onClose, onSubmit, defaultProfession }) {
  // Every member here is a lawyer — profession is fixed (no picker), still sent.
  const [profession] = useState(defaultProfession || 'lawyer');
  const [providerName, setProviderName] = useState('');
  const [providerCity, setProviderCity] = useState('');
  const [freeTalkOffered, setFreeTalkOffered] = useState(true);
  const [helpDescription, setHelpDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = providerName.trim() && providerCity && helpDescription.trim();

  const submit = async (e) => {
    e.preventDefault();
    if (!providerName.trim()) { setError('Внесете име на адвокат или адвокатско друштво.'); return; }
    if (!providerCity) { setError('Изберете град.'); return; }
    if (!helpDescription.trim()) { setError('Потребен е опис.'); return; }
    setBusy(true); setError(null);
    try {
      await onSubmit({
        profession,
        providerName: providerName.trim(),
        providerCity,
        freeTalkOffered,
        helpDescription: helpDescription.trim()
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Грешка при поднесување.');
    } finally { setBusy(false); }
  };

  const left = 400 - helpDescription.length;

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Затвори">×</button>
        <div className={styles.eyebrow}>Изрази интерес</div>
        <h2 className={styles.title}>{inquiry?.topic || ''}</h2>
        <p className={styles.lead}>
          За уредничкиот тим да може да направи добар избор, кажете ни кратко како би помогнале.
        </p>

        <form className={styles.form} onSubmit={submit}>
          <div className={styles.field}>
            <label className={styles.label}>Адвокат / Адвокатско друштво</label>
            <input
              className={styles.input}
              type="text"
              value={providerName}
              maxLength={120}
              onChange={(e) => setProviderName(e.target.value)}
              placeholder="Име и презиме на адвокат или назив на адвокатско друштво"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Град</label>
            <select
              className={styles.select}
              value={providerCity}
              onChange={(e) => setProviderCity(e.target.value)}
              required
            >
              <option value="" disabled>Изберете град…</option>
              {MACEDONIAN_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Бесплатна почетна консултација</label>
            <div className={styles.radioRow}>
              <label className={`${styles.radioCell} ${freeTalkOffered === true ? styles.radioActive : ''}`}>
                <input type="radio" name="freeTalk" checked={freeTalkOffered === true} onChange={() => setFreeTalkOffered(true)} />
                <span>Да, отворен/а сум за краток информативен разговор без надомест.</span>
              </label>
              <label className={`${styles.radioCell} ${freeTalkOffered === false ? styles.radioActive : ''}`}>
                <input type="radio" name="freeTalk" checked={freeTalkOffered === false} onChange={() => setFreeTalkOffered(false)} />
                <span>Не, претпочитам да започнам наплатно од прв разговор.</span>
              </label>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Како можам да помогнам</label>
            <textarea
              className={styles.textarea}
              value={helpDescription}
              maxLength={400}
              rows={4}
              onChange={(e) => setHelpDescription(e.target.value.slice(0, 400))}
              placeholder="1–2 реченици. Што конкретно ќе направите за оваа ситуација."
              required
            />
            <div className={styles.counter}>{left} карактери преостанати</div>
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <SubmitConsent />

          <div className={styles.actionRow}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={busy}>Откажи</button>
            <button type="submit"  className={styles.btnPrimary} disabled={busy || !canSubmit}>
              {busy ? 'Се испраќа…' : 'Изразувам интерес'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
