import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from './AllUsers.module.css';

const ROLE_LABEL = {
  regular:        'Регистриран',
  standard_user:  'Стандарден',
  admin_user:     'Admin',
  sub_seat:       'Под-седиште',
  admin:          'Платформа админ',
  verified:       'Стандарден (стар)'
};
const PLAN_LABEL = {
  standard: 'Standard',
  admin_5:  'Admin · 5',
  admin_10: 'Admin · 10',
  admin:    'Admin · 5'
};
const SUB_STATUS_LABEL = {
  trial:            'Пробен',
  pending_approval: 'На чекање',
  active:           'Активен',
  suspended:        'Суспендиран',
  cancelled:        'Откажан'
};
const FILTERS = [
  { key: '',                  label: 'Сите' },
  { key: 'role:admin_user',   label: 'Admin корисници' },
  { key: 'role:standard_user',label: 'Стандардни' },
  { key: 'role:sub_seat',     label: 'Под-седишта' },
  { key: 'status:trial',      label: 'Во пробен' },
  { key: 'status:pending_approval', label: 'На чекање' },
  { key: 'status:active',     label: 'Активни' },
  { key: 'status:suspended',  label: 'Суспендирани' }
];

const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date) ? '—' : date.toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: '2-digit' });
};
const daysLeft = (d) => {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
};

export default function AllUsers() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [detail, setDetail] = useState(null);
  const [credsReveal, setCredsReveal] = useState(null); // { email, tempPassword }

  const fetchList = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page, pageSize: 25 });
      if (q.trim()) params.set('q', q.trim());
      if (filter.startsWith('role:'))   params.set('role',   filter.slice(5));
      if (filter.startsWith('status:')) params.set('status', filter.slice(7));
      const res = await axios.get(`/api/admin/all-users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setLoading(false); }
  }, [page, filter, q, token]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const showFlash = (m) => { setFlash(m); setTimeout(() => setFlash(''), 3500); };

  return (
    <TerminalShell>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>Сите корисници</h1>
          <p>Управувајте со улоги, лозинки, претплати и под-седишта.</p>
        </div>

        <div className={styles.toolbar}>
          <input
            type="text"
            className={styles.search}
            value={q}
            onChange={e => { setPage(1); setQ(e.target.value); }}
            placeholder="Барај по име, е-пошта, фирма…"
          />
          <div className={styles.filterChips}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={`${styles.chip} ${filter === f.key ? styles.chipActive : ''}`}
                onClick={() => { setPage(1); setFilter(f.key); }}
              >{f.label}</button>
            ))}
          </div>
        </div>

        {flash && <div className={styles.flash}>{flash}</div>}
        {error && <div className={styles.error}>{error}</div>}
        {credsReveal && (
          <CredsReveal {...credsReveal} onClose={() => setCredsReveal(null)} />
        )}

        <div className={styles.tableWrap}>
          {loading ? <div className={styles.loading}>Се вчитува…</div> :
           items.length === 0 ? <div className={styles.empty}>Нема корисници кои одговараат.</div> : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Корисник</th>
                  <th>Улога</th>
                  <th>План</th>
                  <th>Претплата</th>
                  <th>Истекува</th>
                  <th>Регистриран</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(u => {
                  const sub = u.subscription || {};
                  const dl = daysLeft(sub.endsAt);
                  return (
                    <tr key={u._id} onClick={() => setDetail(u._id)} className={styles.rowClickable}>
                      <td>
                        <div className={styles.userName}>{u.fullName || u.username || '—'}</div>
                        <div className={styles.userEmail}>{u.email || '—'}</div>
                        {u.companyInfo?.companyName && (
                          <div className={styles.userCompany}>{u.companyInfo.companyName}</div>
                        )}
                      </td>
                      <td>
                        <span className={`${styles.roleTag} ${styles[`role_${u.role}`] || ''}`}>
                          {ROLE_LABEL[u.role] || u.role || '—'}
                        </span>
                      </td>
                      <td>{sub.plan ? (PLAN_LABEL[sub.plan] || sub.plan) : '—'}</td>
                      <td>
                        <span className={`${styles.statusTag} ${styles[`status_${sub.status}`] || ''}`}>
                          {SUB_STATUS_LABEL[sub.status] || sub.status || '—'}
                        </span>
                      </td>
                      <td>
                        {fmtDate(sub.endsAt)}
                        {dl !== null && dl <= 14 && dl > 0 && (
                          <span className={styles.daysWarn}> · {dl}д</span>
                        )}
                      </td>
                      <td className={styles.dim}>{fmtDate(u.createdAt)}</td>
                      <td className={styles.actions}>
                        <button className={styles.btnGhost} onClick={(e) => { e.stopPropagation(); setDetail(u._id); }}>
                          Управувај
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {total > 25 && (
          <div className={styles.pager}>
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>← Претходна</button>
            <span>Страница {page} од {Math.ceil(total / 25)} · {total} вкупно</span>
            <button disabled={page * 25 >= total} onClick={() => setPage(page + 1)}>Следна →</button>
          </div>
        )}

        {detail && (
          <UserDetailDrawer
            userId={detail}
            token={token}
            onClose={() => setDetail(null)}
            onReveal={(payload) => setCredsReveal(payload)}
            onAfterAction={fetchList}
            showFlash={showFlash}
          />
        )}
      </div>
    </TerminalShell>
  );
}

// ---------- credentials reveal card (after reset password) ----------
function CredsReveal({ email, tempPassword, onClose }) {
  const copy = (txt) => navigator.clipboard?.writeText(txt).catch(() => {});
  return (
    <div className={styles.credCard}>
      <div className={styles.credHead}>
        <strong>✓ Лозинката е ресетирана</strong>
        <button type="button" className={styles.btnTiny} onClick={onClose}>Затвори</button>
      </div>
      <p className={styles.credHint}>
        Споделете ги овие податоци со корисникот. При првото најавување ќе биде побарано да постави своја лозинка.
      </p>
      <div className={styles.credRow}>
        <span className={styles.credLabel}>Е-пошта</span>
        <code>{email}</code>
        <button type="button" className={styles.btnTiny} onClick={() => copy(email)}>Копирај</button>
      </div>
      <div className={styles.credRow}>
        <span className={styles.credLabel}>Лозинка</span>
        <code>{tempPassword}</code>
        <button type="button" className={styles.btnTiny} onClick={() => copy(tempPassword)}>Копирај</button>
      </div>
    </div>
  );
}

// ---------- detail drawer ----------
function UserDetailDrawer({ userId, token, onClose, onReveal, onAfterAction, showFlash }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [showRoleForm, setShowRoleForm] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const res = await axios.get(`/api/admin/all-users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } });
      setData(res.data);
    } catch (e) {
      setErr(e.response?.data?.message || e.message);
    } finally { setLoading(false); }
  }, [userId, token]);

  useEffect(() => { reload(); }, [reload]);

  const doAction = async (label, fn) => {
    setBusy(true); setErr('');
    try {
      await fn();
      showFlash('✓ ' + label);
      await reload();
      onAfterAction();
    } catch (e) {
      setErr(e.response?.data?.message || e.message);
    } finally { setBusy(false); }
  };

  const onResetPassword = () => {
    if (!window.confirm('Генерирај нова привремена лозинка за овој корисник?')) return;
    doAction('Лозинката е ресетирана', async () => {
      const res = await axios.post(`/api/admin/all-users/${userId}/reset-password`, {},
        { headers: { Authorization: `Bearer ${token}` } });
      onReveal({ email: data.user.email, tempPassword: res.data.tempPassword });
    });
  };

  const onSuspend = () => {
    if (!window.confirm('Суспендирај го корисникот? Податоците остануваат.')) return;
    doAction('Суспендирано', async () => {
      await axios.post(`/api/admin/subscriptions/${userId}/suspend`, {},
        { headers: { Authorization: `Bearer ${token}` } });
    });
  };

  const onExtend = (days) => {
    doAction(`Продолжено за ${days} дена`, async () => {
      await axios.post(`/api/admin/subscriptions/${userId}/extend`, { days },
        { headers: { Authorization: `Bearer ${token}` } });
    });
  };

  return (
    <div className={styles.drawerBackdrop} onClick={onClose}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        <div className={styles.drawerHead}>
          <h2>Детали за корисник</h2>
          <button type="button" className={styles.btnGhost} onClick={onClose}>Затвори</button>
        </div>

        {loading ? <div className={styles.loading}>Се вчитува…</div> :
         err ? <div className={styles.error}>{err}</div> :
         data ? (
          <>
            <div className={styles.profileBlock}>
              <h3>{data.user.fullName || data.user.username || data.user.email}</h3>
              <div className={styles.dim}>{data.user.email}</div>
              {data.user.companyInfo?.companyName && (
                <div className={styles.dim}>{data.user.companyInfo.companyName}</div>
              )}
            </div>

            <div className={styles.kv}>
              <span>Улога</span><strong>{ROLE_LABEL[data.user.role] || data.user.role}</strong>
              <span>Активна</span><strong>{data.user.isActive ? 'Да' : 'Не'}</strong>
              <span>Мора да смени лозинка</span><strong>{data.user.mustChangePassword ? 'Да' : 'Не'}</strong>
              <span>Регистриран</span><strong>{fmtDate(data.user.createdAt)}</strong>
            </div>

            {data.user.subscription && (
              <>
                <h4 className={styles.subhead}>Претплата</h4>
                <div className={styles.kv}>
                  <span>Статус</span><strong>{SUB_STATUS_LABEL[data.user.subscription.status] || data.user.subscription.status}</strong>
                  <span>План</span><strong>{PLAN_LABEL[data.user.subscription.plan] || data.user.subscription.plan || '—'}</strong>
                  <span>Циклус</span><strong>{data.user.subscription.cycle || '—'}</strong>
                  <span>Истекува</span><strong>{fmtDate(data.user.subscription.endsAt)}</strong>
                  <span>Фактура</span><strong>{data.user.subscription.invoiceNumber || '—'}</strong>
                  {data.user.subscription.gracePeriod?.used && (
                    <>
                      <span>Гејс искористен</span>
                      <strong>{fmtDate(data.user.subscription.gracePeriod.startedAt)} → {fmtDate(data.user.subscription.gracePeriod.endsAt)}</strong>
                    </>
                  )}
                </div>
              </>
            )}

            {data.parent && (
              <>
                <h4 className={styles.subhead}>Родителска фирма</h4>
                <div className={styles.parentBox}>
                  <strong>{data.parent.fullName || data.parent.username || data.parent.email}</strong>
                  <div className={styles.dim}>{data.parent.email}</div>
                </div>
              </>
            )}

            {data.subSeats && data.subSeats.length > 0 && (
              <>
                <h4 className={styles.subhead}>Под-седишта ({data.subSeats.length})</h4>
                <ul className={styles.seatList}>
                  {data.subSeats.map(s => (
                    <li key={s._id}>
                      <div>
                        <strong>{s.fullName || s.email}</strong>
                        <div className={styles.dim}>{s.email}</div>
                      </div>
                      <span className={`${styles.statusTag} ${s.isActive ? styles.status_active : styles.status_suspended}`}>
                        {s.isActive ? 'Активно' : 'Отповикано'}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <h4 className={styles.subhead}>Акции</h4>
            <div className={styles.actionGrid}>
              <button className={styles.btnPrimary} disabled={busy} onClick={onResetPassword}>
                🔑 Ресетирај лозинка
              </button>
              {data.user.subscription?.status === 'active' && (
                <>
                  <button className={styles.btnGhost} disabled={busy} onClick={() => onExtend(7)}>Продолжи 7 дена</button>
                  <button className={styles.btnGhost} disabled={busy} onClick={() => onExtend(30)}>Продолжи 30 дена</button>
                </>
              )}
              {data.user.subscription?.status !== 'suspended' && data.user.role !== 'admin' && data.user.role !== 'sub_seat' && (
                <button className={styles.btnDanger} disabled={busy} onClick={onSuspend}>
                  ⛔ Суспендирај
                </button>
              )}
              {data.user.role !== 'admin' && data.user.role !== 'sub_seat' && (
                <button className={styles.btnGhost} disabled={busy} onClick={() => setShowRoleForm(true)}>
                  Промени улога
                </button>
              )}
            </div>

            {showRoleForm && (
              <RoleChangeForm
                user={data.user}
                token={token}
                onCancel={() => setShowRoleForm(false)}
                onDone={(msg) => {
                  setShowRoleForm(false);
                  showFlash(msg);
                  reload();
                  onAfterAction();
                }}
              />
            )}
          </>
         ) : null}
      </div>
    </div>
  );
}

function RoleChangeForm({ user, token, onCancel, onDone }) {
  const [newRole, setNewRole] = useState(user.role === 'admin_user' ? 'standard_user' : 'admin_user');
  const [plan, setPlan] = useState('admin_5');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setBusy(true); setErr('');
    try {
      const body = { newRole };
      if (newRole === 'admin_user') body.plan = plan;
      await axios.post(`/api/admin/all-users/${user._id}/change-role`, body,
        { headers: { Authorization: `Bearer ${token}` } });
      onDone(`Улогата е променета на ${ROLE_LABEL[newRole]}`);
    } catch (e) {
      setErr(e.response?.data?.message || e.message);
    } finally { setBusy(false); }
  };

  return (
    <div className={styles.roleForm}>
      <h4 className={styles.subhead}>Промена на улога</h4>
      <label className={styles.fieldLabel}>Нова улога</label>
      <select value={newRole} onChange={e => setNewRole(e.target.value)}>
        <option value="standard_user">Стандарден</option>
        <option value="admin_user">Admin корисник</option>
        <option value="regular">Регистриран (без план)</option>
      </select>

      {newRole === 'admin_user' && (
        <>
          <label className={styles.fieldLabel}>Admin план (определува лимит на седишта)</label>
          <select value={plan} onChange={e => setPlan(e.target.value)}>
            <option value="admin_5">Admin · 5 седишта</option>
            <option value="admin_10">Admin · 10 седишта</option>
          </select>
        </>
      )}

      {err && <div className={styles.error}>{err}</div>}

      <div className={styles.roleFormActions}>
        <button className={styles.btnGhost} onClick={onCancel} disabled={busy}>Откажи</button>
        <button className={styles.btnPrimary} onClick={submit} disabled={busy}>
          {busy ? 'Се применува…' : 'Примени'}
        </button>
      </div>
    </div>
  );
}
