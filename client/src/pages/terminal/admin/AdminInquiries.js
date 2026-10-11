import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import { CATEGORY_LABEL, CATEGORY_OPTIONS } from '../../../config/inquiryCategories';
import styles from '../Inquiries.module.css';

const STATUS_LABEL = {
  open: 'Отворено', interest_received: 'Има интерес',
  partially_claimed: 'Делумно зафатено', claimed: 'Зафатено', closed: 'Затворено'
};
const fmt = (d) => d ? new Date(d).toLocaleString('mk-MK', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const FILTERS = [
  { v: '',                  label: 'Сите' },
  { v: 'open',              label: 'Отворени' },
  { v: 'interest_received', label: 'Има интерес' },
  { v: 'partially_claimed', label: 'Делумно зафатени' },
  { v: 'claimed',           label: 'Зафатени' },
  { v: 'closed',            label: 'Затворени' }
];

export default function AdminInquiriesPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [catDraft, setCatDraft] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [pulling, setPulling] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/admin/inquiries${filter ? `?status=${filter}` : ''}`,
              { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setItems(res.data?.items || []))
      .catch(e => setErr(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [filter, token, reloadKey]);

  // Trigger an immediate Gmail ingest pass, then refresh the list.
  const pullNow = async () => {
    if (pulling) return;
    setPulling(true); setToast(null);
    try {
      const res = await axios.post('/api/admin/inquiries/ingest/run-now', {},
                                   { headers: { Authorization: `Bearer ${token}` } });
      const r = res.data?.result || {};
      setToast({ type: 'ok', text: r.ok === false
        ? `Ингест не е активен (${r.error || 'не е конфигуриран'}).`
        : `Повлечени ${r.fetched ?? 0}, објавени ${r.posted ?? 0}, веќе постоечки ${r.duplicate ?? 0}.` });
      setReloadKey(k => k + 1);
    } catch (e2) {
      setToast({ type: 'error', text: e2.response?.data?.message || e2.message });
    } finally { setPulling(false); }
  };

  const startEdit = (e, inq) => {
    e.preventDefault(); e.stopPropagation();
    setEditingId(inq._id);
    // Drop any legacy keys not in the current taxonomy so the draft is clean.
    setCatDraft((inq.categories || []).filter(c => CATEGORY_LABEL[c]));
    setToast(null);
  };
  const toggleCat = (v) =>
    setCatDraft(cats => cats.includes(v) ? cats.filter(c => c !== v) : [...cats, v]);
  const saveCats = async (e, inqId) => {
    e.preventDefault(); e.stopPropagation();
    if (catDraft.length === 0) { setToast({ type: 'error', text: 'Изберете барем една категорија.' }); return; }
    setSaving(true); setToast(null);
    try {
      const res = await axios.put(`/api/admin/inquiries/${inqId}`, { categories: catDraft },
                                  { headers: { Authorization: `Bearer ${token}` } });
      const saved = res.data?.inquiry?.categories || catDraft;
      setItems(list => list.map(it => it._id === inqId ? { ...it, categories: saved } : it));
      setEditingId(null);
      setToast({ type: 'ok', text: 'Категориите се зачувани.' });
    } catch (e2) {
      setToast({ type: 'error', text: e2.response?.data?.message || e2.message });
    } finally { setSaving(false); }
  };

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Admin · Барања</span>
          <h1 className={styles.title}>Управување со барања</h1>
          <p className={styles.lead}>
            Тука се прикажуваат сите барања што се внесени од сателитските
            сајтови. Кликнете на барање за да ги видите интересите и да
            одобрите член.
          </p>
        </header>

        <nav className={styles.tabs}>
          {FILTERS.map(f => (
            <button key={f.v} type="button"
                    className={`${styles.tab} ${filter === f.v ? styles.tabActive : ''}`}
                    onClick={() => setFilter(f.v)}>
              {f.label}
            </button>
          ))}
          <span style={{ flex: 1 }} />
          <button type="button" className={styles.btnSecondary} onClick={pullNow} disabled={pulling}
                  style={{ marginRight: 8 }}>
            {pulling ? 'Се повлекува…' : '↓ Повлечи од е-пошта'}
          </button>
          <Link to="/terminal/admin/inquiries/new" className={styles.btnPrimary} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            + Внеси ново барање
          </Link>
        </nav>

        {err && <div className={styles.toastError}>{err}</div>}
        {toast && <div className={toast.type === 'ok' ? styles.toastOk : styles.toastError}>{toast.text}</div>}
        {loading ? (
          <div className={styles.spinner}>Се вчитува…</div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>Нема барања во оваа категорија.</div>
        ) : (
          <div className={styles.list}>
            {items.map(inq => (
              <div key={inq._id}
                   className={styles.card}
                   style={{ cursor: 'pointer' }}
                   role="button"
                   tabIndex={0}
                   onClick={() => navigate(`/terminal/admin/inquiries/${inq._id}`)}
                   onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/terminal/admin/inquiries/${inq._id}`); }}>
                <div className={styles.cardHead}>
                  <div className={styles.cardTitle}>{inq.topic}</div>
                  {inq.origin === 'email_auto' && (
                    <span className={styles.chip} title="Авто-објавено од е-пошта">🤖 Авто</span>
                  )}
                  {inq.inquirerDecision === 'removed' && (
                    <span className={styles.chipUrgent} title="Клиентот го отстрани барањето">Отстрането од клиент</span>
                  )}
                  {inq.urgency === 'urgent' && <span className={styles.chipUrgent}>Итно</span>}
                  <span className={`${styles.statusPill} ${styles['s_' + inq.status]}`}>
                    {STATUS_LABEL[inq.status]}
                  </span>
                </div>
                <div className={styles.cardSummary}>{inq.summary}</div>

                {editingId === inq._id ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <div className={styles.catPicker}>
                      {CATEGORY_OPTIONS.map(v => (
                        <button key={v} type="button"
                                className={`${styles.catOption} ${catDraft.includes(v) ? styles.catOptionActive : ''}`}
                                onClick={() => toggleCat(v)}>
                          {CATEGORY_LABEL[v]}
                        </button>
                      ))}
                    </div>
                    <div className={styles.actionRow}>
                      <button type="button" className={styles.btnSecondary}
                              onClick={(e) => { e.stopPropagation(); setEditingId(null); }} disabled={saving}>
                        Откажи
                      </button>
                      <button type="button" className={styles.btnPrimary}
                              onClick={(e) => saveCats(e, inq._id)} disabled={saving}>
                        {saving ? 'Се зачувува…' : 'Зачувај'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.chipsRow}>
                    {(inq.categories || []).map(c => (
                      <span key={c} className={styles.chip}>{CATEGORY_LABEL[c] || c}</span>
                    ))}
                    <button type="button" className={styles.btnGhost} onClick={(e) => startEdit(e, inq)}>
                      Уреди категории
                    </button>
                  </div>
                )}

                <div className={styles.cardMeta}>
                  <span>Извор: {inq.source}</span>
                  <span>Град: {inq.city}</span>
                  <span>Поднесено: {fmt(inq.postedAt)}</span>
                  <span>Одобрени: {(inq.approvals || []).length}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TerminalShell>
  );
}
