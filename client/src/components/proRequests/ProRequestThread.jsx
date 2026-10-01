import React, { useState } from 'react';
import ProRequestsApiService from '../../services/proRequestsApi';
import styles from './ProRequestThread.module.css';

/**
 * ProRequestThread — the shared conversation for an "Ask a Pro" request.
 * Renders messages (incl. structured quotes), a composer, and — for the
 * assigned Pro — a „Понуди цена" action. `role` is the viewer's relationship
 * to the request ('user' | 'pro' | 'admin'), used for alignment and actions.
 */
export default function ProRequestThread({ request, role, onUpdated }) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [showQuote, setShowQuote] = useState(false);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('МКД');
  const [quoteNote, setQuoteNote] = useState('');

  const active = request.status === 'active';
  const canQuote = role === 'pro' && active;

  async function send() {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true); setError(null);
    try {
      const res = await ProRequestsApiService.addMessage(request._id, text);
      if (res.success) { setBody(''); onUpdated?.(res.item); }
      else setError(res.message || 'Грешка при испраќање.');
    } catch (e) { setError(e.message || 'Грешка при испраќање.'); }
    finally { setSending(false); }
  }

  async function sendQuote() {
    const amt = Number(amount);
    if (!amt || amt <= 0 || sending) { setError('Внесете валиден износ.'); return; }
    setSending(true); setError(null);
    try {
      const res = await ProRequestsApiService.addQuote(request._id, { amount: amt, currency, body: quoteNote.trim() });
      if (res.success) {
        setAmount(''); setQuoteNote(''); setShowQuote(false);
        onUpdated?.(res.item);
      } else setError(res.message || 'Грешка при испраќање понуда.');
    } catch (e) { setError(e.message || 'Грешка при испраќање понуда.'); }
    finally { setSending(false); }
  }

  async function closeRequest() {
    if (sending) return;
    setSending(true); setError(null);
    try {
      const res = await ProRequestsApiService.close(request._id);
      if (res.success) onUpdated?.(res.item);
      else setError(res.message || 'Грешка.');
    } catch (e) { setError(e.message || 'Грешка.'); }
    finally { setSending(false); }
  }

  const mineRole = role; // the author role that is "me" for alignment
  const messages = request.messages || [];

  return (
    <div className={styles.thread}>
      <div className={styles.messages}>
        {messages.length === 0 && (
          <p className={styles.empty}>Сè уште нема пораки. Започнете го разговорот.</p>
        )}
        {messages.map((m) => {
          const mine = m.authorRole === mineRole;
          return (
            <div key={m._id} className={`${styles.msg} ${mine ? styles.mine : styles.theirs}`}>
              <div className={styles.msgMeta}>
                <span className={styles.author}>{m.authorName || roleLabel(m.authorRole)}</span>
                <span className={styles.time}>{fmtTime(m.createdAt)}</span>
              </div>
              {m.kind === 'quote' ? (
                <div className={styles.quote}>
                  <span className={styles.quoteBadge}>Понуда за цена</span>
                  <strong className={styles.quoteAmount}>{m.amount} {m.currency}</strong>
                  {m.body && <p className={styles.quoteNote}>{m.body}</p>}
                </div>
              ) : (
                <div className={styles.msgBody}>{m.body}</div>
              )}
            </div>
          );
        })}
      </div>

      {error && <div className={styles.error}>⚠️ {error}</div>}

      {active ? (
        <>
          {showQuote && canQuote && (
            <div className={styles.quoteForm}>
              <div className={styles.quoteRow}>
                <input
                  type="number" min="0" placeholder="Износ" value={amount}
                  onChange={(e) => setAmount(e.target.value)} className={styles.amountInput}
                />
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={styles.currencySelect}>
                  <option value="МКД">МКД</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <textarea
                placeholder="Опис на услугата (опционално)" value={quoteNote}
                onChange={(e) => setQuoteNote(e.target.value)} className={styles.quoteNoteInput} rows={2}
              />
              <div className={styles.quoteActions}>
                <button className={styles.secondaryBtn} onClick={() => setShowQuote(false)} disabled={sending}>Откажи</button>
                <button className={styles.primaryBtn} onClick={sendQuote} disabled={sending}>Испрати понуда</button>
              </div>
            </div>
          )}

          <div className={styles.composer}>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Напиши порака…"
              className={styles.input}
              rows={2}
              disabled={sending}
            />
            <button className={styles.primaryBtn} onClick={send} disabled={sending || !body.trim()}>Испрати</button>
          </div>

          <div className={styles.toolbar}>
            {canQuote && !showQuote && (
              <button className={styles.linkBtn} onClick={() => setShowQuote(true)}>💰 Понуди цена</button>
            )}
            <button className={styles.linkBtn} onClick={closeRequest} disabled={sending}>Затвори барање</button>
          </div>
        </>
      ) : (
        <div className={styles.closedNote}>
          {request.status === 'closed' ? 'Барањето е затворено.'
            : request.status === 'rejected' ? 'Барањето е одбиено.'
            : 'Барањето чека одобрување.'}
        </div>
      )}
    </div>
  );
}

function roleLabel(r) {
  return r === 'user' ? 'Клиент' : r === 'pro' ? 'Професионалец' : r === 'admin' ? 'Админ' : r;
}
function fmtTime(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleString('mk-MK', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}
