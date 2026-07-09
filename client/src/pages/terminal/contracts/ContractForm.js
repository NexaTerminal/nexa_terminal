import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from './Contracts.module.css';

/**
 * Нов договор / измени договор (cms-v1-plan.md M3).
 * Create supports manual entry + optional .docx/.pdf upload; edit patches
 * metadata (the file, once attached, is immutable in v1).
 */

const CATEGORY_OPTIONS = [
  { value: 'contract', label: 'Договор' },
  { value: 'employment', label: 'Работен однос' },
  { value: 'corporate', label: 'Корпоративен' },
  { value: 'other', label: 'Друго' }
];

const toInputDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date)) return '';
  return date.toISOString().slice(0, 10);
};

const EMPTY = {
  title: '',
  category: 'contract',
  counterpartyName: '',
  counterpartyType: 'legal',
  counterpartyEmail: '',
  valueAmount: '',
  valueCurrency: 'MKD',
  signedAt: '',
  effectiveAt: '',
  expiresAt: '',
  noticePeriodDays: '',
  notes: ''
};

export default function ContractForm() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // present → edit mode
  const editing = !!id;

  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [error, setError] = useState('');

  const authHeaders = useCallback(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  useEffect(() => {
    if (!editing) return;
    axios.get(`/api/contracts/${id}`, { headers: authHeaders() })
      .then((res) => {
        const c = res.data.data;
        setForm({
          title: c.title || '',
          category: c.category || 'contract',
          counterpartyName: c.counterparty?.name || '',
          counterpartyType: c.counterparty?.type || 'legal',
          counterpartyEmail: c.counterparty?.email || '',
          valueAmount: c.value?.amount ?? '',
          valueCurrency: c.value?.currency || 'MKD',
          signedAt: toInputDate(c.dates?.signedAt),
          effectiveAt: toInputDate(c.dates?.effectiveAt),
          expiresAt: toInputDate(c.dates?.expiresAt),
          noticePeriodDays: c.dates?.noticePeriodDays ?? '',
          notes: c.notes || ''
        });
      })
      .catch(() => setError('Договорот не може да се вчита.'))
      .finally(() => setLoading(false));
  }, [editing, id, authHeaders]);

  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const buildPayload = () => ({
    title: form.title.trim(),
    category: form.category,
    counterparty: {
      name: form.counterpartyName.trim(),
      type: form.counterpartyType,
      email: form.counterpartyEmail.trim()
    },
    value: form.valueAmount !== '' && !isNaN(Number(form.valueAmount))
      ? { amount: Number(form.valueAmount), currency: form.valueCurrency }
      : null,
    dates: {
      signedAt: form.signedAt || null,
      effectiveAt: form.effectiveAt || null,
      expiresAt: form.expiresAt || null,
      noticePeriodDays: form.noticePeriodDays !== '' ? Number(form.noticePeriodDays) : null
    },
    notes: form.notes
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Насловот е задолжителен.'); return; }
    setBusy(true); setError('');
    try {
      let contractId = id;
      if (editing) {
        await axios.patch(`/api/contracts/${id}`, buildPayload(), { headers: authHeaders() });
      } else if (file) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('meta', JSON.stringify(buildPayload()));
        const res = await axios.post('/api/contracts/upload', fd, { headers: authHeaders() });
        contractId = res.data.data._id;
      } else {
        const res = await axios.post('/api/contracts', buildPayload(), { headers: authHeaders() });
        contractId = res.data.data._id;
      }
      navigate(`/terminal/contracts/${contractId}`);
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
            <h1 className={styles.title}>{editing ? 'Измени договор' : 'Нов договор'}</h1>
            <p className={styles.subtitle}>
              {editing
                ? 'Ажурирајте ги податоците — потсетниците се прилагодуваат автоматски.'
                : 'Внесете постоечки договор рачно или прикачете .docx/.pdf. Потсетници за истек добивате автоматски (30, 7 и 1 ден претходно).'}
            </p>
          </div>
          <Link to={editing ? `/terminal/contracts/${id}` : '/terminal/contracts'} className={styles.secondaryBtn}>
            ← Назад
          </Link>
        </div>

        <form onSubmit={onSubmit}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Основни податоци</h2>
            <div className={styles.formGrid}>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="c-title">Наслов *</label>
                <input id="c-title" className={styles.input} value={form.title} onChange={set('title')} placeholder="пр. Договор за закуп — Илинденска 22" />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="c-cat">Категорија</label>
                <select id="c-cat" className={styles.select} value={form.category} onChange={set('category')}>
                  {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="c-cpname">Друга страна</label>
                <input id="c-cpname" className={styles.input} value={form.counterpartyName} onChange={set('counterpartyName')} placeholder="пр. Акме ДООЕЛ" />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="c-cptype">Тип на другата страна</label>
                <select id="c-cptype" className={styles.select} value={form.counterpartyType} onChange={set('counterpartyType')}>
                  <option value="legal">Правно лице</option>
                  <option value="natural">Физичко лице</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="c-cpemail">Е-пошта на другата страна</label>
                <input id="c-cpemail" type="email" className={styles.input} value={form.counterpartyEmail} onChange={set('counterpartyEmail')} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="c-amount">Вредност</label>
                <input id="c-amount" type="number" min="0" className={styles.input} value={form.valueAmount} onChange={set('valueAmount')} placeholder="0" />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="c-curr">Валута</label>
                <select id="c-curr" className={styles.select} value={form.valueCurrency} onChange={set('valueCurrency')}>
                  <option value="MKD">МКД</option>
                  <option value="EUR">ЕУР</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Рокови</h2>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="c-signed">Потпишан на</label>
                <input id="c-signed" type="date" className={styles.input} value={form.signedAt} onChange={set('signedAt')} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="c-eff">Важи од</label>
                <input id="c-eff" type="date" className={styles.input} value={form.effectiveAt} onChange={set('effectiveAt')} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="c-exp">Истекува на</label>
                <input id="c-exp" type="date" className={styles.input} value={form.expiresAt} onChange={set('expiresAt')} />
                <span className={styles.hint}>Го движи статусот и потсетниците.</span>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="c-notice">Отказен рок (денови)</label>
                <input id="c-notice" type="number" min="0" className={styles.input} value={form.noticePeriodDays} onChange={set('noticePeriodDays')} placeholder="пр. 30" />
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Белешки{editing ? '' : ' и датотека'}</h2>
            <div className={styles.formGrid}>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="c-notes">Белешки</label>
                <textarea id="c-notes" className={styles.textarea} value={form.notes} onChange={set('notes')} />
              </div>
              {!editing && (
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label} htmlFor="c-file">Датотека (.docx или .pdf, опционално)</label>
                  <input
                    id="c-file"
                    type="file"
                    accept=".docx,.pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
              )}
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryBtn} disabled={busy}>
              {busy ? 'Се зачувува…' : editing ? 'Зачувај измени' : 'Зачувај договор'}
            </button>
          </div>
        </form>
      </div>
    </TerminalShell>
  );
}
