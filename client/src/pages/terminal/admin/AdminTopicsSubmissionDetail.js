import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from '../Topics.module.css';

const STATUS_LABEL = {
  requested: 'Барање', in_progress: 'Во работа', submitted: 'Поднесено',
  returned: 'Вратено', accepted: 'Прифатено', published: 'Објавено',
  rejected: 'Одбиено', declined: 'Одбиено барање', released: 'Ослободено'
};
const fmt = (d) => d ? new Date(d).toLocaleString('mk-MK', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const countWords = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

export default function AdminTopicsSubmissionDetailPage() {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const [submission, setSubmission] = useState(null);
  const [worklist, setWorklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState(null);

  const refresh = () => {
    setLoading(true);
    axios.get(`/api/topics/submissions/${id}`, auth)
      .then(res => { setSubmission(res.data?.submission); setWorklist(res.data?.worklist); })
      .catch(e => setToast({ type: 'error', text: e.response?.data?.message || e.message }))
      .finally(() => setLoading(false));
  };
  useEffect(refresh, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (action, body = {}) => {
    if ((action === 'return' || action === 'reject') && !notes.trim()) {
      setToast({ type: 'error', text: 'Белешки се задолжителни.' }); return;
    }
    if (action === 'return' || action === 'reject') body.editorialNotes = notes.trim();
    if (action === 'force-release' && notes.trim()) body.reason = notes.trim();
    if (action === 'decline' && notes.trim()) body.reason = notes.trim();
    setBusy(true); setToast(null);
    try {
      await axios.post(`/api/admin/topics/submissions/${id}/${action}`, body, auth);
      setNotes('');
      setToast({ type: 'ok', text: 'Извршено.' });
      if (action === 'publish') {
        // After publish, the submission stays — show the URL.
      }
      refresh();
    } catch (e) { setToast({ type: 'error', text: e.response?.data?.message || e.message }); }
    finally { setBusy(false); }
  };

  if (loading) return <TerminalShell><div className={styles.spinner}>Се вчитува…</div></TerminalShell>;
  if (!submission || !worklist) return <TerminalShell><div className={styles.emptyState}>Не е најдено.</div></TerminalShell>;

  return (
    <TerminalShell>
      <div className={styles.page}>
        <Link to="/terminal/admin/topics/submissions" className={styles.btnSecondary} style={{ display: 'inline-block', textDecoration: 'none', marginBottom: 14 }}>
          ← Назад
        </Link>

        <header className={styles.header}>
          <span className={styles.eyebrow}>Admin · Topics</span>
          <h1 className={styles.title}>{worklist.title}</h1>
          <p className={styles.lead}>
            {worklist.practiceArea} · {worklist.category || '—'} · мек рок {worklist.softDeadlineDays} дена
          </p>
        </header>

        {toast && <div className={toast.type === 'ok' ? styles.toastOk : styles.toastError}>{toast.text}</div>}

        <div className={styles.detailGrid}>
          {/* ── left: Q&A and revisions ───────────────────────────── */}
          <div>
            <div className={styles.scopeBox}>
              <strong>Опсег:</strong> {worklist.scope}
            </div>

            {submission.requestReason && (
              <div className={styles.scopeBox} style={{ background: '#EFF6FF', borderColor: '#BAE6FD' }}>
                <strong>Образложение од авторот:</strong> {submission.requestReason}
              </div>
            )}

            {(submission.revisions || []).length > 0 && (
              <div>
                <div className={styles.panelHead} style={{ marginBottom: 8 }}>Историја на доработки</div>
                {submission.revisions.map((r, i) => (
                  <div key={i} className={styles.revBlock}>
                    <strong>{fmt(r.returnedAt)}</strong><br/>{r.editorialNotes}
                  </div>
                ))}
              </div>
            )}

            {(worklist.questions || []).map(q => {
              const a = (submission.answers || []).find(x => x.order === q.order);
              return (
                <div key={q.order} className={styles.adminQa}>
                  <div className={styles.adminQaPrompt}>#{q.order}. {q.prompt}</div>
                  {q.notes && <div className={styles.qNotes}>{q.notes}</div>}
                  <div className={styles.adminQaText}>{a?.text || <span style={{ color: '#94a3b8' }}>(без одговор)</span>}</div>
                  <div className={styles.adminQaMeta}>{countWords(a?.text)} зборови</div>
                </div>
              );
            })}
          </div>

          {/* ── right: action panel ────────────────────────────────── */}
          <aside className={styles.sidePanel}>
            <div className={styles.panelHead}>Статус</div>
            <span className={`${styles.statusPill} ${styles['s_' + submission.status]}`} style={{ alignSelf: 'flex-start' }}>
              {STATUS_LABEL[submission.status]}
            </span>
            <div className={styles.help}>
              Барано: {fmt(submission.requestedAt)}
              {submission.approvedAt  && <><br/>Одобрено: {fmt(submission.approvedAt)}</>}
              {submission.submittedAt && <><br/>Поднесено: {fmt(submission.submittedAt)}</>}
              {submission.acceptedAt  && <><br/>Прифатено: {fmt(submission.acceptedAt)}</>}
              {submission.publishedAt && <><br/>Објавено: {fmt(submission.publishedAt)}</>}
            </div>

            {submission.publishedUrl && (
              <div>
                <div className={styles.panelHead}>Јавна страница</div>
                <a href={submission.publishedUrl} target="_blank" rel="noopener" style={{ fontSize: 12, color: '#1e4db7', wordBreak: 'break-all' }}>{submission.publishedUrl}</a>
              </div>
            )}

            {(submission.status === 'submitted' || submission.status === 'requested') && (
              <div className={styles.field}>
                <label className={styles.label}>Уреднички белешки</label>
                <textarea className={styles.ta} rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {submission.status === 'requested' && (
                <>
                  <button type="button" className={styles.btnAccent}    disabled={busy} onClick={() => act('approve')}>Одобри</button>
                  <button type="button" className={styles.btnDanger}    disabled={busy} onClick={() => act('decline')}>Одбиј барање</button>
                </>
              )}
              {submission.status === 'submitted' && (
                <>
                  <button type="button" className={styles.btnAccent}    disabled={busy} onClick={() => act('accept')}>Прифати</button>
                  <button type="button" className={styles.btnSecondary} disabled={busy} onClick={() => act('return')}>Врати на доработка</button>
                  <button type="button" className={styles.btnDanger}    disabled={busy} onClick={() => act('reject')}>Одбиј</button>
                </>
              )}
              {submission.status === 'accepted' && (
                <button type="button" className={styles.btnPrimary} disabled={busy} onClick={() => act('publish')}>
                  Објави на topics.nexa.mk
                </button>
              )}
              {(submission.status === 'in_progress' || submission.status === 'returned' || submission.status === 'submitted') && (
                <button type="button" className={styles.btnGhost} disabled={busy} onClick={() => act('force-release')}>
                  Принудно ослободи
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </TerminalShell>
  );
}
