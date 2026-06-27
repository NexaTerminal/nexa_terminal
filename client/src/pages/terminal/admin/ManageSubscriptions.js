import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from './ManageSubscriptions.module.css';

const PLAN_LABEL = {
  basic: 'Nexa Basic',
  pro:   'Nexa Pro',
  // legacy (pre-migration docs)
  standard: 'Nexa Basic',
  admin:    'Nexa Pro',
  admin_5:  'Nexa Pro',
  admin_10: 'Nexa Pro'
};
const PLAN_SEATS = { basic: 3, pro: 25, standard: 0, admin_5: 5, admin_10: 10 };
const CYCLE_LABEL = { monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual' };
const STATUS_LABEL = {
  none: 'Not activated',
  pending_approval: 'Pending',
  active: 'Active',
  suspended: 'Suspended',
  cancelled: 'Cancelled'
};
const TABS = [
  { key: 'pending_approval', label: 'Pending approval' },
  { key: 'active', label: 'Active' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'codes', label: 'Promo codes' }
];

// Nexa 3.0 EUR prices — must match server/constants/roles.js PLAN_PRICES.
const PLAN_PRICES = {
  basic: { monthly: 19, quarterly: 49, annual: 179 },
  pro:   { monthly: 39, quarterly: 99, annual: 359 },
  // legacy (pre-migration docs)
  standard: { monthly: 19, quarterly: 49,  annual: 179 },
  admin_5:  { monthly: 39, quarterly: 99,  annual: 359 },
  admin_10: { monthly: 59, quarterly: 149, annual: 549 }
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
  const [searchParams] = useSearchParams();
  // Allow deep-linking straight to a tab, e.g. ?tab=codes from the sidebar.
  const initialTab = searchParams.get('tab');
  const [tab, setTab] = useState(
    TABS.some(t => t.key === initialTab) ? initialTab : 'pending_approval'
  );
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [extendTarget, setExtendTarget] = useState(null);

  const fetchItems = useCallback(async () => {
    if (tab === 'codes') return; // codes tab manages its own data
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

  // Sync the active tab when the URL ?tab= changes (e.g. clicking the sidebar
  // "Промо кодови" link while already on this page).
  useEffect(() => {
    const t = searchParams.get('tab');
    setTab(TABS.some(x => x.key === t) ? t : 'pending_approval');
  }, [searchParams]);

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

      {tab === 'codes' ? (
        <PromoCodes token={token} showFlash={showFlash} setError={setError} />
      ) : (
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
                    <td>
                      {plan ? PLAN_LABEL[plan] || plan : '—'}
                      {sub.paidVia === 'promo' && (
                        <span className={styles.graceTag} title="Activated via promo code — €0">Promo</span>
                      )}
                    </td>
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
                      {sub.status === 'active' && (
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
      )}

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
  // Normalize any legacy plan key to the canonical two-tier value.
  const rawPlan = sub.requestedPlan || sub.plan;
  const initialPlan = ['admin', 'admin_5', 'admin_10', 'pro'].includes(rawPlan)
    ? 'pro'
    : 'basic';
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
            <option value="basic">Nexa Basic</option>
            <option value="pro">Nexa Pro (до 25 seats)</option>
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

// -------------------- promo codes -------------------- //

function PromoCodes({ token, showFlash, setError }) {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ code: '', plan: 'pro', maxRedemptions: 100, expiresAt: '' });
  const [creating, setCreating] = useState(false);
  const [inviteFor, setInviteFor] = useState(null); // code string
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/subscriptions/codes', auth);
      setCodes(res.data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const onCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const body = {
        code: form.code.trim().toUpperCase(),
        plan: form.plan,
        cycle: 'monthly',
        maxRedemptions: parseInt(form.maxRedemptions, 10),
        expiresAt: form.expiresAt || null
      };
      await axios.post('/api/admin/subscriptions/codes', body, auth);
      showFlash(`✓ Created ${form.plan === 'pro' ? 'Pro' : 'Basic'} code ${body.code}`);
      setForm({ code: '', plan: form.plan, maxRedemptions: 100, expiresAt: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setCreating(false);
    }
  };

  const onDeactivate = async (code) => {
    if (!window.confirm(`Deactivate ${code}? Existing redemptions stay valid.`)) return;
    try {
      await axios.post(`/api/admin/subscriptions/codes/${encodeURIComponent(code)}/deactivate`, {}, auth);
      showFlash(`✓ Deactivated ${code}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const linkFor = (code) => `${window.location.origin}/redeem?code=${encodeURIComponent(code)}`;
  const copyLink = async (code) => {
    try { await navigator.clipboard.writeText(linkFor(code)); showFlash('✓ Линкот е копиран'); }
    catch { window.prompt('Копирајте го линкот:', linkFor(code)); }
  };
  // On mobile, open the native share sheet (WhatsApp/Viber/…) so the link can be
  // sent in one tap during a 1-on-1 demo. Falls back to clipboard on desktop.
  const shareLink = async (code) => {
    const url = linkFor(code);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Nexa', text: 'Активирајте го вашиот пристап на Nexa:', url });
      } catch (err) {
        if (err?.name !== 'AbortError') copyLink(code); // ignore user-cancelled
      }
      return;
    }
    copyLink(code);
  };

  return (
    <div className={styles.tableWrap}>
      <form className={styles.modal} style={{ position: 'static', boxShadow: 'none', margin: '0 0 20px', maxWidth: 560 }} onSubmit={onCreate}>
        <h2 style={{ marginTop: 0 }}>Mint a campaign code</h2>
        <p className={styles.modalSub}>
          Grants <strong>{form.plan === 'pro' ? 'Full Pro (25 client seats)' : 'Basic (3 co-worker seats)'} · 30 days · €0</strong>. One redemption per user.
        </p>
        <label className={styles.field}>
          Tier
          <select value={form.plan} onChange={(e) => setForm(s => ({ ...s, plan: e.target.value }))}>
            <option value="pro">Pro — full access + 25 client seats</option>
            <option value="basic">Basic — core tools + 3 co-worker seats</option>
          </select>
        </label>
        <label className={styles.field}>
          Code
          <input type="text" value={form.code} required
            onChange={(e) => setForm(s => ({ ...s, code: e.target.value.toUpperCase() }))}
            placeholder={form.plan === 'pro' ? 'PRO30-JUNE' : 'BASIC30-JUNE'} />
        </label>
        <label className={styles.field}>
          Max redemptions (cap)
          <input type="number" min={1} value={form.maxRedemptions} required
            onChange={(e) => setForm(s => ({ ...s, maxRedemptions: e.target.value }))} />
        </label>
        <label className={styles.field}>
          Expiry date (optional)
          <input type="date" value={form.expiresAt}
            onChange={(e) => setForm(s => ({ ...s, expiresAt: e.target.value }))} />
        </label>
        <div className={styles.modalActions}>
          <button type="submit" className={styles.btnPrimary} disabled={creating}>
            {creating ? 'Creating…' : 'Create code'}
          </button>
        </div>
      </form>

      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : codes.length === 0 ? (
        <div className={styles.empty}>No codes yet.</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr><th>Code</th><th>Tier</th><th>Redemptions</th><th>Expires</th><th>Status</th><th>Link / Email</th></tr>
          </thead>
          <tbody>
            {codes.map(c => (
              <tr key={c.code}>
                <td className={styles.mono}>{c.code}</td>
                <td>{(c.plan === 'pro' || c.plan === 'admin_5' || c.plan === 'admin_10') ? 'Pro' : 'Basic'}</td>
                <td>{c.redemptions} / {c.maxRedemptions}</td>
                <td>{fmtDate(c.expiresAt)}</td>
                <td>
                  <span className={`${styles.statusTag} ${c.active ? styles.status_active : ''}`}>
                    {c.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className={styles.actions}>
                  <button className={styles.btnPrimary} onClick={() => shareLink(c.code)}>Сподели</button>
                  <button className={styles.btnGhost} onClick={() => copyLink(c.code)}>Copy link</button>
                  <button className={styles.btnGhost} onClick={() => setInviteFor(c.code)}>Send invite</button>
                  {c.active && <button className={styles.btnDanger} onClick={() => onDeactivate(c.code)}>Deactivate</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {inviteFor && (
        <SendInviteModal
          code={inviteFor}
          token={token}
          onClose={() => setInviteFor(null)}
          onDone={(msg) => { setInviteFor(null); showFlash(msg); }}
          onError={(msg) => setError(msg)}
        />
      )}
    </div>
  );
}

function SendInviteModal({ code, token, onClose, onDone, onError }) {
  const [emails, setEmails] = useState('');
  const [language, setLanguage] = useState('mk');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [edited, setEdited] = useState(false); // don't clobber manual edits on language switch
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [busy, setBusy] = useState(false);

  // Load the default draft for this code + language (unless the admin edited it).
  useEffect(() => {
    let cancelled = false;
    if (edited) return;
    setLoadingDraft(true);
    axios.get(`/api/admin/subscriptions/codes/${encodeURIComponent(code)}/invite-draft?language=${language}`,
      { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (cancelled) return;
        setSubject(res.data.subject || '');
        setBody(res.data.body || '');
      })
      .catch(err => onError(err.response?.data?.message || err.message))
      .finally(() => { if (!cancelled) setLoadingDraft(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, language]);

  const submit = async () => {
    const recipients = emails.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
    if (recipients.length === 0) { onError('Enter at least one email.'); return; }
    setBusy(true);
    try {
      const res = await axios.post(
        '/api/admin/subscriptions/codes/send-invite',
        { code, recipients, language, subject, body },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { queued = 0, skipped = [], estimateSec = 0 } = res.data;
      const eta = estimateSec >= 60 ? `~${Math.ceil(estimateSec / 60)} min` : `~${estimateSec}s`;
      let msg = `✓ Queued ${queued} — sending in the background (${eta}). Watch progress on Invited Prospects.`;
      if (skipped.length) msg += ` · skipped ${skipped.length} already-invited`;
      onDone(msg);
    } catch (err) {
      onError(err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <h2>Send invite — {code}</h2>
        <p className={styles.modalSub}>
          Edit the draft below, then send. Already-invited addresses are skipped automatically. The CTA button keeps the redeem deep link.
        </p>
        <label className={styles.field}>
          Recipients (comma / newline separated)
          <textarea rows={3} value={emails} onChange={(e) => setEmails(e.target.value)}
            placeholder="alice@firm.mk, bob@firm.mk" />
        </label>
        <label className={styles.field}>
          Language
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="mk">Macedonian</option>
            <option value="en">English</option>
          </select>
        </label>
        <label className={styles.field}>
          Subject {loadingDraft && <span className={styles.modalSub}>(loading…)</span>}
          <input type="text" value={subject}
            onChange={(e) => { setSubject(e.target.value); setEdited(true); }} />
        </label>
        <label className={styles.field}>
          Body (HTML)
          <textarea rows={8} value={body}
            onChange={(e) => { setBody(e.target.value); setEdited(true); }} />
        </label>
        <div className={styles.modalActions}>
          <button className={styles.btnGhost} onClick={onClose}>Cancel</button>
          <button className={styles.btnPrimary} onClick={submit} disabled={busy || loadingDraft}>
            {busy ? 'Sending…' : 'Send'}
          </button>
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
