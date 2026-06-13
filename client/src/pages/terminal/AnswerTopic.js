import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import FeatureTermsModal from '../../components/terminal/FeatureTermsModal';
import useTermsGate from '../../hooks/useTermsGate';
import styles from './Topics.module.css';

const countWords = (s) =>
  String(s || '').trim().split(/\s+/).filter(Boolean).length;

const fmt = (d) => d ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export default function AnswerTopicPage() {
  const { token } = useAuth();
  const { requireTerms, termsModal } = useTermsGate();
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const [submission, setSubmission] = useState(null);
  const [worklist, setWorklist] = useState(null);
  const [answers, setAnswers] = useState({});       // by order
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let cancelled = false;
    axios.get(`/api/topics/submissions/${id}`, auth)
      .then(res => {
        if (cancelled) return;
        setSubmission(res.data?.submission);
        setWorklist(res.data?.worklist);
        const map = {};
        (res.data?.submission?.answers || []).forEach(a => { map[a.order] = a.text || ''; });
        setAnswers(map);
      })
      .catch(e => { if (!cancelled) setToast({ type: 'error', text: e.response?.data?.message || e.message }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalWords = useMemo(
    () => Object.values(answers).reduce((s, t) => s + countWords(t), 0),
    [answers]
  );

  const setAnswer = (order, text) => setAnswers(a => ({ ...a, [order]: text }));

  const buildPayload = () =>
    (worklist?.questions || []).map(q => ({
      order: q.order,
      text: answers[q.order] || ''
    }));

  const saveDraft = async () => {
    setBusy(true); setToast(null);
    try {
      const res = await axios.put(`/api/topics/submissions/${id}`, { answers: buildPayload() }, auth);
      setSubmission(res.data?.submission);
      setToast({ type: 'ok', text: 'Зачувано.' });
    } catch (e) { setToast({ type: 'error', text: e.response?.data?.message || e.message }); }
    finally { setBusy(false); }
  };

  const submitForReview = async () => {
    // Must have non-empty answers across every question.
    const empty = (worklist?.questions || []).find(q => !String(answers[q.order] || '').trim());
    if (empty) { setToast({ type: 'error', text: `Прашање #${empty.order} нема одговор.` }); return; }
    setBusy(true); setToast(null);
    try {
      await axios.put(`/api/topics/submissions/${id}`, { answers: buildPayload() }, auth);
      const res = await axios.post(`/api/topics/submissions/${id}/submit`, {}, auth);
      setSubmission(res.data?.submission);
      setToast({ type: 'ok', text: 'Поднесено за уреднички преглед.' });
    } catch (e) { setToast({ type: 'error', text: e.response?.data?.message || e.message }); }
    finally { setBusy(false); }
  };

  const release = async () => {
    if (!window.confirm('Сте сигурни? Темата ќе се врати на отворената работна табла и други автори ќе може да ја побараат.')) return;
    setBusy(true);
    try {
      await axios.post(`/api/topics/submissions/${id}/release`, {}, auth);
      navigate('/terminal/topics-qa');
    } catch (e) { setToast({ type: 'error', text: e.response?.data?.message || e.message }); }
    finally { setBusy(false); }
  };

  if (loading) return <TerminalShell><div className={styles.spinner}>Се вчитува…</div></TerminalShell>;
  if (!submission || !worklist) return <TerminalShell><div className={styles.emptyState}>Не е најдено.</div></TerminalShell>;

  const lockedForEdit = !['in_progress', 'returned'].includes(submission.status);
  const totalTarget = worklist.targetLengthWords || 1500;

  return (
    <TerminalShell>
      <div className={styles.page}>
        <Link to="/terminal/topics-qa" className={styles.btnSecondary} style={{ display: 'inline-block', textDecoration: 'none', marginBottom: 14 }}>
          ← Назад на табла
        </Link>

        <header className={styles.header}>
          <span className={styles.eyebrow}>Topics Q&A</span>
          <h1 className={styles.title}>{worklist.title}</h1>
          <p className={styles.lead}>
            Практикувана област: {worklist.practiceArea} · мек рок {worklist.softDeadlineDays} дена
          </p>
        </header>

        {toast && <div className={toast.type === 'ok' ? styles.toastOk : styles.toastError}>{toast.text}</div>}
        {submission.status === 'returned' && submission.editorialNotes && (
          <div className={styles.editorialNotes}>
            <strong>Уреднички белешки:</strong>{'\n'}{submission.editorialNotes}
          </div>
        )}
        {submission.status === 'submitted' && (
          <div className={styles.toastInfo}>Поднесено. Уредничкиот тим ќе прегледа и ќе одговори.</div>
        )}
        {submission.status === 'accepted' && (
          <div className={styles.toastOk}>Прифатено! Чека објавување.</div>
        )}

        <div className={styles.answerPage}>
          <div>
            <div className={styles.scopeBox}>
              <strong>Опсег:</strong> {worklist.scope}
            </div>

            {(worklist.questions || []).map(q => {
              const text = answers[q.order] || '';
              const wc = countWords(text);
              const wcClass = wc >= 100 ? styles.qWcOk : wc >= 50 ? styles.qWcWarn : styles.qWcLow;
              return (
                <div key={q.order} className={styles.qBlock}>
                  <div className={styles.qHead}>
                    <span className={styles.qOrder}>#{q.order}</span>
                    <div className={styles.qPrompt}>{q.prompt}</div>
                  </div>
                  {q.notes && <div className={styles.qNotes}>{q.notes}</div>}
                  <textarea
                    className={styles.textarea}
                    value={text}
                    disabled={lockedForEdit}
                    onChange={(e) => setAnswer(q.order, e.target.value)}
                    placeholder="100–400 зборови"
                  />
                  <div className={styles.qFoot}>
                    <span className={wcClass}>{wc} зборови</span>
                    <span style={{ flex: 1 }} />
                    <span>цел: 100–400</span>
                  </div>
                </div>
              );
            })}

            <div className={styles.actionBar}>
              <button type="button" className={styles.btnSecondary} disabled={busy || lockedForEdit} onClick={saveDraft}>Зачувај нацрт</button>
              <button type="button" className={styles.btnPrimary}   disabled={busy || lockedForEdit} onClick={() => requireTerms('topic', submitForReview)}>Поднеси за преглед</button>
              <span style={{ flex: 1 }} />
              {(submission.status === 'in_progress' || submission.status === 'returned') && (
                <button type="button" className={styles.btnGhost} disabled={busy} onClick={release}>Ослободи ја темата</button>
              )}
            </div>
          </div>

          <aside className={styles.sidePanel}>
            <div className={styles.panelHead}>Прогрес</div>
            <div className={styles.statRow}>
              <span className={styles.statVal}>{totalWords}</span>
              <span className={styles.statSub}>од ~{totalTarget} зборови</span>
            </div>
            <div className={styles.help}>
              {Object.values(answers).filter(t => String(t).trim()).length}/{(worklist.questions || []).length} одговори со текст
            </div>
            <div className={styles.panelHead} style={{ marginTop: 8 }}>Статус</div>
            <span className={`${styles.statusPill} ${styles['s_' + submission.status]}`} style={{ alignSelf: 'flex-start' }}>
              {submission.status === 'in_progress' ? 'Во работа' :
               submission.status === 'submitted'   ? 'Поднесено' :
               submission.status === 'returned'    ? 'Вратено' :
               submission.status === 'accepted'    ? 'Прифатено' :
               submission.status === 'published'   ? 'Објавено' : submission.status}
            </span>
            <div className={styles.help} style={{ marginTop: 4 }}>
              Барано: {fmt(submission.requestedAt)}
              {submission.approvedAt && <><br/>Одобрено: {fmt(submission.approvedAt)}</>}
              {submission.submittedAt && <><br/>Поднесено: {fmt(submission.submittedAt)}</>}
              {submission.revisions?.length > 0 && <><br/>Доработки: {submission.revisions.length}</>}
            </div>
          </aside>
        </div>
      </div>
      {termsModal && <FeatureTermsModal {...termsModal} />}
    </TerminalShell>
  );
}
