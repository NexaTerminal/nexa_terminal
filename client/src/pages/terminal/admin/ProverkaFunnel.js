import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from './ManageSubscriptions.module.css';

/**
 * Admin: „Бесплатна проверка" funnel — completed → email → registered →
 * free doc used → activated. Master-plan Phase 1.4.
 */

const fmtDateTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return '—';
  return date.toLocaleString('en-GB', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

function StatCard({ label, value, hint }) {
  return (
    <div style={{ flex: 1, minWidth: 140, background: '#fff', border: '1px solid #E6E8EC', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#0B1220', marginTop: 4 }}>{value}</div>
      {hint && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

export default function ProverkaFunnel() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/public/screening/admin/funnel', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRows(res.data.data.rows || []);
      setStats(res.data.data.stats || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const pct = (part, whole) => (whole ? ` (${Math.round((part / whole) * 100)}%)` : '');

  return (
    <TerminalShell>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>Проверка — функел</h1>
          <p>
            Јавната „Бесплатна проверка" на /proverka: завршени проверки, оставени
            е-пошти, регистрации и искористени бесплатни документи (последни 500).
          </p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {stats && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '16px 0 22px' }}>
            <StatCard label="Завршени" value={stats.completed} hint={`просечен резултат ${stats.avgScore}%`} />
            <StatCard label="Е-пошта" value={stats.emailCaptured} hint={`од завршени${pct(stats.emailCaptured, stats.completed)}`} />
            <StatCard label="Регистрирани" value={stats.registered} hint={`од е-пошти${pct(stats.registered, stats.emailCaptured)}`} />
            <StatCard label="Бесплатен документ" value={stats.freeDocUsed} hint="искористен" />
            <StatCard label="Активирани" value={stats.activated} hint="претплата/код" />
          </div>
        )}

        {loading ? (
          <p>Се вчитува…</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Датум</th>
                  <th>Резултат</th>
                  <th>Недостатоци</th>
                  <th>Е-пошта</th>
                  <th>Регистриран</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id}>
                    <td>{fmtDateTime(r.createdAt)}</td>
                    <td>{r.percentage}% · {r.grade}</td>
                    <td>{r.gapCount}</td>
                    <td>{r.email || '—'}</td>
                    <td>{r.registered ? '✓' : '—'}</td>
                    <td>{r.subscriptionStatus || '—'}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9CA3AF' }}>Сè уште нема завршени проверки.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TerminalShell>
  );
}
