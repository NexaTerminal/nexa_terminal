import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from '../BlogSubmissions.module.css';
import { sanitizeHTML } from '../../../utils/sanitizer';

const STATUS_LABEL = {
  submitted:   'Чека преглед',
  ai_passed:   'Чека преглед',   // legacy
  ai_failed:   'Чека преглед',   // legacy
  returned:    'Вратено',
  accepted:    'Прифатено'
};
const fmt = (d) => d ? new Date(d).toLocaleString('mk-MK', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

// Publishing to topics.nexa.mk is manual — admin copies text + image. Force a
// real download when possible (blob), falling back to opening in a new tab.
const downloadImage = async (url, filename) => {
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = filename || 'image';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objUrl);
  } catch {
    window.open(url, '_blank', 'noopener');
  }
};

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

            {/* Author profile — submitted with the blog (image · name · email · bio) */}
            {selected.authorBio && (selected.authorBio.displayName || selected.authorBio.contactEmail || selected.authorBio.bio || selected.authorBio.photoUrl) && (
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, margin: '4px 0 18px' }}>
                {selected.authorBio.photoUrl
                  ? <a href={selected.authorBio.photoUrl} target="_blank" rel="noopener noreferrer" title="Отвори во голем формат" style={{ flexShrink: 0 }}>
                      <img src={selected.authorBio.photoUrl} alt="author" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
                    </a>
                  : <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e0eeff', color: '#1a44a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, flexShrink: 0 }}>
                      {(selected.authorBio.displayName || '?').trim().charAt(0).toUpperCase()}
                    </div>}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#0b1220' }}>{selected.authorBio.displayName || '(без име)'}</div>
                  {selected.authorBio.tagline && (
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>{selected.authorBio.tagline}</div>
                  )}
                  {selected.authorBio.contactEmail && (
                    <div style={{ fontSize: 13 }}><a href={`mailto:${selected.authorBio.contactEmail}`}>{selected.authorBio.contactEmail}</a></div>
                  )}
                  {selected.authorBio.linkedinUrl && (
                    <div style={{ fontSize: 13 }}><a href={selected.authorBio.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></div>
                  )}
                  {selected.authorBio.website && (
                    <div style={{ fontSize: 13 }}><a href={selected.authorBio.website} target="_blank" rel="noopener noreferrer">{selected.authorBio.website} ↗</a></div>
                  )}
                  {selected.authorBio.photoUrl && (
                    <button
                      type="button"
                      onClick={() => downloadImage(selected.authorBio.photoUrl, `${(selected.authorBio.displayName || 'author').slice(0, 40)}-photo`)}
                      style={{ background: 'none', border: 0, padding: 0, color: '#1a44a3', fontWeight: 600, cursor: 'pointer', fontSize: 13, marginTop: 2 }}
                    >
                      Преземи слика ↓
                    </button>
                  )}
                  {selected.authorBio.bio && (
                    <div style={{ fontSize: 13, color: '#475569', marginTop: 6, lineHeight: 1.5 }}>{selected.authorBio.bio}</div>
                  )}
                  {selected.authorBio.extendedBio && (
                    <div style={{ fontSize: 13, color: '#475569', marginTop: 6, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{selected.authorBio.extendedBio}</div>
                  )}
                  {Array.isArray(selected.authorBio.credentials) && selected.authorBio.credentials.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {selected.authorBio.credentials.map((c, i) => (
                        <span key={i} style={{ padding: '3px 9px', border: '1px solid #d1d5db', borderRadius: 999, fontSize: 12, color: '#374151' }}>{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selected.coverImageUrl && (
              <figure style={{ margin: '0 0 16px' }}>
                <a href={selected.coverImageUrl} target="_blank" rel="noopener noreferrer" title="Отвори во полн формат">
                  <img src={selected.coverImageUrl} alt="cover" style={{ width: '100%', borderRadius: 8, display: 'block' }} />
                </a>
                <figcaption style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 8, fontSize: 13 }}>
                  <a href={selected.coverImageUrl} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600 }}>Отвори во полн формат ↗</a>
                  <button
                    type="button"
                    onClick={() => downloadImage(selected.coverImageUrl, `${(selected.title || 'blog').slice(0, 40)}-cover`)}
                    style={{ background: 'none', border: 0, padding: 0, color: '#1a44a3', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                  >
                    Преземи слика ↓
                  </button>
                </figcaption>
              </figure>
            )}
            <div className={styles.detailBody} dangerouslySetInnerHTML={{ __html: sanitizeHTML(selected.bodyHtml) }} />

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
