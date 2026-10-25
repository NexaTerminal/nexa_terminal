import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import styles from './UserActivityLog.module.css';

/**
 * „Активност (хронолошки)" — deep per-user timeline for admins: milestones +
 * every page opened (active time, scroll depth), click and API request,
 * grouped by day, with time-spent summary and filters. Paginated backwards.
 */

const FILTERS = [
  { key: 'all', label: 'Сè', kinds: null },
  { key: 'pages', label: 'Страници', kinds: 'page_view,session_start' },
  { key: 'clicks', label: 'Кликови', kinds: 'click' },
  { key: 'api', label: 'Барања (API)', kinds: 'api' },
  { key: 'milestones', label: 'Настани', kinds: 'milestone' },
];

const ICON = {
  page: '📄', click: '🖱', api: '⇄', session: '▶', account: '👤', sub: '💳', invoice: '🧾', doc: '📝',
  compliance: '✅', blog: '✍️', lead: '📨', topic: '❓', admin: '🛡', credit: '🪙', event: '•', convo: '💬', ai: '🤖',
};

export function fmtDuration(ms) {
  const s = Math.round((ms || 0) / 1000);
  if (s < 60) return `${s}с`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}м ${s % 60}с`;
  return `${Math.floor(m / 60)}ч ${m % 60}м`;
}

const dayKey = (d) => new Date(d).toLocaleDateString('mk-MK', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
const timeOf = (d) => new Date(d).toLocaleTimeString('mk-MK', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export default function UserActivityLog({ userId, token }) {
  const [filter, setFilter] = useState('all');
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [nextBefore, setNextBefore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (before = null) => {
    setLoading(true); setError('');
    try {
      const kinds = FILTERS.find((f) => f.key === filter)?.kinds;
      const params = new URLSearchParams();
      if (before) params.set('before', before);
      if (kinds) params.set('kinds', kinds);
      const res = await axios.get(`/api/admin/all-users/${userId}/activity?${params}`,
        { headers: { Authorization: `Bearer ${token}` } });
      const page = res.data || {};
      setEvents((prev) => (before ? [...prev, ...(page.events || [])] : (page.events || [])));
      setNextBefore(page.nextBefore || null);
      if (page.summary) setSummary(page.summary);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally { setLoading(false); }
  }, [userId, token, filter]);

  useEffect(() => { load(null); }, [load]);

  // Group consecutive events by calendar day.
  const days = [];
  for (const e of events) {
    const k = dayKey(e.at);
    if (!days.length || days[days.length - 1].key !== k) days.push({ key: k, items: [] });
    days[days.length - 1].items.push(e);
  }

  return (
    <div className={styles.wrap}>
      {summary && (
        <div className={styles.summary}>
          <div className={styles.stats}>
            <Stat label="Денес" value={fmtDuration(summary.todayMs)} />
            <Stat label="7 дена" value={fmtDuration(summary.weekMs)} />
            <Stat label="Вкупно" value={fmtDuration(summary.totalMs)} />
            <Stat label="Сесии" value={summary.sessions} />
            <Stat label="Страници" value={summary.pageViews} />
            <Stat label="Кликови" value={summary.clicks} />
            <Stat label="Барања" value={summary.requests} />
          </div>
          {summary.topPages?.length > 0 && (
            <div className={styles.topPages}>
              <span className={styles.topTitle}>Најмногу време на:</span>
              {summary.topPages.map((p) => (
                <span key={p.path} className={styles.topPage} title={p.path}>
                  {p.title || p.path} · <strong>{fmtDuration(p.ms)}</strong> ({p.views}×)
                </span>
              ))}
            </div>
          )}
          <div className={styles.note}>Детален дневник се чува {summary.retentionDays} дена.</div>
        </div>
      )}

      <div className={styles.filters} role="tablist">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" role="tab" aria-selected={filter === f.key}
            className={`${styles.filter} ${filter === f.key ? styles.filterActive : ''}`}
            onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {!loading && !error && events.length === 0 && <div className={styles.empty}>Нема забележани активности.</div>}

      <div className={styles.list}>
        {days.map((d) => (
          <section key={d.key}>
            <div className={styles.day}>{d.key}</div>
            <ul className={styles.items}>
              {d.items.map((e, i) => {
                const family = (e.type || '').split('.')[0];
                return (
                  <li key={`${e.at}-${i}`} className={`${styles.item} ${styles[`k_${family}`] || ''}`}>
                    <span className={styles.time}>{timeOf(e.at)}</span>
                    <span className={styles.icon} aria-hidden>{ICON[family] || '•'}</span>
                    <span className={styles.body}>
                      <span className={styles.label}>{e.label}</span>
                      {(e.meta?.detail || (family === 'click' && e.meta?.path)) && (
                        <span className={styles.detail}>
                          {e.meta?.detail || ''}{family === 'click' && e.meta?.path ? ` на ${e.meta.path}` : ''}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {loading && <div className={styles.empty}>Се вчитува…</div>}
      {!loading && nextBefore && (
        <button type="button" className={styles.more} onClick={() => load(nextBefore)}>Вчитај постари</button>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statValue}>{value ?? '—'}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}
