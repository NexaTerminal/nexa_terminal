import { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import TopicWorklistForm from '../../../components/terminal/admin/TopicWorklistForm';
import styles from '../Topics.module.css';

const STARTER_QUESTIONS = [
  'Која е темата во 1–2 реченици?',
  'Кого се однесува ова и зошто е важно?',
  'Кои се клучните македонски правни/регулаторни одредби?',
  'Кои се вообичаените примери и сценарија?',
  'Кои се најчестите грешки и како да се избегнат?'
];

const DEFAULT = {
  title: '',
  practiceArea: '',
  category: '',
  targetKeyword: '',
  targetLengthWords: 1500,
  softDeadlineDays: 28,
  scope: '',
  questions: STARTER_QUESTIONS.map((p, i) => ({ order: i + 1, prompt: p, notes: '' }))
};

export default function AdminTopicsWorklistNewPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  // Seed the form from a "Копирај" action (router state) or a category preset
  // from the coverage overview (?category=…). Otherwise start from defaults.
  const from = location.state?.from;
  const presetCategory = searchParams.get('category') || '';
  const initial = useMemo(() => {
    if (from) {
      return {
        title: `Копија — ${from.title || ''}`.slice(0, 240),
        practiceArea: from.practiceArea || '',
        category: from.category || '',
        targetKeyword: from.targetKeyword || '',
        targetLengthWords: from.targetLengthWords ?? 1500,
        softDeadlineDays: from.softDeadlineDays ?? 28,
        scope: from.scope || '',
        questions: (from.questions || []).map((q, i) => ({ order: i + 1, prompt: q.prompt || '', notes: q.notes || '' }))
      };
    }
    return { ...DEFAULT, category: presetCategory };
  }, [from, presetCategory]);

  const submit = async (values) => {
    setBusy(true); setErr(null);
    try {
      await axios.post('/api/admin/topics/worklist', values,
        { headers: { Authorization: `Bearer ${token}` } });
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

        <TopicWorklistForm
          initial={initial}
          onSubmit={submit}
          busy={busy}
          error={err}
          submitLabel="Создади тема"
        />
      </div>
    </TerminalShell>
  );
}
