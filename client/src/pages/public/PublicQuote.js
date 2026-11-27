import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { mediaUrl } from '../../lib/apiBase';
import { money, fmtDay } from '../../lib/quotes';
import styles from './PublicQuote.module.css';

/**
 * Public quote page — nexa.mk/ponuda/:token. The client of a Nexa company
 * reads the quote, saves it as PDF (browser print) and answers with one
 * button. No login. ?preview=1 (the owner's own preview) skips open tracking.
 */
export default function PublicQuote() {
  const { token } = useParams();
  const { search } = useLocation();
  const preview = new URLSearchParams(search).get('preview') === '1';
  const [q, setQ] = useState(null);
  const [state, setState] = useState('loading');
  const [mode, setMode] = useState(null); // accept | decline | question
  const [form, setForm] = useState({ name: '', email: '', note: '', website: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  useEffect(() => {
    let cancelled = false;
    axios.get(`/api/public/quote/${encodeURIComponent(token)}`)
      .then((r) => { if (!cancelled) { setQ(r.data.quote); setState('ok'); } })
      .catch(() => { if (!cancelled) setState('missing'); });
    if (!preview) {
      const key = `nexa_quote_view_${token}`;
      let seen = false;
      try { seen = sessionStorage.getItem(key) === '1'; sessionStorage.setItem(key, '1'); } catch (_) { /* private mode */ }
      if (!seen) axios.post(`/api/public/quote/${encodeURIComponent(token)}/view`).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [token, preview]);

  const submit = async (e) => {
    e.preventDefault();
    if (preview) { setError('Ова е Ваш преглед — клиентот одговара на истиот линк.'); return; }
    setBusy(true); setError('');
    try {
      const r = await axios.post(`/api/public/quote/${encodeURIComponent(token)}/respond`, { type: mode, ...form });
      if (r.data.quote) setQ(r.data.quote);
      setDone(mode === 'accept' ? 'Ви благодариме! Понудата е прифатена — фирмата е известена и ќе Ве контактира.'
        : mode === 'decline' ? 'Ви благодариме за одговорот. Фирмата е известена.'
        : 'Прашањето е испратено. Фирмата ќе Ви одговори.');
      setMode(null);
      setForm({ name: form.name, email: form.email, note: '', website: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Не успеавме да го испратиме одговорот. Обидете се повторно.');
    } finally { setBusy(false); }
  };

  if (state === 'loading') return <div className={styles.wrap}><div className={styles.state}>Се вчитува…</div></div>;
  if (state === 'missing') {
    return (
      <div className={styles.wrap}>
        <Helmet><title>Понудата не е достапна</title><meta name="robots" content="noindex, nofollow" /></Helmet>
        <div className={styles.state}>
          <h1>Понудата не е достапна</h1>
          <p>Линкот е неточен или понудата е повлечена. Контактирајте ја фирмата што Ви ја испрати.</p>
        </div>
      </div>
    );
  }

  const is = q.issuer || {};
  const cur = q.currency;
  const open = q.status === 'sent' || q.status === 'viewed';
  const answered = q.status === 'accepted' || q.status === 'declined';

  return (
    <div className={styles.wrap}>
      <Helmet>
        <title>{`Понуда ${q.number}${is.name ? ` — ${is.name}` : ''}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {preview && <div className={styles.previewBar}>Преглед — вака клиентот ја гледа понудата. Отворањата од прегледот не се бројат.</div>}

      <article className={styles.paper}>
        <header className={styles.head}>
          <div className={styles.issuer}>
            {is.logoUrl && <img src={mediaUrl(is.logoUrl)} alt="" className={styles.logo} />}
            <div>
              <div className={styles.issuerName}>{is.name}</div>
              <div className={styles.issuerMeta}>
                {[is.address, is.city].filter(Boolean).join(', ')}
                {is.taxNumber && <> · ЕДБ {is.taxNumber}</>}
              </div>
              <div className={styles.issuerMeta}>{[is.email, is.phone, is.website].filter(Boolean).join(' · ')}</div>
            </div>
          </div>
          <div className={styles.docMeta}>
            <div className={styles.docType}>Понуда</div>
            <div className={styles.docNo}>{q.number}</div>
            <div className={styles.issuerMeta}>Датум: {fmtDay(q.sentAt)}</div>
            {q.validUntil && <div className={styles.issuerMeta}>Важи до: <strong>{fmtDay(q.validUntil)}</strong></div>}
          </div>
        </header>

        <section className={styles.client}>
          <div className={styles.label}>За</div>
          <div className={styles.clientName}>{q.client?.name}</div>
          <div className={styles.issuerMeta}>
            {[q.client?.person, q.client?.address, q.client?.taxNumber && `ЕДБ ${q.client.taxNumber}`].filter(Boolean).join(' · ')}
          </div>
        </section>

        {q.title && <h1 className={styles.title}>{q.title}</h1>}
        {q.intro && <p className={styles.intro}>{q.intro}</p>}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Опис</th><th className={styles.num}>Кол.</th><th className={styles.num}>Цена</th><th className={styles.num}>ДДВ</th><th className={styles.num}>Износ</th></tr>
            </thead>
            <tbody>
              {q.items.map((it, i) => (
                <tr key={i}>
                  <td><strong>{it.name}</strong>{it.description && <div className={styles.desc}>{it.description}</div>}</td>
                  <td className={styles.num}>{it.qty} {it.unit}</td>
                  <td className={styles.num}>{money(it.price, cur)}</td>
                  <td className={styles.num}>{it.vat}%</td>
                  <td className={styles.num}>{money(it.qty * it.price, cur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className={styles.totals}>
          {q.totals.discount > 0 && <>
            <dt>Износ</dt><dd>{money(q.totals.subtotal, cur)}</dd>
            <dt>Попуст {q.discountPct}%</dt><dd>− {money(q.totals.discount, cur)}</dd>
          </>}
          <dt>Вкупно без ДДВ</dt><dd>{money(q.totals.net, cur)}</dd>
          {q.totals.vatBreakdown.filter((v) => v.rate > 0).map((v) => (
            <div key={v.rate} className={styles.totRow}><dt>ДДВ {v.rate}%</dt><dd>{money(v.amount, cur)}</dd></div>
          ))}
          <dt className={styles.grand}>Вкупно за плаќање</dt><dd className={styles.grand}>{money(q.totals.total, cur)}</dd>
        </dl>

        {(q.paymentTerms || q.deliveryTerms || q.note) && (
          <section className={styles.terms}>
            {q.paymentTerms && <p><span className={styles.label}>Плаќање</span>{q.paymentTerms}</p>}
            {q.deliveryTerms && <p><span className={styles.label}>Испорака</span>{q.deliveryTerms}</p>}
            {q.note && <p><span className={styles.label}>Забелешка</span>{q.note}</p>}
          </section>
        )}
        <p className={styles.small}>Понудата не е фактура. Цените се изразени без ДДВ, освен каде што е наведено „со ДДВ".</p>

        {/* ---- Answer ---- */}
        <section className={styles.answer}>
          {done && <div className={styles.done}>{done}</div>}
          {q.status === 'accepted' && !done && <div className={styles.done}>✅ Понудата е прифатена{q.response?.name ? ` (${q.response.name}, ${fmtDay(q.response.at)})` : ''}.</div>}
          {q.status === 'declined' && !done && <div className={styles.declined}>Понудата е одбиена{q.response?.at ? ` (${fmtDay(q.response.at)})` : ''}.</div>}
          {q.status === 'expired' && <div className={styles.declined}>Рокот на важење на понудата истече на {fmtDay(q.validUntil)}. Побарајте ажурирана понуда од фирмата.</div>}

          {!mode && (
            <div className={styles.buttons}>
              {open && <button type="button" className={styles.accept} onClick={() => setMode('accept')}>Прифаќам ја понудата</button>}
              <button type="button" className={styles.ghost} onClick={() => setMode('question')}>Имам прашање</button>
              {open && <button type="button" className={styles.ghost} onClick={() => setMode('decline')}>Одбивам</button>}
              <button type="button" className={styles.ghost} onClick={() => window.print()}>Зачувај PDF</button>
            </div>
          )}

          {mode && (
            <form className={styles.form} onSubmit={submit}>
              <h2>{mode === 'accept' ? 'Прифаќање на понудата' : mode === 'decline' ? 'Одбивање на понудата' : 'Прашање до фирмата'}</h2>
              {mode === 'accept' && <p className={styles.small}>Со прифаќањето ја известувате фирмата дека ја прифаќате понудата {q.number} во износ од {money(q.totals.total, cur)}. Фирмата ќе Ве контактира за следните чекори.</p>}
              <label><span>Име и презиме{mode !== 'question' && q.client?.name ? ` (за ${q.client.name})` : ''} *</span>
                <input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label><span>Е-пошта {mode === 'question' ? '(за да Ви одговорат)' : '(опционално)'}</span>
                <input type="email" required={mode === 'question'} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label><span>{mode === 'question' ? 'Прашање *' : mode === 'decline' ? 'Причина (опционално — многу помага)' : 'Забелешка (опционално)'}</span>
                <textarea rows={3} required={mode === 'question'} minLength={mode === 'question' ? 5 : undefined} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
              <input className={styles.hp} tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} aria-hidden="true" />
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.buttons}>
                <button type="submit" className={mode === 'decline' ? styles.ghostStrong : styles.accept} disabled={busy}>
                  {busy ? 'Се испраќа…' : mode === 'accept' ? 'Потврди прифаќање' : mode === 'decline' ? 'Потврди одбивање' : 'Испрати прашање'}
                </button>
                <button type="button" className={styles.ghost} onClick={() => { setMode(null); setError(''); }}>Откажи</button>
              </div>
            </form>
          )}
          {answered && !mode && <p className={styles.small}>За промени, контактирајте ја фирмата: {[is.email, is.phone].filter(Boolean).join(' · ')}</p>}
        </section>
      </article>

      <footer className={styles.footer}>
        Понуда направена со <a href="https://nexa.mk/?utm_source=quote&utm_medium=footer">Nexa</a> ·{' '}
        <a href="https://nexa.mk/login?utm_source=quote&utm_medium=footer">Направете бесплатна понуда за Вашата фирма</a>
      </footer>
    </div>
  );
}
