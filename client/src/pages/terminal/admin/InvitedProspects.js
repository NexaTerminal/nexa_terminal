import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from './ManageSubscriptions.module.css';

const PLAN_LABEL = {
  basic: 'Basic', pro: 'Pro',
  standard: 'Basic', admin: 'Pro', admin_5: 'Pro', admin_10: 'Pro'
};

const fmtDateTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return '—';
  return date.toLocaleString('en-GB', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

function StatCard({ label, value, hint }) {
  return (
    <div style={{ flex: 1, minWidth: 150, background: '#fff', border: '1px solid #E6E8EC', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#0B1220', marginTop: 4 }}>{value}</div>
      {hint && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

export default function InvitedProspects() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ invited: 0, clicked: 0, active: 0, archived: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [q, setQ] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/admin/subscriptions/prospects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(res.data.items || []);
      setStats(res.data.stats || { invited: 0, clicked: 0, active: 0, archived: 0 });
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const onDelete = async (p) => {
    if (!window.confirm(`Delete ${p.email}? Stats are kept and the address can be invited again.`)) return;
    try {
      await axios.delete(`/api/admin/subscriptions/prospects/${p._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlash(`✓ ${p.email} archived — can be invited again`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const filtered = useMemo(() => {
    let rows = showArchived ? items.filter(i => i.deleted) : items.filter(i => !i.deleted);
    const term = q.trim().toLowerCase();
    if (term) rows = rows.filter(i =>
      (i.email || '').toLowerCase().includes(term) || (i.code || '').toLowerCase().includes(term));
    return rows;
  }, [items, q, showArchived]);

  const clickRate = stats.invited ? Math.round((stats.clicked / stats.invited) * 100) : 0;

  return (
    <TerminalShell>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>Cold email — potential users invited</h1>
          <p>Every address we've sent a promo invite to. Deleting one keeps its stats but frees the email to be invited again.</p>
        </div>

        {flash && <div className={styles.flash}>{flash}</div>}
        {error && <div className={styles.error}>{error}</div>}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '0 0 20px' }}>
          <StatCard label="Invited" value={stats.invited} hint="unique prospects" />
          <StatCard label="Clicked the link" value={stats.clicked} hint="opened the redeem page" />
          <StatCard label="Click rate" value={`${clickRate}%`} hint="clicked ÷ invited" />
          <StatCard label="Archived" value={stats.archived} hint="re-invitable" />
        </div>

        <div className={styles.tableWrap}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', margin: '0 0 16px' }}>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search email or code…"
              style={{ flex: 1, maxWidth: 360, padding: '8px 12px', border: '1px solid #E6E8EC', borderRadius: 8 }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#374151', cursor: 'pointer' }}>
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
              Show archived
            </label>
            <span className={styles.modalSub}>{filtered.length} shown</span>
          </div>

          {loading ? (
            <div className={styles.loading}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>{showArchived ? 'No archived prospects.' : 'No invited prospects yet.'}</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Invited</th>
                  <th>Sends</th>
                  <th>Clicks</th>
                  <th>Code</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p._id || p.email}>
                    <td>{p.email}</td>
                    <td>{fmtDateTime(p.lastInvitedAt)}</td>
                    <td>{p.invitedCount || 1}</td>
                    <td>
                      {p.clicks > 0
                        ? <span title={`last: ${fmtDateTime(p.lastClickedAt)}`}>✓ {p.clicks}</span>
                        : <span style={{ color: '#9CA3AF' }}>—</span>}
                    </td>
                    <td className={styles.mono}>{p.code}</td>
                    <td>{PLAN_LABEL[p.plan] || p.plan}</td>
                    <td>
                      <span className={`${styles.statusTag} ${p.status === 'sent' ? styles.status_active : ''}`}>
                        {p.status === 'sent' ? 'Sent' : p.status === 'queued' ? 'Queued…' : 'Failed'}
                      </span>
                    </td>
                    <td className={styles.actions}>
                      {!p.deleted && (
                        <button className={styles.btnDanger} onClick={() => onDelete(p)}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </TerminalShell>
  );
}
