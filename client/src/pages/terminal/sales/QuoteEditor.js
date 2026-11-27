import { Fragment, useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import {
  VAT_RATES, UNITS, PAYMENT_TERMS, DELIVERY_TERMS, STATUS,
  computeTotals, money, fmtDay, daysSince, quoteUrl, borisQuestion,
} from '../../../lib/quotes';
import styles from './Quotes.module.css';

/**
 * „Понуда" editor — build the quote, see the margin (private), let Борис check
 * it and Миа write the intro, then share the client link and follow what the
 * client does with it (opened → accepted / declined / question).
 */

const EMPTY_ITEM = { name: '', description: '', qty: 1, unit: 'ком.', price: '', vat: 18, cost: '' };
const EVENT_LABEL = {
  created: 'Креирана', sent: 'Испратена', viewed: 'Клиентот ја отвори',
  accepted: 'Прифатена', declined: 'Одбиена', question: 'Прашање од клиентот',
};

const toForm = (q) => ({
  title: q.title || '',
  intro: q.intro || '',
  client: { name: '', person: '', email: '', phone: '', address: '', taxNumber: '', ...(q.client || {}) },
  items: (q.items || []).length ? q.items.map((it) => ({ ...EMPTY_ITEM, ...it, cost: it.cost ?? '' })) : [{ ...EMPTY_ITEM }],
  discountPct: q.discountPct || 0,
  currency: q.currency || 'MKD',
  validUntil: q.validUntil ? String(q.validUntil).slice(0, 10) : '',
  paymentTerms: q.paymentTerms || '',
  deliveryTerms: q.deliveryTerms || '',
  note: q.note || '',
});

export default function QuoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const [quote, setQuote] = useState(null);
  const [issuer, setIssuer] = useState(null);
  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [followup, setFollowup] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`/api/sales/quotes/${id}`, auth);
      setQuote(res.data.data);
      setIssuer(res.data.issuer);
      setForm(toForm(res.data.data));
      setDirty(false);
    } catch (e) {
      setError(e.response?.data?.message || 'Понудата не е пронајдена.');
    }
  }, [id, auth]);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => (form ? computeTotals(form.items, form.discountPct) : null), [form]);
  const status = quote?.statusNow || quote?.status;
  const locked = status === 'accepted' || status === 'declined';

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setDirty(true); };
  const setClient = (k, v) => { setForm((f) => ({ ...f, client: { ...f.client, [k]: v } })); setDirty(true); };
  const setItem = (i, k, v) => {
    setForm((f) => ({ ...f, items: f.items.map((it, j) => (j === i ? { ...it, [k]: v } : it)) }));
    setDirty(true);
  };
  const addItem = () => { setForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] })); setDirty(true); };
  const removeItem = (i) => {
    setForm((f) => ({ ...f, items: f.items.length > 1 ? f.items.filter((_, j) => j !== i) : [{ ...EMPTY_ITEM }] }));
    setDirty(true);
  };

  const payload = () => ({
    ...form,
    items: form.items.filter((it) => String(it.name).trim()),
    validUntil: form.validUntil || null,
  });

  const save = async () => {
    setBusy('save'); setError(''); setNotice('');
    try {
      const res = await axios.patch(`/api/sales/quotes/${id}`, payload(), auth);
      setQuote(res.data.data);
      setDirty(false);
      setNotice('Зачувано.');
      return true;
    } catch (e) {
      setError(e.response?.data?.message || 'Грешка при зачувување.');
      return false;
    } finally { setBusy(''); }
  };

  const send = async () => {
    if (dirty && !(await save())) return;
    setBusy('send'); setError(''); setNotice('');
    try {
      const res = await axios.post(`/api/sales/quotes/${id}/send`, {}, auth);
      setQuote(res.data.data);
      setNotice('Понудата е подготвена за испраќање — копирајте го линкот или пратете го преку WhatsApp, Viber или е-пошта.');
    } catch (e) {
      setError(e.response?.data?.message || 'Грешка при испраќање.');
    } finally { setBusy(''); }
  };

  const duplicate = async () => {
    setBusy('dup');
    try {
      const res = await axios.post(`/api/sales/quotes/${id}/duplicate`, {}, auth);
      navigate(`/terminal/ponudi/${res.data.data._id}`);
    } catch (e) {
      setError(e.response?.data?.message || 'Грешка при копирање.');
    } finally { setBusy(''); }
  };

  const remove = async () => {
    if (!window.confirm('Да се избрише понудата? Линкот кај клиентот повеќе нема да работи.')) return;
    try {
      await axios.delete(`/api/sales/quotes/${id}`, auth);
      navigate('/terminal/ponudi');
    } catch (e) { setError(e.response?.data?.message || 'Грешка при бришење.'); }
  };

  const askMia = async (kind) => {
    if (kind === 'intro' && dirty && !(await save())) return;
    setBusy(kind); setError('');
    try {
      const res = await axios.post(`/api/sales/quotes/${id}/ai-text`, { kind }, auth);
      if (kind === 'intro') set('intro', res.data.data.text);
      else setFollowup(res.data.data.text);
    } catch (e) {
      setError(e.response?.data?.message || 'Миа моментално не може да напише текст.');
    } finally { setBusy(''); }
  };

  const askBoris = () => {
    const q = borisQuestion(form, totals);
    navigate(`/terminal/ai-chat?agent=business&q=${encodeURIComponent(q)}`);
  };

  const copy = async (text, msg) => {
    try { await navigator.clipboard.writeText(text); setNotice(msg); } catch (_) { setNotice(text); }
  };

  if (error && !quote) {
    return <TerminalShell><div className={styles.page}><div className={styles.error}>{error}</div><Link to="/terminal/ponudi">← Сите понуди</Link></div></TerminalShell>;
  }
  if (!form) {
    return <TerminalShell><div className={styles.page}><div className={styles.loading}>Се вчитува…</div></div></TerminalShell>;
  }

  const link = quote.token && status !== 'draft' ? quoteUrl(quote.token) : null;
  const cur = form.currency;
  const shareText = `Почитувани, Ви ја испраќаме понудата ${quote.number}${form.title ? ` — ${form.title}` : ''}: ${link}`;
  const quiet = (status === 'sent' || status === 'viewed') && daysSince(quote.sentAt) >= 3;
  const missingCompany = !issuer?.name;

  return (
    <TerminalShell>
      <div className={styles.page}>
        <div className={styles.headRow}>
          <div>
            <Link to="/terminal/ponudi" className={styles.back}>← Сите понуди</Link>
            <h1 className={styles.title}>
              Понуда {quote.number}
              <span className={`${styles.status} ${styles['tone_' + (STATUS[status]?.tone || 'neutral')]}`}>{STATUS[status]?.label || status}</span>
            </h1>
            {quote.dealId && <p className={styles.subtitle}>Поврзана со зделка во <Link to="/terminal/sales">Клиенти</Link> — кога клиентот ќе одговори, зделката се преместува сама.</p>}
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {notice && <div className={styles.notice}>{notice}</div>}
        {missingCompany && (
          <div className={styles.warn}>
            Понудата ги зема податоците за Вашата фирма од <Link to="/terminal/verification">Податоци за фирма</Link> и
            логото од <Link to="/terminal/moj-profil">Мој профил</Link>. Пополнете ги за понудата да изгледа професионално.
          </div>
        )}
        {locked && quote.response && (
          <div className={status === 'accepted' ? styles.successBox : styles.declineBox}>
            <strong>{status === 'accepted' ? '✅ Клиентот ја прифати понудата' : '✕ Клиентот ја одби понудата'}</strong>
            {' '}— {quote.response.name}, {fmtDay(quote.response.at)}
            {quote.response.note && <p className={styles.respNote}>„{quote.response.note}"</p>}
            <p className={styles.hint}>Прифатената или одбиената понуда не се менува. За нова варијанта: „Копирај како нова".</p>
          </div>
        )}

        <div className={styles.editorGrid}>
          <div className={styles.editorMain}>
            <fieldset disabled={locked} className={styles.fieldset}>
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Клиент</h2>
                <div className={styles.grid2}>
                  <label className={styles.field}><span>Фирма или лице *</span>
                    <input value={form.client.name} onChange={(e) => setClient('name', e.target.value)} /></label>
                  <label className={styles.field}><span>Лице за контакт</span>
                    <input value={form.client.person} onChange={(e) => setClient('person', e.target.value)} /></label>
                  <label className={styles.field}><span>Е-пошта</span>
                    <input type="email" value={form.client.email} onChange={(e) => setClient('email', e.target.value)} /></label>
                  <label className={styles.field}><span>Телефон</span>
                    <input value={form.client.phone} onChange={(e) => setClient('phone', e.target.value)} /></label>
                  <label className={styles.field}><span>Адреса</span>
                    <input value={form.client.address} onChange={(e) => setClient('address', e.target.value)} /></label>
                  <label className={styles.field}><span>ЕДБ (ако е фирма)</span>
                    <input value={form.client.taxNumber} onChange={(e) => setClient('taxNumber', e.target.value)} /></label>
                </div>
              </section>

              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Понуда</h2>
                <label className={styles.field}><span>Наслов (опционално)</span>
                  <input placeholder="пр. Одржување на веб-страница за 2027" value={form.title} onChange={(e) => set('title', e.target.value)} /></label>
                <label className={styles.field}>
                  <span className={styles.labelRow}>Вовед
                    {!locked && <button type="button" className={styles.aiBtn} disabled={!!busy} onClick={() => askMia('intro')}>
                      {busy === 'intro' ? 'Миа пишува…' : '✨ Миа: напиши вовед'}
                    </button>}
                  </span>
                  <textarea rows={3} value={form.intro} onChange={(e) => set('intro', e.target.value)}
                    placeholder="Кратко: што нудите и зошто е добро за клиентот." /></label>
              </section>

              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Ставки <span className={styles.cardHint}>цените се без ДДВ</span></h2>
                <datalist id="quote-offers">{(issuer?.offers || []).map((o) => <option key={o} value={o} />)}</datalist>
                <div className={styles.items}>
                  <div className={`${styles.itemRow} ${styles.itemHead}`}>
                    <span>Производ / услуга</span><span>Кол.</span><span>Единица</span><span>Цена</span><span>ДДВ</span>
                    <span title="Само за Вас — клиентот не го гледа">Ваш трошок 🔒</span><span>Износ</span><span />
                  </div>
                  {form.items.map((it, i) => (
                    <div key={i} className={styles.itemRow}>
                      <span className={styles.itemName}>
                        <input list="quote-offers" placeholder="Назив" value={it.name} onChange={(e) => setItem(i, 'name', e.target.value)} />
                        <input className={styles.itemDesc} placeholder="Опис (опционално)" value={it.description} onChange={(e) => setItem(i, 'description', e.target.value)} />
                      </span>
                      <input type="number" min="0" step="any" value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} aria-label="Количина" />
                      <select value={it.unit} onChange={(e) => setItem(i, 'unit', e.target.value)} aria-label="Единица">
                        {(UNITS.some((u) => u.v === it.unit) ? UNITS : [{ v: it.unit, l: it.unit }, ...UNITS]).map((u) => <option key={u.v} value={u.v} title={u.l}>{u.v}</option>)}
                      </select>
                      <input type="number" min="0" step="any" value={it.price} onChange={(e) => setItem(i, 'price', e.target.value)} aria-label="Цена" />
                      <select value={it.vat} onChange={(e) => setItem(i, 'vat', Number(e.target.value))} aria-label="ДДВ">
                        {VAT_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                      </select>
                      <input type="number" min="0" step="any" placeholder="—" value={it.cost} onChange={(e) => setItem(i, 'cost', e.target.value)} aria-label="Ваш трошок по единица" className={styles.costInput} />
                      <span className={styles.lineTotal}>{money((Number(it.qty) || 0) * (Number(it.price) || 0), cur)}</span>
                      <button type="button" className={styles.removeBtn} onClick={() => removeItem(i)} aria-label="Отстрани ставка">×</button>
                    </div>
                  ))}
                </div>
                <button type="button" className={styles.linkBtn} onClick={addItem}>+ Додади ставка</button>
              </section>

              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Услови</h2>
                <div className={styles.grid3}>
                  <label className={styles.field}><span>Попуст на целата понуда (%)</span>
                    <input type="number" min="0" max="100" step="any" value={form.discountPct} onChange={(e) => set('discountPct', e.target.value)} /></label>
                  <label className={styles.field}><span>Валута</span>
                    <select value={form.currency} onChange={(e) => set('currency', e.target.value)}>
                      <option value="MKD">Денари (ден.)</option><option value="EUR">Евра (€)</option>
                    </select></label>
                  <label className={styles.field}><span>Важи до</span>
                    <input type="date" value={form.validUntil} onChange={(e) => set('validUntil', e.target.value)} /></label>
                </div>
                <div className={styles.grid2}>
                  <label className={styles.field}><span>Плаќање</span>
                    <input list="quote-pay" value={form.paymentTerms} onChange={(e) => set('paymentTerms', e.target.value)} />
                    <datalist id="quote-pay">{PAYMENT_TERMS.map((t) => <option key={t} value={t} />)}</datalist></label>
                  <label className={styles.field}><span>Испорака / рок</span>
                    <input list="quote-del" value={form.deliveryTerms} onChange={(e) => set('deliveryTerms', e.target.value)} />
                    <datalist id="quote-del">{DELIVERY_TERMS.map((t) => <option key={t} value={t} />)}</datalist></label>
                </div>
                <label className={styles.field}><span>Забелешка (опционално)</span>
                  <textarea rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} /></label>
              </section>
            </fieldset>
          </div>

          <aside className={styles.editorSide}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Вкупно</h2>
              <dl className={styles.totals}>
                <dt>Износ</dt><dd>{money(totals.subtotal, cur)}</dd>
                {totals.discount > 0 && <><dt>Попуст {form.discountPct}%</dt><dd>− {money(totals.discount, cur)}</dd></>}
                <dt>Без ДДВ</dt><dd>{money(totals.net, cur)}</dd>
                {totals.vatBreakdown.filter((v) => v.rate > 0).map((v) => <Fragment key={v.rate}><dt>ДДВ {v.rate}%</dt><dd>{money(v.amount, cur)}</dd></Fragment>)}
                <dt className={styles.grand}>Вкупно со ДДВ</dt><dd className={styles.grand}>{money(totals.total, cur)}</dd>
              </dl>
              {totals.margin ? (
                <div className={`${styles.margin} ${totals.margin.pct < 15 ? styles.marginLow : ''}`}>
                  🔒 Ваша маржа: <strong>{totals.margin.pct}%</strong> · заработка {money(totals.margin.profit, cur)}
                  {!totals.margin.allLines && <span className={styles.hint}> (само ставки со внесен трошок)</span>}
                </div>
              ) : (
                <p className={styles.hint}>Внесете „Ваш трошок" за да ја видите маржата. Клиентот не го гледа.</p>
              )}
              <button type="button" className={styles.borisBtn} onClick={askBoris} disabled={!totals.net}>
                Борис: провери ја понудата →
              </button>
            </section>

            {!locked && (
              <section className={styles.card}>
                <button type="button" className={styles.primaryBtn} disabled={!!busy} onClick={send}>
                  {busy === 'send' ? 'Се подготвува…' : status === 'draft' ? 'Испрати понуда' : 'Зачувај и обнови линк'}
                </button>
                <button type="button" className={styles.secondaryBtn} disabled={!!busy || !dirty} onClick={save}>
                  {busy === 'save' ? 'Се зачувува…' : dirty ? 'Зачувај нацрт' : 'Зачувано'}
                </button>
                {status !== 'draft' && <p className={styles.hint}>Измените веднаш ги гледа клиентот на истиот линк.</p>}
              </section>
            )}

            {link && (
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Линк за клиентот</h2>
                <div className={styles.linkBox}>{link}</div>
                <div className={styles.shareRow}>
                  <button type="button" className={styles.chip} onClick={() => copy(link, 'Линкот е копиран.')}>Копирај линк</button>
                  <a className={styles.chip} href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">WhatsApp</a>
                  <a className={styles.chip} href={`viber://forward?text=${encodeURIComponent(shareText)}`}>Viber</a>
                  <a className={styles.chip} href={`mailto:${form.client.email || ''}?subject=${encodeURIComponent(`Понуда ${quote.number}${form.title ? ' — ' + form.title : ''}`)}&body=${encodeURIComponent(shareText)}`}>Е-пошта</a>
                  <a className={styles.chip} href={`${link}?preview=1`} target="_blank" rel="noreferrer">Преглед</a>
                </div>
                <p className={styles.hint}>Клиентот ја отвора понудата, може да ја зачува како PDF и одговара со едно копче.</p>
              </section>
            )}

            {status !== 'draft' && (
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Што направи клиентот</h2>
                <p className={styles.trackLine}>
                  {quote.viewCount ? <>Отворена <strong>{quote.viewCount}×</strong>, последно {fmtDay(quote.lastViewedAt)}</> : 'Сè уште не е отворена.'}
                </p>
                {quiet && <div className={styles.warn}>Испратена пред {daysSince(quote.sentAt)} дена, без одговор. Добро време за кратко потсетување.</div>}
                {(status === 'sent' || status === 'viewed') && (
                  <button type="button" className={styles.aiBtn} disabled={!!busy} onClick={() => askMia('followup')}>
                    {busy === 'followup' ? 'Миа пишува…' : '✨ Миа: напиши потсетување'}
                  </button>
                )}
                {followup && (
                  <div className={styles.followup}>
                    <p>{followup}</p>
                    <button type="button" className={styles.chip} onClick={() => copy(followup, 'Текстот е копиран.')}>Копирај</button>
                  </div>
                )}
                <ul className={styles.events}>
                  {(quote.events || []).slice().reverse().map((ev, i) => (
                    <li key={i}>
                      <span className={styles.evDate}>{fmtDay(ev.at)}</span> {EVENT_LABEL[ev.type] || ev.type}
                      {ev.name && <> — {ev.name}</>}
                      {ev.type === 'question' && ev.note && <p className={styles.respNote}>„{ev.note}"{ev.email && <> · <a href={`mailto:${ev.email}`}>{ev.email}</a></>}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className={styles.cardPlain}>
              <button type="button" className={styles.linkBtn} disabled={!!busy} onClick={duplicate}>Копирај како нова</button>
              <button type="button" className={styles.dangerLink} onClick={remove}>Избриши</button>
            </section>
          </aside>
        </div>
      </div>
    </TerminalShell>
  );
}
