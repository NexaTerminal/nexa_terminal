import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from './ManageLeads.module.css';

const STATUS_LABEL = {
  new: 'New', offered: 'Offered', assigned: 'Assigned', contacted: 'Contacted',
  won: 'Won', lost: 'Lost', expired: 'Expired', dismissed: 'Dismissed'
};
const TABS = [
  { key: 'new',       label: 'New' },
  { key: 'offered',   label: 'Offered (pool)' },
  { key: 'assigned',  label: 'Assigned' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'won',       label: 'Closed (Won)' },
  { key: 'lost',      label: 'Closed (Lost)' },
  { key: 'dismissed', label: 'Dismissed' }
];

const fmtDateTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return '—';
  return date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
};

export default function ManageLeads() {
  const { token } = useAuth();
  const [tab, setTab] = useState('new');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [detail, setDetail] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [offerTarget, setOfferTarget] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`/api/admin/leads?status=${tab}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(res.data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setLoading(false); }
  }, [tab, token]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const showFlash = (m) => { setFlash(m); setTimeout(() => setFlash(''), 3500); };

  const onAssign = async (lead, superUserId) => {
    try {
      await axios.post(`/api/admin/leads/${lead._id}/assign`,
        { superUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignTarget(null);
      showFlash('✓ Assigned exclusively');
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const onOffer = async (lead, superUserIds) => {
    try {
      const res = await axios.post(`/api/admin/leads/${lead._id}/offer`,
        { superUserIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOfferTarget(null);
      showFlash(`✓ Offered to ${res.data.offeredTo} member(s) — first to claim wins`);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const onDismiss = async (lead) => {
    if (!window.confirm('Dismiss this lead as junk/spam/wrong match?')) return;
    try {
      await axios.post(`/api/admin/leads/${lead._id}/dismiss`, {},
        { headers: { Authorization: `Bearer ${token}` } });
      showFlash('✓ Dismissed');
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <TerminalShell>
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Leads</h1>
        <p>Inbound inquiries from the satellite sites and the Nexa pricing form.</p>
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
        {loading ? <div className={styles.loading}>Loading…</div> :
         items.length === 0 ? <div className={styles.empty}>Nothing in this tab.</div> : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Received</th>
                <th>Source</th>
                <th>Practice</th>
                <th>City</th>
                <th>Lead</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(l => (
                <tr key={l._id}>
                  <td className={styles.dim}>{fmtDateTime(l.receivedAt)}</td>
                  <td><span className={styles.sourceTag}>{l.sourceSite}</span></td>
                  <td>{l.practiceArea}</td>
                  <td>{l.city || '—'}</td>
                  <td>
                    <div className={styles.name}>{l.payload?.name || '—'}</div>
                    <div className={styles.dim}>{l.payload?.email || ''}</div>
                  </td>
                  <td>
                    <span className={`${styles.statusTag} ${styles[`status_${l.status}`] || ''}`}>
                      {STATUS_LABEL[l.status] || l.status}
                    </span>
                  </td>
                  <td className={styles.actions}>
                    <button className={styles.btnGhost} onClick={() => setDetail(l)}>View</button>
                    {l.status === 'new' && (
                      <>
                        <button className={styles.btnPrimary} onClick={() => setAssignTarget(l)}>Assign</button>
                        <button className={styles.btnPrimary} onClick={() => setOfferTarget(l)}>Offer to pool</button>
                        <button className={styles.btnGhost} onClick={() => onDismiss(l)}>Dismiss</button>
                      </>
                    )}
                    {l.status === 'offered' && (
                      <span className={styles.dim} title={`Offered to ${l.offeredTo?.length || 0} members`}>
                        Offered to {l.offeredTo?.length || 0}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
         )}
      </div>

      {detail && <DetailDrawer lead={detail} onClose={() => setDetail(null)} />}
      {assignTarget && (
        <AssignModal
          lead={assignTarget}
          token={token}
          onCancel={() => setAssignTarget(null)}
          onAssign={onAssign}
        />
      )}
      {offerTarget && (
        <OfferModal
          lead={offerTarget}
          token={token}
          onCancel={() => setOfferTarget(null)}
          onOffer={onOffer}
        />
      )}
    </div>
    </TerminalShell>
  );
}

function DetailDrawer({ lead, onClose }) {
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={`${styles.modal} ${styles.drawer}`} onClick={e => e.stopPropagation()}>
        <h2>Lead detail</h2>
        <div className={styles.kv}>
          <span>Source</span><strong>{lead.sourceSite}</strong>
          <span>Practice area</span><strong>{lead.practiceArea}</strong>
          <span>City</span><strong>{lead.city || '—'}</strong>
          <span>Language</span><strong>{lead.language}</strong>
          <span>Received</span><strong>{new Date(lead.receivedAt).toLocaleString('en-GB')}</strong>
          <span>Status</span><strong>{lead.status}</strong>
        </div>
        <h3 className={styles.subhead}>Payload</h3>
        <div className={styles.kv}>
          {Object.entries(lead.payload || {}).map(([k, v]) => (
            <>
              <span key={`k-${k}`}>{k}</span>
              <strong key={`v-${k}`}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</strong>
            </>
          ))}
        </div>
        {lead.notes?.length > 0 && (
          <>
            <h3 className={styles.subhead}>Notes</h3>
            <ul className={styles.notes}>
              {lead.notes.map((n, i) => (
                <li key={i}><span>{new Date(n.at).toLocaleString('en-GB')}</span> {n.text}</li>
              ))}
            </ul>
          </>
        )}
        <div className={styles.modalActions}>
          <button className={styles.btnGhost} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function AssignModal({ lead, token, onCancel, onAssign }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({ practiceArea: lead.practiceArea });
    if (lead.city) params.set('city', lead.city);
    axios.get(`/api/admin/leads/candidates?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => { setCandidates(res.data.candidates || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [lead, token]);

  return (
    <div className={styles.modalBackdrop} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2>Assign lead</h2>
        <p className={styles.modalSub}>{lead.practiceArea} · {lead.city || 'any city'}</p>

        {loading ? <div className={styles.loading}>Loading candidates…</div> :
         candidates.length === 0 ? (
          <div className={styles.empty}>No matching admin_users for this practice area.</div>
         ) : (
          <ul className={styles.candidates}>
            {candidates.map(c => (
              <li key={c._id}>
                <label>
                  <input
                    type="radio"
                    name="cand"
                    value={c._id}
                    checked={selected === c._id}
                    onChange={() => setSelected(c._id)}
                  />
                  <div>
                    <div className={styles.name}>{c.fullName || c.email}</div>
                    <div className={styles.dim}>
                      {(c.superUser?.practiceAreas || []).join(', ') || 'no practice areas'}
                      {c.superUser?.lastAssignedAt &&
                        ` · last assigned ${new Date(c.superUser.lastAssignedAt).toLocaleDateString('en-GB')}`}
                    </div>
                  </div>
                </label>
              </li>
            ))}
          </ul>
         )}

        <div className={styles.modalActions}>
          <button className={styles.btnGhost} onClick={onCancel}>Cancel</button>
          <button
            className={styles.btnPrimary}
            disabled={!selected}
            onClick={() => onAssign(lead, selected)}
          >Assign</button>
        </div>
      </div>
    </div>
  );
}

// ---------- OfferModal: multi-select candidates, post lead to claim pool ----------
function OfferModal({ lead, token, onCancel, onOffer }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    const params = new URLSearchParams({ practiceArea: lead.practiceArea });
    if (lead.city) params.set('city', lead.city);
    axios.get(`/api/admin/leads/candidates?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => { setCandidates(res.data.candidates || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [lead, token]);

  const toggle = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const toggleAll = () => {
    setSelected(selected.size === candidates.length ? new Set() : new Set(candidates.map(c => c._id)));
  };

  return (
    <div className={styles.modalBackdrop} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2>Offer to claim pool</h2>
        <p className={styles.modalSub}>
          {lead.practiceArea} · {lead.city || 'any city'} — first member to claim wins it.
        </p>

        {loading ? <div className={styles.loading}>Loading candidates…</div> :
         candidates.length === 0 ? (
          <div className={styles.empty}>No matching admin_users.</div>
         ) : (
          <>
            <button type="button" className={styles.btnGhost} onClick={toggleAll} style={{marginBottom: 8}}>
              {selected.size === candidates.length ? 'Deselect all' : 'Select all'}
            </button>
            <ul className={styles.candidates}>
              {candidates.map(c => (
                <li key={c._id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selected.has(c._id)}
                      onChange={() => toggle(c._id)}
                    />
                    <div>
                      <div className={styles.name}>{c.fullName || c.email}</div>
                      <div className={styles.dim}>
                        {(c.superUser?.practiceAreas || []).join(', ') || 'no practice areas'}
                      </div>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          </>
         )}

        <div className={styles.modalActions}>
          <button className={styles.btnGhost} onClick={onCancel}>Cancel</button>
          <button
            className={styles.btnPrimary}
            disabled={selected.size === 0}
            onClick={() => onOffer(lead, Array.from(selected))}
          >Offer to {selected.size} member{selected.size === 1 ? '' : 's'}</button>
        </div>
      </div>
    </div>
  );
}
