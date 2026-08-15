import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import TopicWorklistForm from '../../../components/terminal/admin/TopicWorklistForm';
import styles from '../Topics.module.css';

export default function AdminTopicsWorklistEditPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    axios.get(`/api/admin/topics/worklist/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setItem(res.data?.item || null))
      .catch(e => setErr(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [id, token]);

  const submit = async (values) => {
    setBusy(true); setErr(null);
    try {
      await axios.put(`/api/admin/topics/worklist/${id}`, values,
        { headers: { Authorization: `Bearer ${token}` } });
      navigate('/terminal/admin/topics/worklist');
    } catch (e2) {
      const m = e2.response?.data?.message || e2.message;
      const fields = e2.response?.data?.fields;
      setErr(fields ? `${m} (${fields.join(', ')})` : m);
    } finally { setBusy(false); }
  };

  // A topic is locked for structural/question edits while a submission is in
  // flight (matches the server guard) — only open topics are fully editable.
  const locked = !!(item && (item.activeSubmissionId || item.status !== 'open'));

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Admin · Topics</span>
          <h1 className={styles.title}>Уреди тема</h1>
        </header>

        <Link to="/terminal/admin/topics/worklist" className={styles.btnSecondary} style={{ display: 'inline-block', textDecoration: 'none', marginBottom: 14 }}>
          ← Назад
        </Link>

        {loading ? (
          <div className={styles.spinner}>Се вчитува…</div>
        ) : !item ? (
          <div className={styles.toastError}>{err || 'Темата не е пронајдена.'}</div>
        ) : (
          <TopicWorklistForm
            initial={item}
            onSubmit={submit}
            busy={busy}
            error={err}
            locked={locked}
            submitLabel="Зачувај промени"
          />
        )}
      </div>
    </TerminalShell>
  );
}
