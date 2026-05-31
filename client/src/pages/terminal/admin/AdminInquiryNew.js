import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from '../Inquiries.module.css';

const SOURCES = ['samodaprasham.mk', 'immigration.mk', 'macedoniancitizenship.mk', 'company.nexa.mk', 'iplaw.nexa.mk', 'tax.nexa.mk', 'other'];
const CITIES = ['Skopje', 'Bitola', 'Kumanovo', 'Prilep', 'Tetovo', 'Veles', 'Štip', 'Ohrid', 'Strumica', 'Gostivar', 'Kavadarci', 'Kočani', 'Other', 'Anywhere'];
const CATEGORIES = [
  { v: 'legal',        label: 'Правен' },
  { v: 'accounting',   label: 'Сметководство' },
  { v: 'tax',          label: 'Даноци' },
  { v: 'insurance',    label: 'Осигурување' },
  { v: 'real_estate',  label: 'Недвижности' },
  { v: 'hr',           label: 'HR' },
  { v: 'marketing',    label: 'Маркетинг' },
  { v: 'translation',  label: 'Превод' },
  { v: 'other',        label: 'Друго' }
];
const LANGS = [{ v: 'mk', label: 'Македонски' }, { v: 'en', label: 'English' }, { v: 'tr', label: 'Türkçe' }, { v: 'other', label: 'Друго' }];

export default function AdminInquiryNewPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [source, setSource] = useState('immigration.mk');
  const [topic, setTopic] = useState('');
  const [city, setCity] = useState('Skopje');
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState('');
  const [language, setLanguage] = useState('mk');
  const [urgency, setUrgency] = useState('standard');
  const [internalNotes, setInternalNotes] = useState('');
  const [inquirerName, setInquirerName] = useState('');
  const [inquirerEmail, setInquirerEmail] = useState('');
  const [inquirerPhone, setInquirerPhone] = useState('');
  const [originalEmailBody, setOriginalEmailBody] = useState('');

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const toggleCat = (v) => setCategories(cats => cats.includes(v) ? cats.filter(c => c !== v) : [...cats, v]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const res = await axios.post('/api/admin/inquiries', {
        source, topic, city, categories, summary, language, urgency,
        internalNotes, inquirerName, inquirerEmail, inquirerPhone, originalEmailBody
      }, { headers: { Authorization: `Bearer ${token}` } });
      navigate(`/terminal/admin/inquiries/${res.data?.inquiry?._id || ''}`);
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
          <span className={styles.eyebrow}>Admin · Барања</span>
          <h1 className={styles.title}>Внеси ново барање</h1>
          <p className={styles.lead}>
            Транскрипција од е-пошта добиена преку сателитските сајтови.
            Анонимизирајте го резимето; контакт податоците остануваат скриени
            додека не одобрите член.
          </p>
        </header>

        <Link to="/terminal/admin/inquiries" className={styles.btnSecondary} style={{ marginBottom: 14, display: 'inline-block', textDecoration: 'none' }}>
          ← Назад на листата
        </Link>

        {err && <div className={styles.toastError}>{err}</div>}

        <form className={styles.form} onSubmit={submit}>
          <div className={styles.field}>
            <label className={styles.label}>Извор</label>
            <select className={styles.select} value={source} onChange={(e) => setSource(e.target.value)}>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Наслов *</label>
            <input className={styles.input} value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 240))}
                   placeholder="Краток описен наслов" required />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Град *</label>
            <select className={styles.select} value={city} onChange={(e) => setCity(e.target.value)}>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className={styles.help}>Изберете „Anywhere" ако клиентот е флексибилен.</span>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Категории *</label>
            <div className={styles.checkboxRow}>
              {CATEGORIES.map(({ v, label }) => (
                <label key={v} className={styles.checkboxCell}>
                  <input type="checkbox" checked={categories.includes(v)} onChange={() => toggleCat(v)} />
                  {label}
                </label>
              ))}
            </div>
            <span className={styles.help}>Едно барање може да биде релевантно за повеќе профили.</span>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Анонимизирано резиме *</label>
            <textarea className={styles.textarea} value={summary} onChange={(e) => setSummary(e.target.value)}
                      maxLength={1200} placeholder="2–4 реченици. Без идентификатори (имиња, адреси)." />
            <span className={styles.help}>{summary.length}/1200</span>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Јазик</label>
            <select className={styles.select} value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGS.map(l => <option key={l.v} value={l.v}>{l.label}</option>)}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Итност</label>
            <div className={styles.radioRow}>
              <label className={styles.checkboxCell}>
                <input type="radio" checked={urgency === 'standard'} onChange={() => setUrgency('standard')} /> Стандардно
              </label>
              <label className={styles.checkboxCell}>
                <input type="radio" checked={urgency === 'urgent'}   onChange={() => setUrgency('urgent')} /> Итно
              </label>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Внатрешни белешки (приватни)</label>
            <textarea className={styles.textarea} rows={3} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHead}>Контакт на клиентот (никогаш не се прикажуваат на табла)</div>
            <div className={styles.field}>
              <label className={styles.label}>Име *</label>
              <input className={styles.input} value={inquirerName} onChange={(e) => setInquirerName(e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Е-пошта *</label>
              <input className={styles.input} type="email" value={inquirerEmail} onChange={(e) => setInquirerEmail(e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Телефон *</label>
              <input className={styles.input} value={inquirerPhone} onChange={(e) => setInquirerPhone(e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Оригинален текст на е-пошта (опционално, архивски)</label>
              <textarea className={styles.textarea} rows={4} value={originalEmailBody} onChange={(e) => setOriginalEmailBody(e.target.value)} />
            </div>
          </div>

          <div className={styles.actionRow}>
            <Link to="/terminal/admin/inquiries" className={styles.btnSecondary} style={{ textDecoration: 'none' }}>Откажи</Link>
            <button type="submit" className={styles.btnPrimary} disabled={busy}>{busy ? 'Се зачувува…' : 'Објави барање'}</button>
          </div>
        </form>
      </div>
    </TerminalShell>
  );
}
