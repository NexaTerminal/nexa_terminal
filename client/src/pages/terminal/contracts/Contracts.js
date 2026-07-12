import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from './Contracts.module.css';

/**
 * Договори — Contract Management System list page (cms-v1-plan.md M3).
 * Table of tracked contracts: status, counterparty, expiry, next obligation.
 */

export const STATUS_LABEL = {
  draft: 'Нацрт',
  active: 'Активен',
  expiring: 'Истекува',
  expired: 'Истечен',
  terminated: 'Раскинат',
  renewed: 'Обновен'
};

// Hardcoded — toLocaleDateString('mk-MK') falls back to English in browsers
// without the Macedonian locale data.
const MK_MONTHS_SHORT = ['јан', 'фев', 'мар', 'апр', 'мај', 'јун', 'јул', 'авг', 'сеп', 'окт', 'ное', 'дек'];

export const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return '—';
  return `${date.getDate()} ${MK_MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
};

const FILTER_CHIPS = ['', 'active', 'expiring', 'expired', 'draft'];

export default function Contracts() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ items: [], total: 0, page: 1, totalPages: 1 });
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get('/api/contracts', {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: status || undefined, q: q || undefined, page }
      });
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при вчитување на договорите.');
    } finally {
      setLoading(false);
    }
  }, [token, status, q, page]);

  useEffect(() => { load(); }, [load]);

  const nextDue = (c) => {
    const pending = (c.obligations || [])
      .filter((o) => o.status === 'pending' && o.dueAt)
      .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
    return pending[0] || null;
  };

  return (
    <TerminalShell>
      <div className={styles.page}>
        <div className={styles.headRow}>
          <div>
            <h1 className={styles.title}>Договори</h1>
            <p className={styles.subtitle}>
              Следете ги договорите на вашата фирма — рокови, обврски и автоматски
              потсетници пред истек.
            </p>
          </div>
          <Link to="/terminal/contracts/new" className={styles.primaryBtn}>+ Нов договор</Link>
        </div>

        <div className={styles.filters}>
          <input
            type="search"
            className={styles.search}
            placeholder="Пребарај по наслов или друга страна…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
          <div className={styles.statusChips}>
            {FILTER_CHIPS.map((s) => (
              <button
                key={s || 'all'}
                type="button"
                className={`${styles.chip} ${status === s ? styles.chipActive : ''}`}
                onClick={() => { setStatus(s); setPage(1); }}
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
          ) : data.items.length === 0 ? (
            <div className={styles.empty}>
              {q || status
                ? 'Нема договори што одговараат на филтерот.'
                : 'Сè уште немате договори. Додадете го првиот — рачно, со прикачување, или со „Зачувај во Договори" по генерирање документ.'}
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Наслов</th>
                  <th>Друга страна</th>
                  <th>Статус</th>
                  <th>Истекува</th>
                  <th>Следна обврска</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((c) => {
                  const due = nextDue(c);
                  return (
                    <tr key={c._id} onClick={() => navigate(`/terminal/contracts/${c._id}`)}>
                      <td><strong>{c.title}</strong></td>
                      <td>{c.counterparty?.name || '—'}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[`badge_${c.status}`]}`}>
                          {STATUS_LABEL[c.status] || c.status}
                        </span>
                      </td>
                      <td>{fmtDate(c.dates?.expiresAt)}</td>
                      <td>{due ? `${due.label} · ${fmtDate(due.dueAt)}` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {data.totalPages > 1 && (
          <div className={styles.formActions}>
            <button type="button" className={styles.secondaryBtn} disabled={page <= 1} onClick={() => setPage(page - 1)}>← Претходна</button>
            <span className={styles.hint}>Страница {data.page} / {data.totalPages}</span>
            <button type="button" className={styles.secondaryBtn} disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Следна →</button>
          </div>
        )}
      </div>
    </TerminalShell>
  );
}
