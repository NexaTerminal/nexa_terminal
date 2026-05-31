import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from '../Topics.module.css';

const STARTER_QUESTIONS = [
  'Која е темата во 1–2 реченици?',
  'Кого се однесува ова и зошто е важно?',
  'Кои се клучните македонски правни/регулаторни одредби?',
  'Кои се вообичаените примери и сценарија?',
  'Кои се најчестите грешки и како да се избегнат?'
];

export default function AdminTopicsWorklistNewPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [practiceArea, setPracticeArea] = useState('');
  const [category, setCategory] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [targetLengthWords, setTargetLengthWords] = useState(1500);
  const [softDeadlineDays, setSoftDeadlineDays] = useState(28);
  const [scope, setScope] = useState('');
  const [questions, setQuestions] = useState(
    STARTER_QUESTIONS.map((p, i) => ({ order: i + 1, prompt: p, notes: '' }))
  );

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const setQ = (i, key, val) => setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, [key]: val } : q));
  const addQ = () => questions.length < 20 && setQuestions([...questions, { order: questions.length + 1, prompt: '', notes: '' }]);
  const rmQ  = (i) => setQuestions(qs => qs.filter((_, idx) => idx !== i).map((q, idx) => ({ ...q, order: idx + 1 })));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const cleanQs = questions.filter(q => q.prompt.trim()).map((q, i) => ({ order: i + 1, prompt: q.prompt.trim(), notes: q.notes }));
      const res = await axios.post('/api/admin/topics/worklist', {
        title, practiceArea, category, targetKeyword,
        targetLengthWords: Number(targetLengthWords), softDeadlineDays: Number(softDeadlineDays),
        scope, questions: cleanQs
      }, { headers: { Authorization: `Bearer ${token}` } });
      navigate('/terminal/admin/topics/worklist');
    } catch (e2) {
      const m = e2.response?.data?.message || e2.message;
      const fields = e2.response?.data?.fields;
      setErr(fields ? `${m} (${fields.join(', ')})` : m);
    } finally { setBusy(false); }
  };

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Admin · Topics</span>
          <h1 className={styles.title}>Нова тема за работна листа</h1>
        </header>

        <Link to="/terminal/admin/topics/worklist" className={styles.btnSecondary} style={{ display: 'inline-block', textDecoration: 'none', marginBottom: 14 }}>
          ← Назад
        </Link>

        {err && <div className={styles.toastError}>{err}</div>}

        <form className={styles.form} onSubmit={submit}>
          <div className={styles.field}>
            <label className={styles.label}>Наслов *</label>
            <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value.slice(0, 240))} required />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Практикувана област (practice area) *</label>
            <input className={styles.input} value={practiceArea} onChange={(e) => setPracticeArea(e.target.value)}
                   placeholder="employment_law, tax_law, immigration, ..." required />
            <span className={styles.help}>Се користи за филтрирање кај членовите според нивните области.</span>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Категорија (за topics.nexa.mk)</label>
            <input className={styles.input} value={category} onChange={(e) => setCategory(e.target.value)}
                   placeholder="Трудово право, Даноци..." />
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
                     value={targetLengthWords} onChange={(e) => setTargetLengthWords(e.target.value)} />
            </div>
            <div className={styles.field} style={{ flex: 1 }}>
              <label className={styles.label}>Мек рок (дена)</label>
              <input className={styles.input} type="number" min={7} max={120}
                     value={softDeadlineDays} onChange={(e) => setSoftDeadlineDays(e.target.value)} />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Опсег (што страницата треба да покрие) *</label>
            <textarea className={styles.ta} value={scope} onChange={(e) => setScope(e.target.value)} rows={4} maxLength={1200} required />
            <span className={styles.help}>{scope.length}/1200 · минимум 40 карактери</span>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Прашања (мин 5, макс 20)</label>
            {questions.map((q, i) => (
              <div key={i} className={styles.qaSlot}>
                <div className={styles.qaSlotNum}>#{i + 1}</div>
                <div>
                  <input className={styles.input} value={q.prompt}
                         onChange={(e) => setQ(i, 'prompt', e.target.value)}
                         placeholder="Прашање" />
                  <textarea className={styles.ta} rows={2} value={q.notes}
                            onChange={(e) => setQ(i, 'notes', e.target.value)}
                            placeholder="Кратки белешки за авторот (опционално)" />
                </div>
                <button type="button" className={`${styles.btnGhost} ${styles.qaSlotRemove}`}
                        onClick={() => rmQ(i)}
                        disabled={questions.length <= 5}>
                  Отстрани
                </button>
              </div>
            ))}
            {questions.length < 20 && (
              <button type="button" className={styles.btnSecondary} onClick={addQ}>+ Додај прашање</button>
            )}
          </div>

          <div className={styles.actionRow}>
            <Link to="/terminal/admin/topics/worklist" className={styles.btnSecondary} style={{ textDecoration: 'none' }}>Откажи</Link>
            <button type="submit" className={styles.btnPrimary} disabled={busy}>{busy ? 'Се зачувува…' : 'Создади тема'}</button>
          </div>
        </form>
      </div>
    </TerminalShell>
  );
}
