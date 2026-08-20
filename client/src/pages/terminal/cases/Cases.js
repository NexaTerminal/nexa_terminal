import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import casesApi from '../../../services/casesApi';
// Shared visual vocabulary with Договори / Вработени — same registry UI/classes.
import styles from '../contracts/Contracts.module.css';
import {
  CASE_TYPE_LABEL, STATUS_LABEL, STATUS_BADGE, fmtDate, dueLabel, daysLeft
} from '../../../config/cases';

const FILTER_CHIPS = ['', 'open', 'in_progress', 'waiting', 'closed', 'archived'];

export default function Cases() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await casesApi.list(token, { status: status || undefined, search: q || undefined });
      setItems(res.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при вчитување на предметите.');
    } finally {
      setLoading(false);
    }
  }, [token, status, q]);

  useEffect(() => { load(); }, [load]);

  // Full Excel report of every case (server-built, all cases, ignores filters).
  const exportExcel = async () => {
    setExporting(true); setError('');
    try {
      const blob = await casesApi.exportXlsx(token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `predmeti-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('Извозот во Excel не успеа. Обидете се повторно.');
    } finally {
      setExporting(false);
    }
  };

  // Upcoming deadlines across all loaded cases — a quick "what needs me" strip.
  const upcoming = items
    .map((c) => (c.nextDeadline ? { ...c.nextDeadline, caseId: c._id, caseTitle: c.title } : null))
    .filter((d) => d && daysLeft(d.dueAt) !== null && daysLeft(d.dueAt) <= 14 && daysLeft(d.dueAt) >= 0)
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
    .slice(0, 5);

  const deadlineBadge = (nd) => {
    if (!nd) return null;
    const n = daysLeft(nd.dueAt);
    const cls = n !== null && n <= 3 ? styles.badge_expiring : styles.badge_active;
    return <span className={`${styles.badge} ${cls}`}>{fmtDate(nd.dueAt)} · {dueLabel(nd.dueAt)}</span>;
  };

  return (
    <TerminalShell>
      <div className={styles.page}>
        <div className={styles.headRow}>
          <div>
            <h1 className={styles.title}>Предмети</h1>
            <p className={styles.subtitle}>
              Дигитална евиденција на вашите предмети — рокови, дневник на активности,
              автоматски потсетници и линк за статус што го споделувате со клиентот.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className={styles.secondaryBtn} onClick={exportExcel} disabled={exporting}>
              {exporting ? 'Се подготвува…' : '⬇ Excel извештај'}
            </button>
            <Link to="/terminal/cases/new" className={styles.primaryBtn}>+ Нов предмет</Link>
          </div>
        </div>

        {upcoming.length > 0 && (
          <div className={styles.card}>
            <div className={styles.cardTitle}>Наближуваат рокови</div>
            {upcoming.map((d, i) => (
              <div key={i} className={styles.obligationRow} onClick={() => navigate(`/terminal/cases/${d.caseId}`)} style={{ cursor: 'pointer' }}>
                <span className={styles.obligationLabel}>{d.caseTitle} — {d.title}</span>
                {deadlineBadge(d)}
              </div>
            ))}
          </div>
        )}

        <div className={styles.filters}>
          <input
            type="search"
            className={styles.search}
            placeholder="Пребарај по наслов, клиент, број…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className={styles.statusChips}>
            {FILTER_CHIPS.map((s) => (
              <button
                key={s || 'all'}
                type="button"
                className={`${styles.chip} ${status === s ? styles.chipActive : ''}`}
                onClick={() => setStatus(s)}
              >
                {s ? STATUS_LABEL[s] : 'Сите'}
              </button>
            ))}
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.tableWrap}>
          {loading ? (
            <div className={styles.empty}>Се вчитува…</div>
          ) : items.length === 0 ? (
            <div className={styles.empty}>
              {q || status
                ? 'Нема предмети што одговараат на филтерот.'
                : 'Сè уште немате предмети. Отворете го првиот — потоа водете рокови и дневник, и споделете статус со клиентот.'}
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Наслов</th>
                  <th>Клиент</th>
                  <th>Вид</th>
                  <th>Статус</th>
                  <th>Следен рок</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c._id} onClick={() => navigate(`/terminal/cases/${c._id}`)}>
                    <td>
                      <strong>{c.title}</strong>
                      {c.caseNumber ? <div className={styles.hint}>{c.caseNumber}</div> : null}
                    </td>
                    <td>{c.clientName || '—'}</td>
                    <td>{CASE_TYPE_LABEL[c.caseType] || c.caseType}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[STATUS_BADGE[c.status]] || ''}`}>
                        {STATUS_LABEL[c.status] || c.status}
                      </span>
                    </td>
                    <td>{c.nextDeadline ? deadlineBadge(c.nextDeadline) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </TerminalShell>
  );
}
