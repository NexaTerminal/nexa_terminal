import React, { useEffect, useRef, useState } from 'react';
import ProRequestsApiService from '../../services/proRequestsApi';
import ChatbotApiService from '../../services/chatbotApi';
import { getAgent } from '../../config/aiAgents';
import { mentionsAi } from '../../lib/proChat';
import AiInviteLink from '../chatbot/AiInviteLink';
import AiTranscript from './AiTranscript';
import styles from './ProRequestThread.module.css';

/**
 * ProRequestThread — the shared conversation for an "Ask a Pro" request.
 * Renders messages (incl. structured quotes), a composer, and — for the
 * assigned Pro — a „Понуди цена" action. `role` is the viewer's relationship
 * to the request ('user' | 'pro' | 'admin'), used for alignment and actions.
 * `compact` = the messaging-dock window: short disclaimer, no email/close
 * toolbar (those stay on the full page).
 * Group chat: the requester can call the AI character with @ai; its answer is
 * mirrored into this thread server-side (authorRole 'ai').
 */
export default function ProRequestThread({ request, role, onUpdated, compact = false }) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [showQuote, setShowQuote] = useState(false);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('МКД');
  const [quoteNote, setQuoteNote] = useState('');

  const active = request.status === 'active';
  const canQuote = role === 'pro' && active;
  const aiAgent = request.agent ? getAgent(request.agent) : null;
  const convId = request.context?.conversationId;
  const canCallAi = role === 'user' && active && !!aiAgent && !!convId;
  const [aiThinking, setAiThinking] = useState(false);
  // User invited the AI to answer their NEXT message (one reply only).
  const [aiArmed, setAiArmed] = useState(false);

  async function send() {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true); setError(null);
    try {
      const res = await ProRequestsApiService.addMessage(request._id, text);
      if (!res.success) { setError(res.message || 'Грешка при испраќање.'); return; }
      setBody(''); onUpdated?.(res.item);
      const invited = canCallAi && (aiArmed || mentionsAi(text, aiAgent.name));
      setAiArmed(false); // one invite = one AI reply
      if (invited) {
        // The server mirrors the AI answer into this thread; re-fetch to show it.
        setAiThinking(true);
        const ai = await ChatbotApiService.sendMessage(convId, text, request.agent, null, true, true);
        if (!ai?.success) setError(ai?.message || 'AI не одговори. Обидете се повторно.');
        const fresh = await ProRequestsApiService.get(request._id);
        if (fresh?.success) onUpdated?.(fresh.item);
      }
    } catch (e) { setError(e.message || 'Грешка при испраќање.'); }
    finally { setSending(false); setAiThinking(false); }
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

  // This side's step-email opt-out for the conversation (bell stays on).
  const mySide = role === 'pro' ? 'pro' : 'user';
  const emailMuted = !!request.emailMuted?.[mySide];
  async function toggleEmails() {
    if (sending || role === 'admin') return;
    setSending(true); setError(null);
    try {
      const res = await ProRequestsApiService.setEmailMuted(request._id, !emailMuted);
      if (res.success) onUpdated?.(res.item);
      else setError(res.message || 'Грешка.');
    } catch (e) { setError(e.message || 'Грешка.'); }
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

  // Dock window: keep the newest message in view as the thread grows.
  const messagesRef = useRef(null);
  useEffect(() => {
    const el = messagesRef.current;
    if (compact && el) el.scrollTop = el.scrollHeight;
  }, [compact, messages.length]);

  return (
    <div className={`${styles.thread} ${compact ? styles.compact : ''}`}>
      <div className={styles.messages} ref={messagesRef}>
        {/* The whole history: the original AI conversation (incl. the AI answer)… */}
        <AiTranscript
          text={request.context?.transcriptExcerpt}
          summary={request.context?.aiSummary}
          question={request.context?.question}
        />
        {/* …then the human↔human talk. */}
        {request.assignedProName && (
          <div className={styles.systemLine}>👋 {request.assignedProName} се приклучи во разговорот</div>
        )}
        {messages.length === 0 && (
          <p className={styles.empty}>Сè уште нема пораки меѓу вас. Напишете прва порака за да продолжите.</p>
        )}
        {messages.map((m, i) => {
          // Messenger-style runs: consecutive messages from the same author within
          // 5 minutes group together — name once on top, avatar + time on the last.
          const prev = messages[i - 1];
          const next = messages[i + 1];
          const sameRun = (a, b) => a && b && a.authorRole === b.authorRole
            && Math.abs(new Date(a.createdAt) - new Date(b.createdAt)) < 5 * 60 * 1000;
          const firstOfRun = !sameRun(prev, m);
          const lastOfRun = !sameRun(m, next);
          const mine = m.authorRole === mineRole;
          const isAi = m.authorRole === 'ai';
          const isPro = m.authorRole === 'pro';
          const name = isAi ? `${m.authorName || 'AI'} · AI` : (m.authorName || roleLabel(m.authorRole));
          const bubbleCls = mine ? styles.bubbleMine : isAi ? styles.bubbleAi : isPro ? styles.bubblePro : styles.bubbleTheirs;
          return (
            <div key={m._id} className={`${styles.row} ${mine ? styles.rowMine : styles.rowTheirs} ${lastOfRun ? styles.rowLast : ''}`}>
              {!mine && (lastOfRun ? (
                isAi && aiAgent?.photo
                  ? <img src={aiAgent.photo} alt="" className={styles.avatar} />
                  : <span className={`${styles.avatar} ${isPro ? styles.avatarPro : ''}`} aria-hidden>{name.trim().charAt(0).toUpperCase()}</span>
              ) : <span className={styles.avatarSpacer} aria-hidden />)}
              <div className={styles.bubbleCol}>
                {!mine && firstOfRun && <span className={styles.author}>{isAi ? `🤖 ${name}` : name}</span>}
                <div className={`${styles.bubble} ${bubbleCls}`} title={fmtTime(m.createdAt)}>
                  {m.kind === 'quote' ? (
                    <div className={styles.quote}>
                      <span className={styles.quoteBadge}>Понуда за цена</span>
                      <strong className={styles.quoteAmount}>{m.amount} {m.currency}</strong>
                      {m.body && <p className={styles.quoteNote}>{m.body}</p>}
                    </div>
                  ) : m.body}
                </div>
                {lastOfRun && <span className={styles.time}>{fmtTime(m.createdAt)}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {aiThinking && <div className={styles.systemLine}>🤖 {aiAgent?.name || 'AI'} пишува…</div>}
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

          <p className={styles.disclaimer}>
            Со разговорот се согласувате со <a href="/terms-conditions" target="_blank" rel="noopener noreferrer">општите услови</a>.
            {!compact && <>{' '}Соработката и надоместокот се договараат директно меѓу вас и соговорникот. AI одговорите се информативни; советот е професионална одговорност на професионалецот.</>}
          </p>

          {canCallAi && (
            <AiInviteLink agentName={aiAgent.name} armed={aiArmed} onToggle={() => setAiArmed((v) => !v)} />
          )}

          <div className={styles.composer}>
            <textarea
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                e.target.style.height = 'auto'; // grow with the text, like the AI chat
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={aiArmed ? `Порака до групата — одговара и ${aiAgent?.name}…` : 'Напиши порака…'}
              className={styles.input}
              rows={1}
              disabled={sending}
            />
            <button type="button" className={styles.sendBtn} onClick={send}
              disabled={sending || !body.trim()} aria-label="Испрати" title="Испрати">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            </button>
          </div>

          <div className={styles.toolbar}>
            {canQuote && !showQuote && (
              <button className={styles.linkBtn} onClick={() => setShowQuote(true)}>💰 Понуди цена</button>
            )}
            {role !== 'admin' && !compact && (
              <button className={styles.linkBtn} onClick={toggleEmails} disabled={sending}
                title="Известувања по е-пошта за секоја нова порака во овој разговор">
                {emailMuted ? '🔕 Е-пошта: исклучена' : '📧 Е-пошта: вклучена'}
              </button>
            )}
            {!compact && (
              <button className={styles.linkBtn} onClick={closeRequest} disabled={sending}>Затвори барање</button>
            )}
          </div>
        </>
      ) : (
        <div className={styles.closedNote}>
          {request.status === 'closed' ? 'Разговорот е завршен.'
            : request.status === 'rejected' ? 'Барањето е отстрането.'
            : 'Се бара професионалец да се приклучи…'}
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
  try {
    const date = new Date(d);
    const time = date.toLocaleTimeString('mk-MK', { hour: '2-digit', minute: '2-digit' });
    return date.toDateString() === new Date().toDateString()
      ? time
      : `${date.toLocaleDateString('mk-MK', { day: '2-digit', month: '2-digit' })} ${time}`;
  } catch { return ''; }
}
