import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from '../BlogSubmissions.module.css';

const fmt = (d) => d ? new Date(d).toLocaleString('mk-MK', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

// Hardcoded — toLocaleDateString('mk-MK') falls back to English in browsers
// without the Macedonian locale data.
const MK_MONTHS = ['Јануари', 'Февруари', 'Март', 'Април', 'Мај', 'Јуни',
  'Јули', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'];

const monthLabel = (monthKey) => {
  const [y, m] = String(monthKey).split('-').map(Number);
  return `${MK_MONTHS[m - 1]} ${y}`;
};

// Current month + next 3 — mirrors the server's booking window.
const windowMonths = () => {
  const now = new Date();
  return Array.from({ length: 4 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
};

export default function NewsletterAdBookingsPage() {
  const { token } = useAuth();
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const months = useMemo(windowMonths, []);

  const [month, setMonth] = useState(months[0]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const refresh = () => {
    setLoading(true);
    axios.get(`/api/admin/newsletter-ads?month=${month}`, auth)
      .then(res => setItems(res.data?.items || []))
      .catch(e => setToast({ type: 'error', text: e.response?.data?.message || e.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [month]);

  const cancel = async (b) => {
    if (!window.confirm(`Да се откаже банерот на „${b.companyName}" за ${monthLabel(b.monthKey)}? Корисникот добива email и квотата му се враќа.`)) return;
    setBusy(true); setToast(null);
    try {
      await axios.post(`/api/admin/newsletter-ads/${b._id}/cancel`, {}, auth);
      setToast({ type: 'ok', text: 'Резервацијата е откажана; корисникот е известен по email.' });
      refresh();
    } catch (e) {
      setToast({ type: 'error', text: e.response?.data?.message || e.message });
    } finally { setBusy(false); }
  };

  const active = items.filter(b => b.status === 'active');
  const cancelled = items.filter(b => b.status !== 'active');

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Admin · Билтен</span>
          <h1 className={styles.title}>Банери во билтенот</h1>
          <p className={styles.lead}>
            Резервирани банер слотови по месец. Сликата пристигнува и на email —
            постави ја рачно во Mailjet кампањата за соодветниот месец.
          </p>
        </header>

        <nav className={styles.tabs}>
          {months.map(m => (
            <button
              key={m}
              type="button"
              className={`${styles.tab} ${month === m ? styles.tabActive : ''}`}
              onClick={() => setMonth(m)}
            >{monthLabel(m)}</button>
          ))}
        </nav>

        {toast && <div className={toast.type === 'ok' ? styles.toastOk : styles.toastError} style={{ marginBottom: 14 }}>{toast.text}</div>}

        {loading ? (
          <div className={styles.spinner}>Се вчитува…</div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>Нема резервации за {monthLabel(month)}. Слободни слотови: 3/3.</div>
        ) : (
          <>
            <div className={styles.list}>
              {active.map(b => (
                <BookingRow key={b._id} b={b} onCancel={() => cancel(b)} busy={busy} />
              ))}
            </div>
            {active.length > 0 && (
              <p className={styles.lead} style={{ margin: '10px 0 0' }}>
                Зафатени слотови: {active.length}/3
              </p>
            )}
            {cancelled.length > 0 && (
              <>
                <div className={styles.sideCardHead} style={{ marginTop: 24 }}>Откажани</div>
                <div className={styles.list}>
                  {cancelled.map(b => (
                    <BookingRow key={b._id} b={b} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </TerminalShell>
  );
}

function BookingRow({ b, onCancel, busy }) {
  return (
    <div className={styles.row}>
      <div className={styles.rowMain}>
        <div className={styles.rowTitle}>
          Слот {b.slotNumber} · {b.companyName}
        </div>
        <div className={styles.rowMeta}>
          {b.userEmail} · Резервирано: {fmt(b.createdAt)}
          {b.targetUrl && <> · Линк: <a href={b.targetUrl} target="_blank" rel="noopener noreferrer">{b.targetUrl}</a></>}
          {b.note && <> · „{b.note}"</>}
          {b.status !== 'active' && <> · Откажано: {fmt(b.cancelledAt)}</>}
        </div>
      </div>
      {b.imageUrl ? (
        <a href={b.imageUrl} target="_blank" rel="noopener noreferrer" title="Отвори ја сликата во цела големина">
          <img
            src={b.imageUrl}
            alt={`Банер — ${b.companyName}`}
            style={{ width: 150, height: 50, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb', background: '#f8fafc', display: 'block' }}
          />
        </a>
      ) : <span />}
      {onCancel && b.status === 'active'
        ? <button type="button" className={styles.btnDanger} onClick={onCancel} disabled={busy}>Откажи</button>
        : <span className={`${styles.statusPill} ${b.status === 'active' ? styles.s_accepted : styles.s_draft}`}>
            {b.status === 'active' ? 'Активна' : 'Откажана'}
          </span>}
    </div>
  );
}
