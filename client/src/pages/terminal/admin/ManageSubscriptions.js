import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from './ManageSubscriptions.module.css';

const PLAN_LABEL = { standard: 'Standard', admin: 'Admin · 5', admin_5: 'Admin · 5', admin_10: 'Admin · 10' };
const PLAN_SEATS = { standard: 0, admin_5: 5, admin_10: 10 };
const CYCLE_LABEL = { monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual' };
const STATUS_LABEL = {
  trial: 'Trial',
  pending_approval: 'Pending',
  active: 'Active',
  suspended: 'Suspended',
  cancelled: 'Cancelled'
};
const TABS = [
  { key: 'pending_approval', label: 'Pending approval' },
  { key: 'active', label: 'Active' },
  { key: 'trial', label: 'Trial' },
  { key: 'suspended', label: 'Suspended' }
];

const PLAN_PRICES = {
  standard: { monthly: 40,  quarterly: 90,  annual: 360 },
  admin_5:  { monthly: 80,  quarterly: 240, annual: 720 },
  admin_10: { monthly: 150, quarterly: 450, annual: 1350 }
};

// Sort: in the Pending Approval tab, grace-active users float to the top
// (sorted by hours remaining, ascending), then everyone else by requestedAt asc.
const sortPending = (items, tab) => {
  if (tab !== 'pending_approval') return items;
  const now = Date.now();
  const isGrace = (u) => {
    const ge = u.subscription?.gracePeriod?.endsAt;
    return ge && new Date(ge).getTime() > now;
  };
  const hoursLeft = (u) => Math.max(0, (new Date(u.subscription?.gracePeriod?.endsAt).getTime() - now) / 3600000);
  return [...items].sort((a, b) => {
    const ag = isGrace(a), bg = isGrace(b);
    if (ag && !bg) return -1;
    if (!ag && bg) return 1;
    if (ag && bg) return hoursLeft(a) - hoursLeft(b);
    const ar = new Date(a.subscription?.requestedAt || a.createdAt || 0).getTime();
    const br = new Date(b.subscription?.requestedAt || b.createdAt || 0).getTime();
    return ar - br;
  });
};

const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return '—';
  return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' });
};

const daysRemaining = (d) => {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
};

export default function ManageSubscriptions() {
  const { token } = useAuth();
  const [tab, setTab] = useState('pending_approval');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [extendTarget, setExtendTarget] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const url = tab === 'pending_approval'
        ? '/api/admin/subscriptions/pending'
        : `/api/admin/subscriptions?status=${tab}`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setItems(res.data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [tab, token]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 3500); };

  const onApprove = async (form) => {
    try {
      await axios.post(
        `/api/admin/subscriptions/${approveTarget._id}/approve`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApproveTarget(null);
      showFlash(`✓ Approved ${approveTarget.email}`);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const onReject = async (reason) => {
    try {
      await axios.post(
        `/api/admin/subscriptions/${rejectTarget._id}/reject`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRejectTarget(null);
      showFlash(`✓ Rejected ${rejectTarget.email}`);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const onExtend = async (days) => {
    try {
      await axios.post(
        `/api/admin/subscriptions/${extendTarget._id}/extend`,
        { days },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExtendTarget(null);
      showFlash(`✓ Extended by ${days} days`);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const onSuspend = async (user) => {
    if (!window.confirm(`Suspend ${user.email}?`)) return;
    try {
      await axios.post(
        `/api/admin/subscriptions/${user._id}/suspend`,
        { reason: 'manual-admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showFlash(`✓ Suspended ${user.email}`);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <TerminalShell>
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Subscriptions</h1>
        <p>Review pending requests, manage active subscriptions, and handle renewals.</p>
      </div>

      <nav className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
            onClick={() => setTab(t.key)}
          >{t.label}</button>
        ))}
      </nav>

      {flash && <div className={styles.flash}>{flash}</div>}
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.loading}>Loading…</div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>Nothing in this tab.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Plan</th>
                <th>Cycle</th>
                <th>Status</th>
                <th>Ends</th>
                <th>Invoice</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortPending(items, tab).map(u => {
                const sub = u.subscription || {};
                const dr = daysRemaining(sub.endsAt);
                const plan = sub.plan || sub.requestedPlan;
                const cycle = sub.cycle === 'trial' ? '—' : (sub.cycle || sub.requestedCycle);
                const graceEndsAt = sub.gracePeriod?.endsAt;
                const graceHoursLeft = graceEndsAt
                  ? Math.max(0, Math.floor((new Date(graceEndsAt).getTime() - Date.now()) / 3600000))
                  : null;
                const inGrace = graceEndsAt && new Date(graceEndsAt) > new Date();
                const graceExpired = sub.gracePeriod?.used && graceEndsAt && new Date(graceEndsAt) <= new Date();
                return (
                  <tr key={u._id} className={inGrace ? styles.rowUrgent : ''}>
                    <td>
                      <div className={styles.userName}>{u.fullName || u.username || '—'}</div>
                      <div className={styles.userEmail}>{u.email}</div>
                    </td>
                    <td><span className={styles.roleTag}>{u.role}</span></td>
                    <td>{plan ? PLAN_LABEL[plan] || plan : '—'}</td>
                    <td>{cycle ? (CYCLE_LABEL[cycle] || cycle) : '—'}</td>
                    <td>
                      <span className={`${styles.statusTag} ${styles[`status_${sub.status}`] || ''}`}>
                        {STATUS_LABEL[sub.status] || sub.status || '—'}
                      </span>
                      {inGrace && (
                        <span className={styles.graceTag} title={`Grace ends ${new Date(graceEndsAt).toLocaleString('en-GB')}`}>
                          ⏱ Grace · {graceHoursLeft}h
                        </span>
                      )}
                      {graceExpired && sub.status === 'pending_approval' && (
                        <span className={styles.graceExpired} title="3-day grace window already expired — user is blocked">
                          Grace expired
                        </span>
                      )}
                    </td>
                    <td>
                      {fmtDate(sub.endsAt)}
                      {dr !== null && dr <= 14 && dr > 0 && (
                        <span className={styles.daysWarn}> · {dr}d</span>
                      )}
                    </td>
                    <td className={styles.mono}>{sub.invoiceNumber || '—'}</td>
                    <td className={styles.actions}>
                      {sub.status === 'pending_approval' && (
                        <>
                          <button className={styles.btnPrimary} onClick={() => setApproveTarget(u)}>Approve</button>
                          <button className={styles.btnGhost}   onClick={() => setRejectTarget(u)}>Reject</button>
                        </>
                      )}
                      {(sub.status === 'active' || sub.status === 'trial') && (
                        <>
                          <button className={styles.btnGhost} onClick={() => setExtendTarget(u)}>Extend</button>
                          <button className={styles.btnDanger} onClick={() => onSuspend(u)}>Suspend</button>
                        </>
                      )}
                      {sub.status === 'suspended' && (
                        <button className={styles.btnPrimary} onClick={() => setApproveTarget(u)}>Reactivate</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {approveTarget && (
        <ApproveModal
          user={approveTarget}
          onCancel={() => setApproveTarget(null)}
          onSubmit={onApprove}
        />
      )}
      {rejectTarget && (
        <RejectModal
          user={rejectTarget}
          onCancel={() => setRejectTarget(null)}
          onSubmit={onReject}
        />
      )}
      {extendTarget && (
        <ExtendModal
          user={extendTarget}
          onCancel={() => setExtendTarget(null)}
          onSubmit={onExtend}
        />
      )}
    </div>
    </TerminalShell>
  );
}

// -------------------- modals -------------------- //

function ApproveModal({ user, onCancel, onSubmit }) {
  const sub = user.subscription || {};
  // Normalize legacy 'admin' → 'admin_5'
  const initialPlan = (sub.requestedPlan || sub.plan) === 'admin'
    ? 'admin_5'
    : (sub.requestedPlan || sub.plan || 'standard');
  const [plan, setPlan]   = useState(initialPlan);
  const [cycle, setCycle] = useState(sub.requestedCycle || sub.cycle || 'monthly');
  const [invoice, setInvoice] = useState('');
  const [notes, setNotes] = useState('');
  const price = PLAN_PRICES[plan]?.[cycle];

  return (
    <div className={styles.modalBackdrop} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Approve subscription</h2>
        <p className={styles.modalSub}>{user.fullName || user.username} — {user.email}</p>

        <label className={styles.field}>
          Plan
          <select value={plan} onChange={e => setPlan(e.target.value)}>
            <option value="standard">Standard</option>
            <option value="admin_5">Admin · 5 seats</option>
            <option value="admin_10">Admin · 10 seats</option>
          </select>
        </label>

        <label className={styles.field}>
          Cycle
          <select value={cycle} onChange={e => setCycle(e.target.value)}>
            <option value="monthly">Monthly (30 days)</option>
            <option value="quarterly">Quarterly (90 days)</option>
            <option value="annual">Annual (365 days)</option>
          </select>
        </label>

        {price !== undefined && (
          <div className={styles.priceLine}>
            Price: <strong>€{price}</strong> (≈ €{Math.round(price / ({monthly:1,quarterly:3,annual:12}[cycle]))}/mo effective)
            {PLAN_SEATS[plan] > 0 && <> · <strong>{PLAN_SEATS[plan]}</strong> seats included</>}
          </div>
        )}

        <label className={styles.field}>
          Invoice number
          <input
            type="text"
            value={invoice}
            onChange={e => setInvoice(e.target.value)}
            placeholder="e.g. INV-2026-042"
          />
        </label>

        <label className={styles.field}>
          Notes (internal)
          <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        </label>

        <div className={styles.modalActions}>
          <button className={styles.btnGhost} onClick={onCancel}>Cancel</button>
          <button
            className={styles.btnPrimary}
            onClick={() => onSubmit({ plan, cycle, invoiceNumber: invoice, notes })}
          >Approve & activate</button>
        </div>
      </div>
    </div>
  );
}

function RejectModal({ user, onCancel, onSubmit }) {
  const [reason, setReason] = useState('');
  return (
    <div className={styles.modalBackdrop} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Reject request</h2>
        <p className={styles.modalSub}>{user.email}</p>
        <label className={styles.field}>
          Reason (sent in the rejection email)
          <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} />
        </label>
        <div className={styles.modalActions}>
          <button className={styles.btnGhost} onClick={onCancel}>Cancel</button>
          <button className={styles.btnDanger} onClick={() => onSubmit(reason)}>Reject</button>
        </div>
      </div>
    </div>
  );
}

function ExtendModal({ user, onCancel, onSubmit }) {
  const [days, setDays] = useState(30);
  return (
    <div className={styles.modalBackdrop} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Extend subscription</h2>
        <p className={styles.modalSub}>{user.email}</p>
        <label className={styles.field}>
          Days to add
          <select value={days} onChange={e => setDays(parseInt(e.target.value))}>
            <option value={7}>7 days (grace)</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days (monthly)</option>
            <option value={90}>90 days (quarterly)</option>
            <option value={365}>365 days (annual)</option>
          </select>
        </label>
        <div className={styles.modalActions}>
          <button className={styles.btnGhost} onClick={onCancel}>Cancel</button>
          <button className={styles.btnPrimary} onClick={() => onSubmit(days)}>Extend</button>
        </div>
      </div>
    </div>
  );
}
