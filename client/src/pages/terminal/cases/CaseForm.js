import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import casesApi from '../../../services/casesApi';
import styles from '../contracts/Contracts.module.css';
import { CASE_TYPE_OPTIONS, STATUS_OPTIONS, PRIORITY_OPTIONS } from '../../../config/cases';

/** Нов предмет / измени предмет — follows the Вработени/Договори form conventions. */

const EMPTY = {
  title: '', caseType: 'parnica', status: 'open',
  clientId: '', clientName: '', clientEmail: '',
  courtName: '', internalNumber: '', caseNumber: '', opposingParty: '',
  priority: 'normal', value: '', description: '', internalNotes: ''
};

export default function CaseForm() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = !!id;

  const [form, setForm] = useState(EMPTY);
  const [clients, setClients] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [error, setError] = useState('');

  const authHeaders = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    // Saved client profiles let the lawyer link a case to a known client.
    axios.get('/api/clients', { headers: authHeaders() })
      .then((res) => setClients(res.data.items || []))
      .catch(() => { /* non-fatal — free-text client still works */ });
  }, [authHeaders]);

  useEffect(() => {
    if (!editing) return;
    casesApi.get(token, id)
      .then((res) => {
        const c = res.item;
        setForm({
          title: c.title || '', caseType: c.caseType || 'parnica', status: c.status || 'open',
          clientId: c.clientId || '', clientName: c.clientName || '', clientEmail: c.clientEmail || '',
          courtName: c.courtName || '', internalNumber: c.internalNumber || '', caseNumber: c.caseNumber || '', opposingParty: c.opposingParty || '',
          priority: c.priority || 'normal', value: c.value || '',
          description: c.description || '', internalNotes: c.internalNotes || ''
        });
      })
      .catch(() => setError('Предметот не може да се вчита.'))
      .finally(() => setLoading(false));
  }, [editing, id, token]);

  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const onPickClient = (e) => {
    const cid = e.target.value;
    const c = clients.find((x) => x._id === cid);
    setForm((s) => ({ ...s, clientId: cid, clientName: c ? c.companyName : s.clientName }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Внесете наслов на предметот.'); return; }
    setBusy(true); setError('');
    try {
      const payload = { ...form, clientId: form.clientId || null };
      const res = editing
        ? await casesApi.update(token, id, payload)
        : await casesApi.create(token, payload);
      navigate(`/terminal/cases/${res.item._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при зачувување.');
      setBusy(false);
    }
  };

  if (loading) {
    return <TerminalShell><div className={styles.page}><p>Се вчитува…</p></div></TerminalShell>;
  }

  return (
    <TerminalShell>
      <div className={styles.page}>
        <div className={styles.headRow}>
          <div>
            <h1 className={styles.title}>{editing ? 'Измени предмет' : 'Нов предмет'}</h1>
            <p className={styles.subtitle}>
              {editing
                ? 'Ажурирајте ги основните податоци за предметот.'
                : 'Отворете нов предмет — потоа додавате рокови, дневник и споделувате статус со клиентот.'}
            </p>
          </div>
          <Link to={editing ? `/terminal/cases/${id}` : '/terminal/cases'} className={styles.secondaryBtn}>← Назад</Link>
        </div>

        <form onSubmit={onSubmit}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Основни податоци</h2>
            <div className={styles.formGrid}>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="c-title">Наслов на предметот *</label>
                <input id="c-title" className={styles.input} value={form.title} onChange={set('title')} placeholder="пр. Спор за наплата на побарување — Фирма ДООЕЛ" />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="c-type">Вид на предмет</label>
                <select id="c-type" className={styles.input} value={form.caseType} onChange={set('caseType')}>
                  {CASE_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="c-status">Статус</label>
                <select id="c-status" className={styles.input} value={form.status} onChange={set('status')}>
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="c-priority">Приоритет</label>
                <select id="c-priority" className={styles.input} value={form.priority} onChange={set('priority')}>
                  {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="c-value">Вредност на спорот</label>
                <input id="c-value" className={styles.input} value={form.value} onChange={set('value')} placeholder="опционално, пр. 350.000 МКД" />
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Клиент</h2>
            <div className={styles.formGrid}>
              {clients.length > 0 && (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="c-client">Поврзи зачуван клиент</label>
                  <select id="c-client" className={styles.input} value={form.clientId} onChange={onPickClient}>
                    <option value="">— без поврзување —</option>
                    {clients.map((c) => <option key={c._id} value={c._id}>{c.companyName}</option>)}
                  </select>
                </div>
              )}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="c-cname">Име на клиент</label>
                <input id="c-cname" className={styles.input} value={form.clientName} onChange={set('clientName')} placeholder="пр. Марко Марковски / Фирма ДООЕЛ" />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="c-cemail">Е-пошта на клиент</label>
                <input id="c-cemail" type="email" className={styles.input} value={form.clientEmail} onChange={set('clientEmail')} placeholder="опционално" />
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Постапка</h2>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="c-court">Суд / институција</label>
                <input id="c-court" className={styles.input} value={form.courtName} onChange={set('courtName')} placeholder="пр. Основен суд Скопје 2" />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="c-inum">Внатрешен број</label>
                <input id="c-inum" className={styles.input} value={form.internalNumber} onChange={set('internalNumber')} placeholder="ваш деловоден број, пр. 042/25" />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="c-num">Службен број</label>
                <input id="c-num" className={styles.input} value={form.caseNumber} onChange={set('caseNumber')} placeholder="број во суд, пр. П1-123/25" />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="c-opp">Спротивна страна</label>
                <input id="c-opp" className={styles.input} value={form.opposingParty} onChange={set('opposingParty')} />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="c-desc">Опис / предмет на спорот</label>
                <textarea id="c-desc" className={styles.textarea} value={form.description} onChange={set('description')} />
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Интерни белешки</h2>
            <p className={styles.hint}>Видливи само за вас — никогаш не се прикажуваат на јавниот линк за клиентот.</p>
            <div className={styles.formGrid}>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <textarea className={styles.textarea} value={form.internalNotes} onChange={set('internalNotes')} />
              </div>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryBtn} disabled={busy}>
              {busy ? 'Се зачувува…' : editing ? 'Зачувај измени' : 'Отвори предмет'}
            </button>
          </div>
        </form>
      </div>
    </TerminalShell>
  );
}
