import { useState } from 'react';
import styles from '../../components/terminal/ExpressInterestModal.module.css';

export default function RequestTopicModal({ topic, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { setError('Образложение е задолжително.'); return; }
    setBusy(true); setError(null);
    try {
      await onSubmit({ requestReason: reason.trim() });
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setBusy(false); }
  };

  const left = 400 - reason.length;

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Затвори">×</button>
        <div className={styles.eyebrow}>Барање за отворање</div>
        <h2 className={styles.title}>{topic?.title}</h2>
        <p className={styles.lead}>
          Во една до две реченици, зошто Вие сте вистинскиот автор за оваа тема?
        </p>

        <form className={styles.form} onSubmit={submit}>
          <div className={styles.field}>
            <label className={styles.label}>Образложение</label>
            <textarea className={styles.textarea}
                      value={reason}
                      maxLength={400}
                      rows={4}
                      onChange={(e) => setReason(e.target.value.slice(0, 400))}
                      placeholder="На пр.: Имам 8 години искуство во трудово право, водам месечни предавања на ова прашање за HR директори."
                      required />
            <div className={styles.counter}>{left} карактери преостанати</div>
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <div className={styles.actionRow}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={busy}>Откажи</button>
            <button type="submit"  className={styles.btnPrimary} disabled={busy || !reason.trim()}>
              {busy ? 'Се испраќа…' : 'Поднеси барање'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
