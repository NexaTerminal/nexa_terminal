import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from '../BlogSubmissions.module.css';

const STATUS_LABEL = {
  submitted:   'Чека преглед',
  ai_passed:   'Чека преглед',   // legacy
  ai_failed:   'Чека преглед',   // legacy
  returned:    'Вратено',
  accepted:    'Прифатено'
};
const fmt = (d) => d ? new Date(d).toLocaleString('mk-MK', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function PendingBlogSubmissionsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const refresh = () => {
    setLoading(true);
    axios.get(`/api/admin/blogs/submissions${filter ? `?status=${filter}` : ''}`, auth)
      .then(res => setItems(res.data?.items || []))
      .catch(e => setToast({ type: 'error', text: e.response?.data?.message || e.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [filter]);

  const onSelect = async (item) => {
    setBusy(true); setNotes(item.editorialNotes || '');
    try {
      const res = await axios.get(`/api/admin/blogs/submissions/${item._id}`, auth);
      setSelected(res.data?.submission);
    } catch (e) {
      setToast({ type: 'error', text: e.response?.data?.message || e.message });
    } finally { setBusy(false); }
  };

  const act = async (action) => {
    if (!selected) return;
    if ((action === 'return' || action === 'reject') && !notes.trim()) {
      setToast({ type: 'error', text: 'Уредничките белешки се задолжителни за оваа акција.' });
      return;
    }
    setBusy(true); setToast(null);
    try {
      const body = (action === 'return' || action === 'reject') ? { editorialNotes: notes.trim() } : {};
      await axios.post(`/api/admin/blogs/submissions/${selected._id}/${action}`, body, auth);
      setSelected(null); setNotes('');
      refresh();
      setToast({ type: 'ok', text: 'Акцијата е извршена.' });
    } catch (e) {
      setToast({ type: 'error', text: e.response?.data?.message || e.message });
    } finally { setBusy(false); }
  };

  const filters = useMemo(() => ([
    { v: '',          label: 'Сите чекаат' },
    { v: 'submitted', label: 'Чекаат преглед' },
    { v: 'returned',  label: 'Вратени' },
    { v: 'accepted',  label: 'Прифатени (за објава)' }
  ]), []);

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Admin · Блогови</span>
          <h1 className={styles.title}>Чекаат уреднички преглед</h1>
        </header>

        <nav className={styles.tabs}>
          {filters.map(f => (
            <button
              key={f.v}
              type="button"
              className={`${styles.tab} ${filter === f.v ? styles.tabActive : ''}`}
              onClick={() => { setSelected(null); setFilter(f.v); }}
            >{f.label}</button>
          ))}
        </nav>

        {toast && <div className={toast.type === 'ok' ? styles.toastOk : styles.toastError} style={{ marginBottom: 14 }}>{toast.text}</div>}

        {selected ? (
          <div className={styles.detail}>
            <div className={styles.detailMeta}>
              <button type="button" className={styles.btnSecondary} onClick={() => setSelected(null)}>← Назад на списокот</button>
              <span className={`${styles.statusPill} ${styles['s_' + selected.status]}`}>{STATUS_LABEL[selected.status] || selected.status}</span>
              <span>AI обиди: {selected.attemptsAi || 0}/3</span>
              <span>Поднесено: {fmt(selected.submittedAt)}</span>
              {selected.manualReviewRequested && (
                <span style={{ background:'#FEE2E2', color:'#B91C1C', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:700 }}>
                  Бараат рачен преглед
                </span>
              )}
            </div>
            <h1>{selected.title}</h1>
            {selected.coverImageUrl && (
              <img src={selected.coverImageUrl} alt="cover" style={{ width: '100%', borderRadius: 8, marginBottom: 16 }} />
            )}
            <div className={styles.detailBody} dangerouslySetInnerHTML={{ __html: selected.bodyHtml }} />

            {selected.aiVerdict && (
              <div style={{ marginTop: 22 }}>
                <div className={styles.sideCardHead}>AI препораки (советодавно)</div>
                <span className={styles.verdictNeutral}>
                  {(selected.aiVerdict.issues || []).length > 0
                    ? `${selected.aiVerdict.issues.length} предлог(а) за подобрување`
                    : 'Без посебни забелешки'}
                </span>
                {(selected.aiVerdict.issues || []).map((iss, i) => (
                  <div key={i} className={styles.issueCard} style={{ marginTop: 8 }}>
                    <div className={styles.issueRule}>{iss.rule}</div>
                    <div className={styles.issueMessage}>{iss.message}</div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.field} style={{ marginTop: 22 }}>
              <label className={styles.label}>Уреднички белешки (задолжително за врати/одбиј)</label>
              <textarea className={styles.input}
                        rows={4}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Краток опис на што треба да се измени, цитат на проблематичен пасус, итн." />
            </div>

            <div className={styles.actionsRow}>
              {(selected.status === 'submitted' || selected.status === 'ai_passed' || selected.status === 'ai_failed') && (
                <>
                  <button type="button" className={styles.btnAccent} disabled={busy} onClick={() => act('accept')}>Прифати</button>
                  <button type="button" className={styles.btnSecondary} disabled={busy} onClick={() => act('return')}>Врати на доработка</button>
                  <button type="button" className={styles.btnDanger} disabled={busy} onClick={() => act('reject')}>Одбиј</button>
                </>
              )}
              {selected.status === 'accepted' && (
                <button type="button" className={styles.btnPrimary} disabled={busy} onClick={() => act('publish')}>
                  Објави на јавниот блог
                </button>
              )}
            </div>
          </div>
        ) : loading ? (
          <div className={styles.spinner}>Се вчитува…</div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>Нема поднесувања во оваа категорија.</div>
        ) : (
          <div className={styles.list}>
            {items.map(s => (
              <button key={s._id} type="button" className={styles.row} onClick={() => onSelect(s)}>
                <div className={styles.rowMain}>
                  <div className={styles.rowTitle}>{s.title || '(без наслов)'}</div>
                  <div className={styles.rowMeta}>
                    Поднесено: {fmt(s.submittedAt)} · AI обиди: {s.attemptsAi || 0}/3
                    {s.manualReviewRequested && ' · ⚠ рачен преглед'}
                  </div>
                </div>
                <span className={`${styles.statusPill} ${styles['s_' + s.status]}`}>
                  {STATUS_LABEL[s.status] || s.status}
                </span>
                <span style={{ color: '#94a3b8', fontSize: 18 }}>›</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </TerminalShell>
  );
}
