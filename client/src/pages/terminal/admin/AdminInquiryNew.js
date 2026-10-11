import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import { CATEGORY_LABEL, CATEGORY_OPTIONS } from '../../../config/inquiryCategories';
import { PROCEDURE_OPTIONS, PROCEDURES } from '../../../config/procedures';
import styles from '../Inquiries.module.css';

const SOURCES = ['samodaprasham.mk', 'immigration.mk', 'macedoniancitizenship.mk', 'company.nexa.mk', 'iplaw.nexa.mk', 'properties.nexa.mk', 'tax.nexa.mk', 'other'];
const CITIES = ['Skopje', 'Bitola', 'Kumanovo', 'Prilep', 'Tetovo', 'Veles', 'Štip', 'Ohrid', 'Strumica', 'Gostivar', 'Kavadarci', 'Kočani', 'Other', 'Anywhere'];
const LANGS = [{ v: 'mk', label: 'Македонски' }, { v: 'en', label: 'English' }, { v: 'tr', label: 'Türkçe' }, { v: 'other', label: 'Друго' }];

export default function AdminInquiryNewPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [source, setSource] = useState('immigration.mk');
  const [topic, setTopic] = useState('');
  const [city, setCity] = useState('Skopje');
  const [procedureType, setProcedureType] = useState('');
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

  // AI assist: paste the raw email, let AI anonymize + pre-fill the form below.
  const [rawEmail, setRawEmail] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState(null);

  const toggleCat = (v) => setCategories(cats => cats.includes(v) ? cats.filter(c => c !== v) : [...cats, v]);

  // Call the AI extractor and spread the returned draft across the form fields.
  // Only non-empty values overwrite, so a blank field from the AI keeps any prior input.
  const runAiAssist = async () => {
    if (!rawEmail.trim() || aiBusy) return;
    setAiBusy(true); setErr(null); setAiNote(null);
    try {
      const res = await axios.post('/api/admin/inquiries/draft-from-email',
        { rawText: rawEmail },
        { headers: { Authorization: `Bearer ${token}` } });
      const d = res.data?.draft || {};
      if (d.source) setSource(d.source);
      if (d.topic) setTopic(d.topic);
      if (d.city) setCity(d.city);
      if (d.procedureType) setProcedureType(d.procedureType);
      if (Array.isArray(d.categories) && d.categories.length) setCategories(d.categories);
      if (d.summary) setSummary(d.summary);
      if (d.language) setLanguage(d.language);
      if (d.urgency) setUrgency(d.urgency);
      if (d.inquirerName) setInquirerName(d.inquirerName);
      if (d.inquirerEmail) setInquirerEmail(d.inquirerEmail);
      if (d.inquirerPhone) setInquirerPhone(d.inquirerPhone);
      setOriginalEmailBody(d.originalEmailBody || rawEmail);

      const missing = [];
      if (!d.summary) missing.push('резиме');
      if (!d.city) missing.push('град');
      if (!(d.categories || []).length) missing.push('категории');
      if (!d.inquirerName) missing.push('име');
      if (!d.inquirerEmail && !d.inquirerPhone) missing.push('контакт');
      setAiNote(missing.length
        ? `Прегледајте и дополнете: ${missing.join(', ')}. Контакт податоците остануваат скриени од таблата.`
        : 'Пополнето. Прегледајте го резимето пред да објавите.');
    } catch (e2) {
      setErr(e2.response?.data?.message || e2.message);
    } finally { setAiBusy(false); }
  };

  // Choosing a procedure pre-fills the categories it touches (still editable).
  const onProcedureChange = (v) => {
    setProcedureType(v);
    const proc = PROCEDURES[v];
    if (proc) setCategories(Array.from(new Set(proc.categories)));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const res = await axios.post('/api/admin/inquiries', {
        source, topic, city, procedureType: procedureType || null, categories, summary, language, urgency,
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

        <div className={styles.panel} style={{ marginBottom: 16 }}>
          <div className={styles.panelHead}>AI помош — залепи ја е-поштата</div>
          <div className={styles.field}>
            <label className={styles.label}>Текст на е-поштата</label>
            <textarea className={styles.textarea} rows={5} value={rawEmail}
                      onChange={(e) => setRawEmail(e.target.value)}
                      placeholder="Залепете го целиот текст на е-поштата добиена од сателитскиот сајт. AI ќе ги отстрани личните податоци и ќе ги пополни полињата подолу." />
            <span className={styles.help}>Контакт податоците одат во скриениот панел; резимето на таблата е анонимизирано.</span>
          </div>
          {aiNote && <div className={styles.help} style={{ marginBottom: 8 }}>✓ {aiNote}</div>}
          <button type="button" className={styles.btnSecondary} onClick={runAiAssist} disabled={aiBusy || !rawEmail.trim()}>
            {aiBusy ? 'AI обработува…' : 'AI подготви'}
          </button>
        </div>

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
            <label className={styles.label}>Постапка (опционално)</label>
            <select className={styles.select} value={procedureType} onChange={(e) => onProcedureChange(e.target.value)}>
              <option value="">— Без постапка —</option>
              {PROCEDURE_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <span className={styles.help}>Изберете постапка за автоматски да се означат поврзаните категории (пр. Имиграција → престој, недвижности, осигурување). Членовите гледаат предлог зошто барањето е релевантно за нив.</span>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Категории *</label>
            <div className={styles.catPicker}>
              {CATEGORY_OPTIONS.map(v => (
                <button key={v} type="button"
                        className={`${styles.catOption} ${categories.includes(v) ? styles.catOptionActive : ''}`}
                        onClick={() => toggleCat(v)}>
                  {CATEGORY_LABEL[v]}
                </button>
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
