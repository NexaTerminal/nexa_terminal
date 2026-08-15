import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOPIC_CATEGORIES, PRACTICE_AREAS } from '../../../config/topicCategories';
import styles from '../../../pages/terminal/Topics.module.css';

/**
 * Shared create/edit form for an admin Topics worklist item (topics.nexa.mk).
 * Owns field state; the parent handles the API call, busy/error state and
 * navigation via `onSubmit(values)`.
 *
 * When `locked` is true (a submission is in flight) the guiding questions and
 * structural fields are read-only — only title/scope/keyword may change. This
 * mirrors the server guard in topicsService.updateWorklistItem so we never
 * desync an in-progress author's answers.
 */
export default function TopicWorklistForm({
  initial,
  onSubmit,
  busy = false,
  error = null,
  locked = false,
  submitLabel = 'Зачувај',
  cancelTo = '/terminal/admin/topics/worklist'
}) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(initial.title || '');
  const [practiceArea, setPracticeArea] = useState(initial.practiceArea || '');
  const [category, setCategory] = useState(initial.category || '');
  const [targetKeyword, setTargetKeyword] = useState(initial.targetKeyword || '');
  const [targetLengthWords, setTargetLengthWords] = useState(initial.targetLengthWords ?? 1500);
  const [softDeadlineDays, setSoftDeadlineDays] = useState(initial.softDeadlineDays ?? 28);
  const [scope, setScope] = useState(initial.scope || '');
  const [questions, setQuestions] = useState(
    (initial.questions && initial.questions.length
      ? initial.questions
      : []
    ).map((q, i) => ({ order: q.order ?? i + 1, prompt: q.prompt || '', notes: q.notes || '' }))
  );

  // Warn before losing unsaved edits on refresh / tab close / external nav.
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const touch = () => { if (!dirty) setDirty(true); };

  const setQ = (i, key, val) => { touch(); setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, [key]: val } : q)); };
  const addQ = () => { if (questions.length < 20) { touch(); setQuestions([...questions, { order: questions.length + 1, prompt: '', notes: '' }]); } };
  const rmQ = (i) => { touch(); setQuestions(qs => qs.filter((_, idx) => idx !== i).map((q, idx) => ({ ...q, order: idx + 1 }))); };
  const moveQ = (i, dir) => { touch(); setQuestions(qs => {
    const j = i + dir;
    if (j < 0 || j >= qs.length) return qs;
    const next = [...qs];
    [next[i], next[j]] = [next[j], next[i]];
    return next.map((q, idx) => ({ ...q, order: idx + 1 }));
  }); };

  const submit = (e) => {
    e.preventDefault();
    const cleanQs = questions.filter(q => q.prompt.trim()).map((q, i) => ({ order: i + 1, prompt: q.prompt.trim(), notes: q.notes }));
    if (!locked && cleanQs.length < 5) return; // guarded below in the UI too
    if (scope.trim().length < 40) return;      // mirrors server validation
    setDirty(false); // saving — don't warn on the ensuing navigation
    onSubmit({
      title,
      practiceArea,
      category,
      targetKeyword,
      targetLengthWords: Number(targetLengthWords),
      softDeadlineDays: Number(softDeadlineDays),
      scope,
      // Locked topics keep their questions untouched (server ignores them too).
      ...(locked ? {} : { questions: cleanQs })
    });
  };

  const cancel = () => {
    if (dirty && !window.confirm('Имате незачувани промени. Да ја напуштите страницата?')) return;
    navigate(cancelTo);
  };

  const enoughQuestions = questions.filter(q => q.prompt.trim()).length >= 5;
  const scopeOk = scope.trim().length >= 40;

  return (
    <form className={styles.form} onSubmit={submit} onChange={touch}>
      {error && <div className={styles.toastError}>{error}</div>}

      {locked && (
        <div className={styles.toastError} style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
          Темата има активно поднесување — прашањата и структурата не може да се менуваат.
          Може да го уредите насловот, опсегот и клучниот збор.
        </div>
      )}

      <div className={styles.field}>
        <label className={styles.label}>Наслов *</label>
        <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value.slice(0, 240))} required />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Практикувана област (practice area) *</label>
        <input className={styles.input} value={practiceArea} onChange={(e) => setPracticeArea(e.target.value)}
               placeholder="employment_law, tax_law, immigration, ..." required disabled={locked}
               list="practice-areas" />
        <datalist id="practice-areas">
          {PRACTICE_AREAS.map(p => <option key={p} value={p} />)}
        </datalist>
        <span className={styles.help}>Се користи за филтрирање кај членовите според нивните области.</span>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Категорија (за topics.nexa.mk)</label>
        <select className={styles.input} value={category} onChange={(e) => setCategory(e.target.value)} disabled={locked}>
          <option value="">— Изберете категорија —</option>
          {TOPIC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className={styles.help}>Членовите ги филтрираат прашањата по овие категории.</span>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>SEO целен збор</label>
        <input className={styles.input} value={targetKeyword} onChange={(e) => setTargetKeyword(e.target.value)}
               placeholder="на пр. пресметка на отпремнина" />
      </div>

      <div style={{ display: 'flex', gap: 14 }}>
        <div className={styles.field} style={{ flex: 1 }}>
          <label className={styles.label}>Целна должина (зборови)</label>
          <input className={styles.input} type="number" min={300} max={5000} step={100}
                 value={targetLengthWords} onChange={(e) => setTargetLengthWords(e.target.value)} disabled={locked} />
        </div>
        <div className={styles.field} style={{ flex: 1 }}>
          <label className={styles.label}>Мек рок (дена)</label>
          <input className={styles.input} type="number" min={7} max={120}
                 value={softDeadlineDays} onChange={(e) => setSoftDeadlineDays(e.target.value)} disabled={locked} />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Опсег (што страницата треба да покрие) *</label>
        <textarea className={styles.ta} value={scope} onChange={(e) => setScope(e.target.value)} rows={4} maxLength={1200} required />
        <span className={styles.help} style={!scopeOk && scope.length > 0 ? { color: '#b91c1c' } : undefined}>
          {scope.trim().length}/1200 · минимум 40 карактери
        </span>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Прашања (мин 5, макс 20)</label>
        {questions.map((q, i) => (
          <div key={i} className={styles.qaSlot}>
            <div className={styles.qaSlotNum}>#{i + 1}</div>
            <div>
              <input className={styles.input} value={q.prompt}
                     onChange={(e) => setQ(i, 'prompt', e.target.value)}
                     placeholder="Прашање" disabled={locked} />
              <textarea className={styles.ta} rows={2} value={q.notes}
                        onChange={(e) => setQ(i, 'notes', e.target.value)}
                        placeholder="Кратки белешки за авторот (опционално)" disabled={locked} />
            </div>
            {!locked && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button type="button" className={styles.btnGhost} onClick={() => moveQ(i, -1)} disabled={i === 0} aria-label="Нагоре">↑</button>
                <button type="button" className={styles.btnGhost} onClick={() => moveQ(i, 1)} disabled={i === questions.length - 1} aria-label="Надолу">↓</button>
                <button type="button" className={`${styles.btnGhost} ${styles.qaSlotRemove}`}
                        onClick={() => rmQ(i)} disabled={questions.length <= 5}>
                  Отстрани
                </button>
              </div>
            )}
          </div>
        ))}
        {!locked && questions.length < 20 && (
          <button type="button" className={styles.btnSecondary} onClick={addQ}>+ Додај прашање</button>
        )}
        {!locked && !enoughQuestions && (
          <span className={styles.help} style={{ color: '#b91c1c' }}>Потребни се барем 5 прашања.</span>
        )}
      </div>

      <div className={styles.actionRow}>
        <button type="button" className={styles.btnSecondary} onClick={cancel}>Откажи</button>
        <button type="submit" className={styles.btnPrimary} disabled={busy || !scopeOk || (!locked && !enoughQuestions)}>
          {busy ? 'Се зачувува…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
