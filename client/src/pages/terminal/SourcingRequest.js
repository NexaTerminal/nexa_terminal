import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import FeatureTermsModal from '../../components/terminal/FeatureTermsModal';
import useTermsGate from '../../hooks/useTermsGate';
import styles from './Sourcing.module.css';

const CATEGORIES = [
  'ИТ и софтвер', 'Маркетинг и реклама', 'Канцелариска опрема и материјали',
  'Информатичка опрема (хардвер)', 'Транспорт и логистика', 'Градежништво и реновирање',
  'Правни услуги', 'Сметководство и финансии', 'Консалтинг',
  'Производство и индустриска опрема', 'Угостителство и кетеринг', 'Чистење и одржување',
  'Обука и едукација', 'Преведување', 'Друго'
];
const TYPE_MK = { product: 'Производ', service: 'Услуга' };
const DISCLOSURE_HINT = {
  full: 'Името на Вашата фирма е видливо за добавувачите.',
  context: 'Без име — само дејност и регион (препорачано за повеќе понуди).',
  anonymous: 'Ништо за Вас додека не одлучите да продолжите.'
};
const EMPTY = { type: 'product', category: '', description: '', region: '', budget: '', waitDays: '10', disclosure: 'context' };
const fmt = (d) => d ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const sSvg = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const IconEdit = () => (<svg {...sSvg}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>);
const IconBroker = () => (<svg {...sSvg}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>);
const IconOffers = () => (<svg {...sSvg}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>);

const FlowStep = ({ n, icon, title, desc }) => (
  <div className={styles.flowStep}>
    <span className={styles.flowIcon} aria-hidden>{icon}<span className={styles.flowNum}>{n}</span></span>
    <span className={styles.flowTitle}>{title}</span>
    <span className={styles.flowDesc}>{desc}</span>
  </div>
);

const quotaText = (used, total) => `${used}/${total == null ? '∞' : total}`;

export default function SourcingRequestPage() {
  const { token } = useAuth();
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const { requireTerms, termsModal } = useTermsGate();

  const [tab, setTab] = useState('new');
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const [toast, setToast] = useState('');
  const [mine, setMine] = useState(null); // { items, quota, usage }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const loadMine = useCallback(async () => {
    try {
      const r = await axios.get('/api/sourcing/me', auth);
      setMine(r.data || null);
    } catch { setMine(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { loadMine(); }, [loadMine]);

  const q = mine?.quota || {};
  const u = mine?.usage || { requestsUsed: 0, editsUsed: 0 };
  const reqLeft = q.requests == null ? Infinity : q.requests - u.requestsUsed;
  const editLeft = q.edits == null ? Infinity : q.edits - u.editsUsed;
  const blocked = editId ? editLeft <= 0 : reqLeft <= 0;

  const submit = async () => {
    setBusy(true); setError('');
    const payload = { ...form, waitDays: Number(form.waitDays) };
    try {
      if (editId) {
        await axios.put(`/api/sourcing/${editId}`, payload, auth);
        setEditId(null); setForm(EMPTY); setTab('mine'); setToast('Измената е зачувана.');
        loadMine();
      } else {
        const r = await axios.post('/api/sourcing', payload, auth);
        setDone({ waitDays: r.data?.waitDays || Number(form.waitDays) });
        loadMine();
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Грешка при поднесување.');
    } finally { setBusy(false); }
  };

  const onSubmitClick = () => {
    setError('');
    if (!form.category) return setError('Изберете категорија.');
    if (form.description.trim().length < 10) return setError('Внесете подетален опис (најмалку 10 знаци).');
    if (blocked) return setError(editId ? 'Ја искористивте квотата за измени овој месец.' : 'Ја искористивте квотата за барања овој месец.');
    requireTerms('tender', submit);
  };

  const startEdit = (item) => {
    setForm({ type: item.type, category: item.category, description: item.description, region: item.region || '', budget: item.budget || '', waitDays: String(item.waitDays), disclosure: item.disclosure });
    setEditId(item._id); setDone(null); setError(''); setTab('new');
  };
  const startNew = () => { setForm(EMPTY); setEditId(null); setDone(null); setError(''); setTab('new'); };

  // ---- Confirmation ----
  if (done) {
    return (
      <TerminalShell>
        <div className={styles.page}>
          <div className={styles.confirm}>
            <div className={styles.confirmBadge} aria-hidden>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <h1 className={styles.confirmTitle}>Барањето е примено</h1>
            <p className={styles.confirmText}>Ќе се обидеме да обезбедиме понуди од релевантни добавувачи и ќе Ве известиме во рок од <strong>{done.waitDays} дена</strong>.</p>
            <p className={styles.confirmNote}>Ова е барање за понуди, не нарачка. Не гарантираме понуди.</p>
            <button type="button" className={styles.btnPrimary} onClick={() => { setDone(null); setTab('mine'); }} style={{ marginTop: 14 }}>Кон моите барања</button>
          </div>
        </div>
      </TerminalShell>
    );
  }

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Вмрежување и можности</span>
          <h1 className={styles.title}>Барање за понуди</h1>
          <p className={styles.lead}>
            Започнете мини-тендер за неколку минути. Опишете што Ви треба — производ или услуга —
            а Nexa испраќа барање до релевантни добавувачи и Ви ги враќа понудите. Вие одлучувате
            колку да откриете за себе.
          </p>
        </header>

        {mine && (
          <div className={styles.quotaBar}>
            <span>Барања овој месец: <strong>{quotaText(u.requestsUsed, q.requests)}</strong></span>
            <span>Измени: <strong>{quotaText(u.editsUsed, q.edits)}</strong></span>
            {q.requests === 0 && <span className={styles.quotaUpgrade}>Достапно за Про членови</span>}
          </div>
        )}

        <nav className={styles.tabs}>
          <button type="button" className={tab === 'new' ? styles.tabOn : styles.tab} onClick={startNew}>
            {editId ? 'Измени барање' : 'Ново барање'}
          </button>
          <button type="button" className={tab === 'mine' ? styles.tabOn : styles.tab} onClick={() => setTab('mine')}>
            Мои барања{mine?.items?.length ? ` (${mine.items.length})` : ''}
          </button>
        </nav>

        {tab === 'new' ? (
          <>
            {!editId && (
              <div className={styles.howBand}>
                <div className={styles.flow}>
                  <FlowStep n={1} icon={<IconEdit />} title="Опишете што Ви треба" desc="Краток опис, категорија и рок — за 3–5 минути." />
                  <FlowStep n={2} icon={<IconBroker />} title="Nexa бара понуди" desc="Ги контактираме релевантните добавувачи во Ваше име." />
                  <FlowStep n={3} icon={<IconOffers />} title="Добивте понуди" desc="Ви ги враќаме понудите во рокот што го избравте." />
                </div>
              </div>
            )}

            <div className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Тип на барање</label>
                <div className={styles.segmented}>
                  {[['product', 'Производ'], ['service', 'Услуга']].map(([v, l]) => (
                    <button key={v} type="button" className={form.type === v ? styles.segOn : styles.seg} onClick={() => set('type', v)}>{l}</button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Категорија *</label>
                <select className={styles.select} value={form.category} onChange={e => set('category', e.target.value)}>
                  <option value="">Изберете…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Краток опис *</label>
                <textarea className={styles.textarea} rows={4} maxLength={1500}
                  placeholder="Што Ви треба, количина, спецификации, рок на испорака…"
                  value={form.description} onChange={e => set('description', e.target.value)} />
                <div className={styles.help}>{form.description.length}/1500</div>
              </div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.label}>Регион / град</label>
                  <input className={styles.input} placeholder="пр. Скопје" value={form.region} onChange={e => set('region', e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Буџет / количина</label>
                  <input className={styles.input} placeholder="пр. ~50.000 ден / 100 парчиња" value={form.budget} onChange={e => set('budget', e.target.value)} />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Колку можете да чекате?</label>
                <div className={styles.segmented}>
                  {[['8', 'До 8 дена'], ['10', 'До 10 дена'], ['15', 'До 15 дена']].map(([v, l]) => (
                    <button key={v} type="button" className={form.waitDays === v ? styles.segOn : styles.seg} onClick={() => set('waitDays', v)}>{l}</button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Колку да прикажеме за Вас?</label>
                <div className={styles.segmented}>
                  {[['full', 'Целосно'], ['context', 'Само дејност и регион'], ['anonymous', 'Анонимно']].map(([v, l]) => (
                    <button key={v} type="button" className={form.disclosure === v ? styles.segOn : styles.seg} onClick={() => set('disclosure', v)}>{l}</button>
                  ))}
                </div>
                <p className={styles.fieldHint}>{DISCLOSURE_HINT[form.disclosure]}</p>
              </div>

              <p className={styles.notice}>⚠️ Ова е барање за понуди, не нарачка. Nexa не гарантира дека ќе пристигнат понуди.</p>

              {blocked && (
                <p className={styles.error}>
                  {q.requests === 0
                    ? 'Барање за понуди е достапно за Про членови.'
                    : (editId ? 'Ја искористивте квотата за измени овој месец.' : 'Ја искористивте квотата за барања овој месец. Обновата е на почетокот на наредниот месец.')}
                </p>
              )}
              {error && <p className={styles.error}>{error}</p>}

              <div className={styles.actions}>
                <button type="button" className={styles.btnPrimary} onClick={onSubmitClick} disabled={busy || blocked}>
                  {busy ? 'Се испраќа…' : (editId ? 'Зачувај измена' : 'Испрати барање')}
                </button>
                {editId && <button type="button" className={styles.btnGhost} onClick={startNew}>Откажи</button>}
              </div>
            </div>
          </>
        ) : (
          <div className={styles.mine}>
            {!mine?.items?.length ? (
              <div className={styles.emptyMine}>Сè уште немате барања. <button type="button" className={styles.linkBtn} onClick={startNew}>Започнете прво барање →</button></div>
            ) : (
              mine.items.map(item => (
                <div key={item._id} className={styles.reqCard}>
                  <div className={styles.reqTop}>
                    <span className={styles.reqCat}>{item.category}</span>
                    <span className={styles.reqType}>{TYPE_MK[item.type]}</span>
                    <span className={styles.reqDate}>{fmt(item.createdAt)}</span>
                  </div>
                  <p className={styles.reqDesc}>{item.description}</p>
                  <div className={styles.reqFoot}>
                    <span className={styles.reqMeta}>Рок: {item.waitDays} дена{item.region ? ` · ${item.region}` : ''}</span>
                    <button type="button" className={styles.btnGhost} onClick={() => startEdit(item)} disabled={editLeft <= 0}>Уреди</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {toast && <div className={styles.toastOk} onClick={() => setToast('')}>{toast}</div>}
      {termsModal && <FeatureTermsModal {...termsModal} />}
    </TerminalShell>
  );
}
