import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
// Shared visual vocabulary with Договори — same registry UI, same classes.
import styles from '../contracts/Contracts.module.css';

export const STATUS_LABEL = { active: 'Активен', terminated: 'Прекинат' };

// Hardcoded — toLocaleDateString('mk-MK') falls back to English in browsers
// without the Macedonian locale data.
const MK_MONTHS_SHORT = ['јан', 'фев', 'мар', 'апр', 'мај', 'јун', 'јул', 'авг', 'сеп', 'окт', 'ное', 'дек'];

export const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return '—';
  return `${date.getDate()} ${MK_MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
};

const FILTER_CHIPS = ['', 'active', 'terminated'];
const DAY_MS = 86400000;

export default function Employees() {
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
      const res = await axios.get('/api/employees', {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: status || undefined, q: q || undefined, page }
      });
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при вчитување на вработените.');
    } finally {
      setLoading(false);
    }
  }, [token, status, q, page]);

  useEffect(() => { load(); }, [load]);

  const contractBadge = (e) => {
    if (e.employmentType !== 'определено' || !e.contractEndsAt) return null;
    const daysLeft = Math.ceil((new Date(e.contractEndsAt) - Date.now()) / DAY_MS);
    const cls = daysLeft <= 30 ? styles.badge_expiring : styles.badge_active;
    return (
      <span className={`${styles.badge} ${cls}`}>
        до {fmtDate(e.contractEndsAt)}
      </span>
    );
  };

  return (
    <TerminalShell>
      <div className={styles.page}>
        <div className={styles.headRow}>
          <div>
            <h1 className={styles.title}>Вработени</h1>
            <p className={styles.subtitle}>
              Регистар на вработените во вашата фирма — договори, годишен одмор и
              автоматски потсетници за рокови.
            </p>
          </div>
          <Link to="/terminal/employees/new" className={styles.primaryBtn}>+ Нов вработен</Link>
        </div>

        <div className={styles.filters}>
          <input
            type="search"
            className={styles.search}
            placeholder="Пребарај по име…"
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
                ? 'Нема вработени што одговараат на филтерот.'
                : 'Сè уште немате вработени во регистарот. Додадете го првиот — потоа документите за вработените се пополнуваат автоматски.'}
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Име и презиме</th>
                  <th>Позиција</th>
                  <th>Вработување</th>
                  <th>Статус</th>
                  <th>Одмор {new Date().getFullYear()}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((e) => (
                  <tr key={e._id} onClick={() => navigate(`/terminal/employees/${e._id}`)}>
                    <td><strong>{e.fullName}</strong></td>
                    <td>{e.position || '—'}</td>
                    <td>
                      {e.employmentType}
                      {' '}
                      {contractBadge(e)}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${e.status === 'active' ? styles.badge_active : styles.badge_terminated}`}>
                        {STATUS_LABEL[e.status] || e.status}
                      </span>
                    </td>
                    <td>{e.currentYearBalance}/{e.annualLeaveDays} дена</td>
                  </tr>
                ))}
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
