import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import styles from './UserAccount.module.css';

/**
 * Сметководство — list of paid invoices for the current user.
 * Admin (Martin) sees add/edit/delete affordances. Admin can target another
 * user via ?user=<userId>.
 */

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
const fmtAmount = (n, ccy) => `${Number(n || 0).toFixed(2)} ${ccy || 'EUR'}`;
const toInputDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toISOString().slice(0, 10);
};

export default function UserBillingPage() {
  const { token, currentUser } = useAuth();
  const [params] = useSearchParams();
  const targetUserId = params.get('user') || null;
  const isAdmin = currentUser?.role === 'admin';
  const adminScope = isAdmin && targetUserId; // admin acting on another user

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);

  const [editing, setEditing] = useState(null); // null | 'new' | invoiceId
  const [draft, setDraft] = useState({ paymentDate: '', amount: '', invoiceNumber: '', note: '' });

  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    const url = adminScope
      ? `/api/admin/invoices/user/${targetUserId}`
      : '/api/invoices/me';
    axios.get(url, { headers })
      .then(res => setRows(res.data?.invoices || []))
      .catch(e => setErr(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [token, adminScope, targetUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const startNew = () => {
    setDraft({ paymentDate: toInputDate(new Date()), amount: '', invoiceNumber: '', note: '' });
    setEditing('new');
    setErr(null); setOk(null);
  };
  const startEdit = (row) => {
    setDraft({
      paymentDate: toInputDate(row.paymentDate),
      amount: row.amount,
      invoiceNumber: row.invoiceNumber,
      note: row.note || ''
    });
    setEditing(String(row._id));
    setErr(null); setOk(null);
  };
  const cancelEdit = () => { setEditing(null); setErr(null); };

  const save = async () => {
    if (!targetUserId && !isAdmin) return; // safety
    try {
      setErr(null);
      const body = {
        paymentDate: draft.paymentDate,
        amount: Number(draft.amount),
        invoiceNumber: draft.invoiceNumber,
        note: draft.note
      };
      if (editing === 'new') {
        const uid = targetUserId || currentUser._id; // admin must scope to a user via ?user=
        if (!uid) throw new Error('Missing user scope (?user=<id>).');
        await axios.post(`/api/admin/invoices/user/${uid}`, body, { headers });
        setOk('Записот е додаден.');
      } else {
        await axios.put(`/api/admin/invoices/${editing}`, body, { headers });
        setOk('Записот е ажуриран.');
      }
      setEditing(null);
      load();
      setTimeout(() => setOk(null), 2500);
    } catch (e) {
      setErr(e.response?.data?.message || e.message);
    }
  };

  const remove = async (row) => {
    if (!window.confirm('Сигурно сакате да го избришете овој запис?')) return;
    try {
      await axios.delete(`/api/admin/invoices/${row._id}`, { headers });
      setOk('Записот е избришан.');
      load();
      setTimeout(() => setOk(null), 2500);
    } catch (e) {
      setErr(e.response?.data?.message || e.message);
    }
  };

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Сметка</span>
          <h1 className={styles.title}>Сметководство</h1>
          <p className={styles.lead}>
            Записи за уплати — датум на одобрување, износ и број на профактура.
            Записите ги внесува и одржува администраторот по верификација на уплатата.
          </p>
        </header>

        {ok && <div className={styles.toastOk}>{ok}</div>}
        {err && <div className={styles.toastError}>{err}</div>}

        <section className={styles.panel}>
          <div className={styles.panelHead} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Уплати</span>
            {isAdmin && (
              <button type="button" className={styles.btnPrimary} style={{ padding: '6px 12px', fontSize: 12 }} onClick={startNew}>
                + Додај запис
              </button>
            )}
          </div>

          {editing === 'new' && (
            <InvoiceEditor draft={draft} setDraft={setDraft} onSave={save} onCancel={cancelEdit} />
          )}

          {loading ? (
            <div className={styles.spinner}>Се вчитува…</div>
          ) : rows.length === 0 ? (
            <div className={styles.emptyState}>
              Сè уште нема записи за уплата. По првата верификувана уплата, записот ќе се појави овде.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className={styles.invoiceTable}>
              <thead>
                <tr>
                  <th>Датум на одобрување</th>
                  <th>Износ</th>
                  <th>Број на профактура</th>
                  {isAdmin && <th className={styles.colActions}></th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  editing === String(r._id) ? (
                    <tr key={r._id}>
                      <td colSpan={isAdmin ? 4 : 3} style={{ padding: 0 }}>
                        <InvoiceEditor draft={draft} setDraft={setDraft} onSave={save} onCancel={cancelEdit} />
                      </td>
                    </tr>
                  ) : (
                    <tr key={r._id}>
                      <td>{fmtDate(r.paymentDate)}</td>
                      <td className={styles.colAmount}>{fmtAmount(r.amount, r.currency)}</td>
                      <td>{r.invoiceNumber}</td>
                      {isAdmin && (
                        <td className={styles.colActions}>
                          <button type="button" className={styles.iconBtn} onClick={() => startEdit(r)}>Уреди</button>
                          <button type="button" className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => remove(r)}>Избриши</button>
                        </td>
                      )}
                    </tr>
                  )
                ))}
              </tbody>
            </table>
            </div>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>Како функционира уплатата</div>
          <ol className={styles.steps}>
            <li><strong>Изберете план</strong> — преку „Сметка → Изберете план".</li>
            <li><strong>Профактура на е-пошта</strong> — испратена веднаш по нарачката.</li>
            <li><strong>Уплата преку банкарски трансфер</strong> со податоците од профактурата.</li>
            <li><strong>Активирање</strong> — веднашно по верификација на уплатата; записот се појавува овде.</li>
          </ol>
        </section>
      </div>
    </TerminalShell>
  );
}

function InvoiceEditor({ draft, setDraft, onSave, onCancel }) {
  const set = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });
  return (
    <div style={{ padding: 12 }}>
      <div className={styles.editorRow}>
        <div className={styles.field}>
          <label>Датум на одобрување</label>
          <input type="date" value={draft.paymentDate} onChange={set('paymentDate')} />
        </div>
        <div className={styles.field}>
          <label>Износ (EUR)</label>
          <input type="number" step="0.01" min="0" value={draft.amount} onChange={set('amount')} />
        </div>
        <div className={styles.field}>
          <label>Број на профактура</label>
          <input type="text" value={draft.invoiceNumber} onChange={set('invoiceNumber')} placeholder="нпр. PF-2026-0001" />
        </div>
      </div>
      <div className={styles.editorActions} style={{ marginTop: 10 }}>
        <button type="button" className={styles.btnSecondary} onClick={onCancel}>Откажи</button>
        <button type="button" className={styles.btnPrimary} onClick={onSave}>Зачувај</button>
      </div>
    </div>
  );
}
