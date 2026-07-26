import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from './ManageSubscriptions.module.css';

/**
 * Admin: „Бесплатна проверка" funnel — share-link builder + funnel metrics
 * (completed → email → registered → free doc used → activated), with a
 * per-source breakdown. Master-plan Phase 1.4.
 */

const fmtDateTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return '—';
  return date.toLocaleString('en-GB', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

// URL-safe tag from a free-text label.
const slugify = (s) => (s || '')
  .toString().trim().toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9-]/g, '')
  .replace(/-+/g, '-')
  .slice(0, 60);

const PRESETS = ['linkedin-post', 'linkedin-dm', 'cold-email', 'newsletter', 'facebook'];

function StatCard({ label, value, hint }) {
  return (
    <div style={{ flex: 1, minWidth: 140, background: '#fff', border: '1px solid #E6E8EC', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#0B1220', marginTop: 4 }}>{value}</div>
      {hint && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

function ShareLinkBuilder() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const [label, setLabel] = useState('');
  const [copied, setCopied] = useState('');
  const tag = slugify(label);
  const url = tag ? `${origin}/proverka?src=${tag}` : `${origin}/proverka`;

  const copy = (u, key) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(u).then(() => {
        setCopied(key);
        setTimeout(() => setCopied(''), 1500);
      });
    }
  };

  const box = { background: '#fff', border: '1px solid #E6E8EC', borderRadius: 12, padding: '16px 18px', margin: '8px 0 22px' };
  const input = { flex: 1, minWidth: 180, padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 };
  const btn = { background: '#1e4db7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' };
  const chip = { background: '#EEF2FF', color: '#1e4db7', border: '1px solid #C7D2FE', padding: '4px 10px', borderRadius: 999, fontSize: 12.5, cursor: 'pointer' };

  return (
    <div style={box}>
      <div style={{ fontWeight: 700, color: '#0B1220', marginBottom: 4 }}>Сподели линк</div>
      <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 10 }}>
        Означете канал/кампања и копирајте ја врската за cold email или LinkedIn. Изворот се следи подолу.
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
        {PRESETS.map((p) => (
          <span key={p} style={chip} onClick={() => setLabel(p)}>{p}</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input style={input} placeholder="напр. linkedin-post-juli" value={label} onChange={(e) => setLabel(e.target.value)} />
        <code style={{ flex: 2, minWidth: 240, fontSize: 13, background: '#F9FAFB', border: '1px solid #E6E8EC', borderRadius: 8, padding: '8px 10px', overflowX: 'auto' }}>{url}</code>
        <button style={btn} onClick={() => copy(url, 'main')}>{copied === 'main' ? 'Копирано ✓' : 'Копирај'}</button>
      </div>
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

  const bySource = useMemo(() => {
    const m = {};
    rows.forEach((r) => {
      const s = r.source || '(директно)';
      if (!m[s]) m[s] = { source: s, completed: 0, email: 0, registered: 0 };
      m[s].completed++;
      if (r.email) m[s].email++;
      if (r.registered) m[s].registered++;
    });
    return Object.values(m).sort((a, b) => b.completed - a.completed);
  }, [rows]);

  return (
    <TerminalShell>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>Проверка — функел</h1>
          <p>
            Јавната „Бесплатна проверка" на /proverka: споделете тагирани линкови,
            следете завршени проверки, е-пошти, регистрации и активации (последни 500).
          </p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <ShareLinkBuilder />

        {stats && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '16px 0 22px' }}>
            <StatCard label="Завршени" value={stats.completed} hint={`просечен резултат ${stats.avgScore}%`} />
            <StatCard label="Е-пошта" value={stats.emailCaptured} hint={`од завршени${pct(stats.emailCaptured, stats.completed)}`} />
            <StatCard label="Регистрирани" value={stats.registered} hint={`од е-пошти${pct(stats.registered, stats.emailCaptured)}`} />
            <StatCard label="Бесплатен документ" value={stats.freeDocUsed} hint="искористен" />
            <StatCard label="Активирани" value={stats.activated} hint="претплата/код" />
          </div>
        )}

        {bySource.length > 0 && (
          <div style={{ margin: '0 0 22px' }}>
            <div style={{ fontWeight: 700, color: '#0B1220', margin: '0 0 8px' }}>По извор (канал)</div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Извор</th><th>Завршени</th><th>Е-пошта</th><th>Регистрирани</th></tr>
                </thead>
                <tbody>
                  {bySource.map((s) => (
                    <tr key={s.source}>
                      <td>{s.source}</td>
                      <td>{s.completed}</td>
                      <td>{s.email}{pct(s.email, s.completed)}</td>
                      <td>{s.registered}{pct(s.registered, s.email)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  <th>Извор</th>
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
                    <td>{r.source || '—'}</td>
                    <td>{r.percentage}% · {r.grade}</td>
                    <td>{r.gapCount}</td>
                    <td>{r.email || '—'}</td>
                    <td>{r.registered ? '✓' : '—'}</td>
                    <td>{r.subscriptionStatus || '—'}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9CA3AF' }}>Сè уште нема завршени проверки.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TerminalShell>
  );
}
