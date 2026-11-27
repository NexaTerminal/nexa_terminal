import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import FeatureTermsModal from '../../../components/terminal/FeatureTermsModal';
import useTermsGate from '../../../hooks/useTermsGate';
import CompanyPostCard, { TYPE_META } from '../../../components/posts/CompanyPostCard';
import a from '../../../components/posts/postActions.module.css';
import styles from './Posts.module.css';

/**
 * „Објави" — the company publishes one of three structured posts. Fixed forms,
 * live preview, strict limits (1 active per type, 2 a week, every post expires).
 */
const TYPES = [
  { key: 'offer', desc: 'Попуст, бесплатна испорака, пакет или пробен период — со рок.' },
  { key: 'seeking', desc: 'Барате добавувач, услуга или партнер — фирмите Ви праќаат понуди.' },
  { key: 'news', desc: 'Нов производ, нова локација, соработка или вработување.' },
];
const EMPTY = {
  offer: { item: '', benefit: 'discount', value: '', audience: 'all', city: '', until: '' },
  seeking: { category: '', what: '', quantity: '', city: '', until: '' },
  news: { kind: 'product', text: '' },
};
const STATE_LABEL = { active: 'Активна', expired: 'Истечена', ended: 'Завршена', hidden: 'Скриена (пријави)', removed: 'Отстранета' };
const dayStr = (d) => d.toISOString().slice(0, 10);
const plusDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

function previewPost(type, f, meta) {
  let title = '';
  if (type === 'offer') {
    const item = f.item || 'Производ / услуга';
    if (f.benefit === 'discount') title = `−${f.value || '…'}% на ${item}`;
    else if (f.benefit === 'free_delivery') title = `Бесплатна испорака: ${item}`;
    else title = `${meta?.benefits?.[f.benefit] || ''}: ${item} — ${f.value || '…'}`;
  } else if (type === 'seeking') title = f.what || 'Што барате…';
  else title = meta?.newsKinds?.[f.kind] || '';
  const days = type === 'offer' ? 60 : 30;
  return {
    _id: 'preview', type, title, createdAt: new Date(),
    expiresAt: f.until ? new Date(f.until) : plusDays(days),
    fields: type === 'news' ? { ...f, text: f.text || 'Текст на новоста…' } : { ...f, category: f.category || 'Категорија' },
  };
}

export default function Posts() {
  const { token } = useAuth();
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
  const { requireTerms, termsModal } = useTermsGate();
  const [meta, setMeta] = useState(null);
  const [mine, setMine] = useState([]);
  const [type, setType] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const [m, p] = await Promise.all([
      axios.get('/api/company-posts/meta', auth),
      axios.get('/api/company-posts/mine', auth),
    ]);
    setMeta(m.data);
    setMine(p.data.items || []);
  }, [auth]);
  useEffect(() => { load().catch(() => setError('Грешка при вчитување.')); }, [load]);

  const f = type ? form[type] : null;
  const set = (k, v) => setForm((s) => ({ ...s, [type]: { ...s[type], [k]: v } }));
  const activeTypes = meta?.quota?.activeTypes || [];
  const weekLeft = meta ? Math.max(0, meta.quota.weekLimit - meta.quota.weekUsed) : 0;
  const profileMissing = meta?.eligibility && !/услови/i.test(meta.eligibility);

  const publish = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      await axios.post('/api/company-posts', { type, ...f }, auth);
      setNotice('Објавата е активна — ја гледаат членовите на Nexa и посетителите на Вашата страница.');
      setForm((s) => ({ ...s, [type]: EMPTY[type] }));
      setType(null);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Објавата не е зачувана.');
    } finally { setBusy(false); }
  };
  const submit = (e) => { e.preventDefault(); requireTerms('companyPost', publish); };

  const end = async (id) => {
    if (!window.confirm('Да ја завршиме објавата? Повеќе нема да се прикажува.')) return;
    try { await axios.post(`/api/company-posts/${id}/end`, {}, auth); await load(); } catch (_) { setError('Не успеа.'); }
  };

  return (
    <TerminalShell>
      <div className={styles.page}>
        <h1 className={styles.title}>Објави</h1>
        <p className={styles.subtitle}>
          Кратки објави со зададена форма: понуда, барање или новост. Ги гледаат фирмите на Nexa и посетителите на
          Вашата страница, а секоја води до контакт или понуда.
        </p>

        {error && <div className={styles.error}>{error}</div>}
        {notice && <div className={styles.notice}>{notice}</div>}
        {profileMissing && (
          <div className={styles.warn}>{meta.eligibility} <Link to="/terminal/moj-profil">Отвори Моја страница →</Link></div>
        )}

        {!type ? (
          <>
            <div className={styles.quota}>
              {meta && <>Оваа недела: <strong>{weekLeft}</strong> од {meta.quota.weekLimit} нови објави · една активна објава по тип</>}
            </div>
            <div className={styles.typeGrid}>
              {TYPES.map((t) => {
                const taken = activeTypes.includes(t.key);
                return (
                  <button key={t.key} type="button" className={`${styles.typeCard} ${styles['type_' + t.key]}`}
                    disabled={!meta || profileMissing || taken || weekLeft === 0} onClick={() => { setType(t.key); setError(''); setNotice(''); }}>
                    <strong>{TYPE_META[t.key].label}</strong>
                    <span>{taken ? 'Веќе имате активна објава од овој тип.' : weekLeft === 0 ? 'Неделниот лимит од 2 објави е искористен.' : t.desc}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className={styles.composer}>
            <form className={styles.form} onSubmit={submit}>
              <div className={styles.formHead}>
                <h2>{TYPE_META[type].label}</h2>
                <button type="button" className={a.link} onClick={() => setType(null)}>← Друг тип</button>
              </div>

              {type === 'offer' && (
                <>
                  <label><span>Производ или услуга *</span><input maxLength={60} value={f.item} onChange={(e) => set('item', e.target.value)} placeholder="пр. Торти по нарачка" /></label>
                  <div className={styles.row2}>
                    <label><span>Каква понуда *</span>
                      <select value={f.benefit} onChange={(e) => set('benefit', e.target.value)}>
                        {Object.entries(meta.benefits).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select></label>
                    {f.benefit === 'discount' && <label><span>Попуст (%) *</span><input type="number" min={5} max={90} value={f.value} onChange={(e) => set('value', e.target.value)} /></label>}
                    {f.benefit === 'bundle' && <label><span>Пакет *</span><input maxLength={60} value={f.value} onChange={(e) => set('value', e.target.value)} placeholder="пр. 3 + 1 гратис" /></label>}
                    {f.benefit === 'trial' && <label><span>Пробен период *</span><input maxLength={60} value={f.value} onChange={(e) => set('value', e.target.value)} placeholder="пр. прв месец бесплатно" /></label>}
                  </div>
                  <div className={styles.row3}>
                    <label><span>За кого</span>
                      <select value={f.audience} onChange={(e) => set('audience', e.target.value)}>
                        {Object.entries(meta.audiences).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select></label>
                    <label><span>Град (опционално)</span><input maxLength={40} value={f.city} onChange={(e) => set('city', e.target.value)} /></label>
                    <label><span>Важи до</span><input type="date" min={dayStr(new Date())} max={dayStr(plusDays(60))} value={f.until} onChange={(e) => set('until', e.target.value)} /></label>
                  </div>
                </>
              )}

              {type === 'seeking' && (
                <>
                  <label><span>Категорија *</span>
                    <select value={f.category} onChange={(e) => set('category', e.target.value)}>
                      <option value="">— изберете —</option>
                      {meta.categories.map((c) => <option key={c}>{c}</option>)}
                    </select></label>
                  <label><span>Што барате * <em>{f.what.length}/80</em></span><input maxLength={80} value={f.what} onChange={(e) => set('what', e.target.value)} placeholder="пр. Доставувач со ладилник 3 пати неделно" /></label>
                  <div className={styles.row3}>
                    <label><span>Количина / зачестеност</span><input maxLength={60} value={f.quantity} onChange={(e) => set('quantity', e.target.value)} placeholder="пр. 200 кг месечно" /></label>
                    <label><span>Град (опционално)</span><input maxLength={40} value={f.city} onChange={(e) => set('city', e.target.value)} /></label>
                    <label><span>Рок за понуди</span><input type="date" min={dayStr(new Date())} max={dayStr(plusDays(30))} value={f.until} onChange={(e) => set('until', e.target.value)} /></label>
                  </div>
                </>
              )}

              {type === 'news' && (
                <>
                  <label><span>Каква новост *</span>
                    <select value={f.kind} onChange={(e) => set('kind', e.target.value)}>
                      {Object.entries(meta.newsKinds).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select></label>
                  <label><span>Текст * <em>{f.text.length}/200</em></span>
                    <textarea rows={3} maxLength={200} value={f.text} onChange={(e) => set('text', e.target.value)} placeholder="Кратко и конкретно — што е ново и за кого." /></label>
                </>
              )}

              <p className={styles.hint}>Без линкови, е-пошта и телефони во текстот — контактот оди преку Вашата страница.
                {type === 'news' ? ' Новостите се прикажуваат 30 дена.' : ''}</p>
              <button type="submit" className={styles.publish} disabled={busy}>{busy ? 'Се објавува…' : 'Објави'}</button>
            </form>
            <div className={styles.preview}>
              <div className={styles.previewLabel}>Преглед</div>
              <CompanyPostCard post={previewPost(type, f, meta)} showAuthor={false} />
            </div>
          </div>
        )}

        <h2 className={styles.h2}>Мои објави</h2>
        {mine.length === 0 ? (
          <p className={styles.hint}>Сè уште немате објави.</p>
        ) : (
          <div className={styles.mine}>
            {mine.map((p) => (
              <CompanyPostCard key={p._id} post={p} showAuthor={false}>
                <span className={`${styles.state} ${styles['state_' + p.state]}`}>{STATE_LABEL[p.state] || p.state}</span>
                {p.interestedCount > 0 && <span className={styles.interest}>🤝 {p.interestedCount} заинтересирани</span>}
                {p.state === 'active' && <span className={a.right}><button type="button" className={a.link} onClick={() => end(p._id)}>Заврши</button></span>}
              </CompanyPostCard>
            ))}
          </div>
        )}
      </div>
      {termsModal && <FeatureTermsModal {...termsModal} />}
    </TerminalShell>
  );
}
