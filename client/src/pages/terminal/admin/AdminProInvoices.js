import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from '../UserAccount.module.css';

const STATUS_LABEL = { issued: 'Неплатена', paid: 'Платена', cancelled: 'Откажана' };
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const fmtEur  = (n) => `${Number(n || 0).toFixed(2)} EUR`;
const fmtMkd  = (n) => `${Number(n || 0).toLocaleString('mk-MK')} ден`;

export default function AdminProInvoices() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [ok, setOk]   = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 50;

  const year = new Date().getFullYear();
  const [counter, setCounter] = useState(null);
  const [nextInput, setNextInput] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('page', String(page));
    if (statusFilter) params.set('status', statusFilter);
    axios.get(`/api/admin/pro-invoices?${params.toString()}`, { headers })
      .then(res => { setRows(res.data?.items || []); setTotal(res.data?.total || 0); })
      .catch(e => setErr(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [token, page, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const loadCounter = useCallback(() => {
    if (!token) return;
    axios.get(`/api/admin/pro-invoices/counter?year=${year}`, { headers })
      .then(res => {
        setCounter(res.data?.counter || null);
        setNextInput(String(res.data?.counter?.next ?? ''));
      })
      .catch(() => {});
  }, [token, year]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadCounter(); }, [loadCounter]);

  const saveNext = async () => {
    try {
      const res = await axios.put('/api/admin/pro-invoices/counter', { year, next: Number(nextInput) }, { headers });
      setCounter(res.data?.counter || null);
      setOk(`Следниот број е поставен на ${res.data?.counter?.next}.`);
      setTimeout(() => setOk(null), 2500);
    } catch (e) { setErr(e.response?.data?.message || e.message); }
  };

  const resequence = async () => {
    if (!window.confirm(`Ова ќе ги пренумерира сите профактури за ${year} по редослед на издавање (1…N), за да се совпаѓаат со листата. Продолжи?`)) return;
    try {
      const res = await axios.post('/api/admin/pro-invoices/resequence', { year }, { headers });
      setOk(`Пренумерирани ${res.data?.result?.renumbered ?? 0} профактури.`);
      load();
      loadCounter();
      setTimeout(() => setOk(null), 2500);
    } catch (e) { setErr(e.response?.data?.message || e.message); }
  };

  const setStatus = async (row, status) => {
    try {
      await axios.patch(`/api/admin/pro-invoices/${row._id}/status`, { status }, { headers });
      setOk(`Статусот е променет на „${STATUS_LABEL[status]}".`);
      load();
      setTimeout(() => setOk(null), 2500);
    } catch (e) { setErr(e.response?.data?.message || e.message); }
  };

  const remove = async (row) => {
    if (!window.confirm(`Сигурно бришете ја профактура бр. ${row.number}?`)) return;
    try {
      await axios.delete(`/api/admin/pro-invoices/${row._id}`, { headers });
      setOk('Профактурата е избришана.');
      load();
      setTimeout(() => setOk(null), 2500);
    } catch (e) { setErr(e.response?.data?.message || e.message); }
  };

  const isOverdue = (row) =>
    row.status === 'issued' && row.dueAt && new Date(row.dueAt) < new Date();

  return (
    <TerminalShell>
      <div className={styles.page} style={{ maxWidth: 1180 }}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Админ · Профактури</span>
          <h1 className={styles.title}>Управување со профактури</h1>
          <p className={styles.lead}>
            Сите авто-генерирани профактури при претплата. Рокот на плаќање е 3 дена.
            Профактури кои не се платени можете рачно да ги избришете или означите како откажани.
          </p>
        </header>

        {ok && <div className={styles.toastOk}>{ok}</div>}
        {err && <div className={styles.toastError}>{err}</div>}

        <section className={styles.panel} style={{ marginBottom: 16 }}>
          <div className={styles.panelHead}>Нумерација ({year})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', padding: '12px 0 4px' }}>
            <label style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center' }}>
              Следен број:
              <input
                type="number"
                min="1"
                value={nextInput}
                onChange={(e) => setNextInput(e.target.value)}
                style={{ width: 84, marginLeft: 8, padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 }}
              />
            </label>
            <button type="button" className={styles.btnSecondary} onClick={saveNext}>Зачувај</button>
            <span style={{ fontSize: 12.5, color: '#94a3b8' }}>
              Издадени: {counter?.count ?? 0} · последен искористен број: {counter?.maxUsed ?? 0}
            </span>
            <button type="button" className={styles.iconBtn} onClick={resequence} style={{ marginLeft: 'auto' }}>
              Усогласи нумерација со листата
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '6px 0 0' }}>
            „Следен број" го одредува бројот на следната нова профактура. „Усогласи нумерација"
            ги пренумерира постоечките по редослед на издавање (1…N).
          </p>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Профактури ({total})</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13 }}
            >
              <option value="">Сите статуси</option>
              <option value="issued">Неплатени</option>
              <option value="paid">Платени</option>
              <option value="cancelled">Откажани</option>
            </select>
          </div>

          {loading ? (
            <div className={styles.spinner}>Се вчитува…</div>
          ) : rows.length === 0 ? (
            <div className={styles.emptyState}>Нема профактури.</div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className={styles.invoiceTable}>
                <thead>
                  <tr>
                    <th>Број</th>
                    <th>Купувач</th>
                    <th>План</th>
                    <th>Износ</th>
                    <th>Издадена</th>
                    <th>Рок</th>
                    <th>Статус</th>
                    <th className={styles.colActions}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r._id} style={isOverdue(r) ? { background: '#FEF2F2' } : undefined}>
                      <td><strong>{r.number}</strong></td>
                      <td>{r.buyer?.companyName || '—'}<br/>
                        <span style={{ color: '#94a3b8', fontSize: 11.5 }}>{r.buyer?.email}</span></td>
                      <td>{r.planLabel} · {r.cycle}</td>
                      <td className={styles.colAmount}>
                        {fmtEur(r.amounts?.eur)}<br/>
                        <span style={{ color: '#94a3b8', fontSize: 11.5 }}>{fmtMkd(r.amounts?.mkd)}</span>
                      </td>
                      <td>{fmtDate(r.issuedAt)}</td>
                      <td>{fmtDate(r.dueAt)}{isOverdue(r) && <span style={{ color: '#B91C1C', fontSize: 11 }}> ⚠ изминат</span>}</td>
                      <td>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
                          background: r.status === 'paid' ? '#ECFDF5' : r.status === 'cancelled' ? '#F1F5F9' : '#FFFBEB',
                          color:      r.status === 'paid' ? '#15803D' : r.status === 'cancelled' ? '#475569' : '#92400E',
                          border: '1px solid', borderColor:
                                      r.status === 'paid' ? '#BBF7D0' : r.status === 'cancelled' ? '#e5e7eb' : '#FCD34D'
                        }}>{STATUS_LABEL[r.status]}</span>
                      </td>
                      <td className={styles.colActions}>
                        {r.status === 'issued' && (
                          <button type="button" className={styles.iconBtn} onClick={() => setStatus(r, 'paid')}>Платена</button>
                        )}
                        {r.status === 'issued' && (
                          <button type="button" className={styles.iconBtn} onClick={() => setStatus(r, 'cancelled')}>Откажи</button>
                        )}
                        <button type="button" className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => remove(r)}>Избриши</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {total > limit && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <button type="button" className={styles.btnSecondary} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Претходна</button>
              <span style={{ fontSize: 13, color: '#64748b' }}>Страница {page} од {Math.ceil(total / limit)}</span>
              <button type="button" className={styles.btnSecondary} disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}>Следна →</button>
            </div>
          )}
        </section>
      </div>
    </TerminalShell>
  );
}
