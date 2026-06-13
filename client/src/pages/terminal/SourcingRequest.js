import { useState } from 'react';
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

export default function SourcingRequestPage() {
  const { token } = useAuth();
  const { requireTerms, termsModal } = useTermsGate();

  const [type, setType] = useState('product');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [region, setRegion] = useState('');
  const [budget, setBudget] = useState('');
  const [waitDays, setWaitDays] = useState('10');
  const [disclosure, setDisclosure] = useState('context');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const r = await axios.post('/api/sourcing',
        { type, category, description, region, budget, waitDays: Number(waitDays), disclosure },
        { headers: { Authorization: `Bearer ${token}` } });
      setDone({ waitDays: r.data?.waitDays || Number(waitDays) });
    } catch (e) {
      setError(e.response?.data?.message || 'Грешка при поднесување.');
    } finally { setBusy(false); }
  };

  const onSubmitClick = () => {
    setError('');
    if (!category) { setError('Изберете категорија.'); return; }
    if (description.trim().length < 10) { setError('Внесете подетален опис (најмалку 10 знаци).'); return; }
    requireTerms('tender', submit);
  };

  if (done) {
    return (
      <TerminalShell>
        <div className={styles.page}>
          <div className={styles.confirm}>
            <div className={styles.confirmBadge} aria-hidden>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <h1 className={styles.confirmTitle}>Барањето е примено</h1>
            <p className={styles.confirmText}>
              Нашиот тим ќе се обиде да обезбеди понуди од релевантни добавувачи и ќе Ве
              извести во рок од <strong>{done.waitDays} дена</strong>.
            </p>
            <p className={styles.confirmNote}>
              Ве потсетуваме: ова е барање за понуди, не нарачка. Не гарантираме дека ќе
              пристигнат понуди.
            </p>
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

          <div className={styles.howBand}>
            <div className={styles.flow}>
              <FlowStep n={1} icon={<IconEdit />} title="Опишете што Ви треба"
                desc="Краток опис, категорија и рок — за 3–5 минути." />
              <FlowStep n={2} icon={<IconBroker />} title="Nexa бара понуди"
                desc="Ги контактираме релевантните добавувачи во Ваше име." />
              <FlowStep n={3} icon={<IconOffers />} title="Добивте понуди"
                desc="Ви ги враќаме понудите во рокот што го избравте." />
            </div>
          </div>
        </header>

        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Тип на барање</label>
            <div className={styles.segmented}>
              {[['product', 'Производ'], ['service', 'Услуга']].map(([v, l]) => (
                <button key={v} type="button" className={type === v ? styles.segOn : styles.seg}
                  onClick={() => setType(v)}>{l}</button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Категорија *</label>
            <select className={styles.select} value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Изберете…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Краток опис *</label>
            <textarea className={styles.textarea} rows={4} maxLength={1500}
              placeholder="Што Ви треба, количина, спецификации, рок на испорака…"
              value={description} onChange={e => setDescription(e.target.value)} />
            <div className={styles.help}>{description.length}/1500</div>
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}>Регион / град</label>
              <input className={styles.input} placeholder="пр. Скопје" value={region} onChange={e => setRegion(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Буџет / количина</label>
              <input className={styles.input} placeholder="пр. ~50.000 ден / 100 парчиња" value={budget} onChange={e => setBudget(e.target.value)} />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Колку можете да чекате?</label>
            <div className={styles.segmented}>
              {[['8', 'До 8 дена'], ['10', 'До 10 дена'], ['15', 'До 15 дена']].map(([v, l]) => (
                <button key={v} type="button" className={waitDays === v ? styles.segOn : styles.seg}
                  onClick={() => setWaitDays(v)}>{l}</button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Колку да прикажеме за Вас кон добавувачите?</label>
            <div className={styles.radioCol}>
              {[
                ['full', 'Целосно', 'Името на мојата фирма е видливо.'],
                ['context', 'Само дејност и регион', 'Без име — само контекст (препорачано за повеќе понуди).'],
                ['anonymous', 'Анонимно', 'Ништо за мене додека не одлучам да продолжам.']
              ].map(([v, t, d]) => (
                <label key={v} className={`${styles.radioOption} ${disclosure === v ? styles.radioOn : ''}`}>
                  <input type="radio" name="disclosure" checked={disclosure === v} onChange={() => setDisclosure(v)} />
                  <span><strong>{t}</strong><span className={styles.radioDesc}>{d}</span></span>
                </label>
              ))}
            </div>
          </div>

          <p className={styles.notice}>
            ⚠️ Ова е барање за понуди, не нарачка. Nexa не гарантира дека ќе пристигнат понуди.
          </p>

          {error && <p className={styles.error}>{error}</p>}

          <button type="button" className={styles.btnPrimary} onClick={onSubmitClick} disabled={busy}>
            {busy ? 'Се испраќа…' : 'Испрати барање'}
          </button>
        </div>
      </div>

      {termsModal && <FeatureTermsModal {...termsModal} />}
    </TerminalShell>
  );
}
