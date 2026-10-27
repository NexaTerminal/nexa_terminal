import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatDock } from '../../contexts/ChatDockContext';
import { getAgent } from '../../config/aiAgents';
import AgentName from './AgentName';
import ChatbotApiService from '../../services/chatbotApi';
import MarketingBotApiService from '../../services/marketingBotApi';
import ProRequestsApiService from '../../services/proRequestsApi';
import { fetchActiveProForConversation, mergeProMessages, toThreadMessage, mentionsAi } from '../../lib/proChat';
import AiInviteLink from './AiInviteLink';
import ProProfileModal from './ProProfileModal';
import MessagingBar from './MessagingBar';
import ProChatWindow from './ProChatWindow';
import { useAuth } from '../../contexts/AuthContext';
import { CURRENT_VERSIONS } from '../../data/featureTerms';
import styles from './AgentChatDock.module.css';

const stripSuggestions = (t) => (t || '').replace(/\[SUGGESTIONS\][\s\S]*?\[\/SUGGESTIONS\]/, '').trim();
// Clean a stored AI message for display in the compact dock (no suggestion chips
// or hand-off markers are rendered here).
const cleanAi = (t) => stripSuggestions((t || '').replace(/\[\[HANDOFF:[a-z]*\]\]/ig, '')).trim();

/**
 * AgentChatDock — the footer dock. The „Разговори" MessagingBar sits in the
 * corner (terminal only); chat windows line up to its left, Facebook-style:
 * AI agents (ChatWindow) and human pro conversations (`pro:<id>` → ProChatWindow).
 * Each window keeps its own state for as long as it stays open.
 */
const FULL_CONVERSATION_PAGES = [
  '/terminal/ai-chat', '/terminal/marketing-ai', '/terminal/requests',
  '/terminal/pro/conversations', '/terminal/pro/requests', '/terminal/admin-user/requests',
];

export default function AgentChatDock() {
  const { windows = [], closeChat, toggleMinimize } = useChatDock();
  const { currentUser } = useAuth();
  const { pathname } = useLocation();
  // Hidden on the full conversation pages — they are the messaging screen and
  // the bar would sit on their composer (LinkedIn hides its bar on /messaging too).
  const showBar = !!currentUser && pathname.startsWith('/terminal')
    && !FULL_CONVERSATION_PAGES.some((p) => pathname.startsWith(p));
  if (!showBar && windows.length === 0) return null;

  return (
    <div className={styles.dockBar}>
      {showBar && <MessagingBar />}
      {windows.map((w) => (w.key.startsWith('pro:') ? (
        <ProChatWindow
          key={w.key}
          requestId={w.key.slice(4)}
          minimized={w.minimized}
          onClose={() => closeChat(w.key)}
          onToggle={() => toggleMinimize(w.key)}
        />
      ) : (
        <ChatWindow
          key={w.key}
          agentKey={w.key}
          minimized={w.minimized}
          seed={w.seed}
          seedId={w.seedId}
          context={w.context}
          onClose={() => closeChat(w.key)}
          onToggle={() => toggleMinimize(w.key)}
        />
      )))}
    </div>
  );
}

function ChatWindow({ agentKey, minimized, seed, seedId, context, onClose, onToggle }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [proNotice, setProNotice] = useState(null);
  const [proBusy, setProBusy] = useState(false);
  // Conversation id the pro invite was already sent for (blocks duplicate invites).
  const [proInvitedConv, setProInvitedConv] = useState(null);
  // Group chat: user invited the AI to answer their NEXT message (one reply only).
  const [aiArmed, setAiArmed] = useState(false);
  // Human-in-the-loop: claimed pro linked to this conversation + their replies.
  const [activeConvId, setActiveConvId] = useState(null);
  const [proRequestId, setProRequestId] = useState(null);
  const [proMsgs, setProMsgs] = useState([]);
  const [proProfile, setProProfile] = useState(null);   // assigned Pro's public profile
  const [userRevealed, setUserRevealed] = useState(false); // did the user reveal identity?
  const [emailMuted, setEmailMuted] = useState(false);     // user's email opt-out for this conversation
  const [showProModal, setShowProModal] = useState(false);
  const endRef = useRef(null);
  const sendRef = useRef(null);
  // Refs so the seed effect + send() always read the latest without stale closures.
  // conversationId isn't rendered, so a ref (not state) is enough.
  const convIdRef = useRef(null);
  const contextRef = useRef(context);
  contextRef.current = context;
  const setConv = (id) => { convIdRef.current = id; setActiveConvId(id); };
  const didInitRef = useRef(false);

  const agent = getAgent(agentKey);
  const isMarketing = agent?.engine === 'marketing';
  const api = isMarketing ? MarketingBotApiService : ChatbotApiService;

  useEffect(() => {
    if (!minimized) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, minimized]);

  // On first open, resume this character's latest conversation so the balloon
  // shows history (same continuity as the full page). Skipped when opened with a
  // seed (a seeded open starts a fresh contextual thread) and for marketing.
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    if (!agent || isMarketing || seedId) return;
    ChatbotApiService.getLatestConversation(agent.key)
      .then((res) => {
        const conv = res?.success ? res.data?.conversation : null;
        if (!conv || !Array.isArray(conv.messages) || conv.messages.length === 0) return;
        setMessages(conv.messages.map((m) => ({
          role: m.type === 'ai' ? 'ai' : 'user',
          content: m.type === 'ai' ? cleanAi(m.content) : m.content,
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
        })));
        setConv(String(conv._id));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll the linked (claimed) pro request so the pro's replies stream into the
  // balloon. Non-marketing only; polls every ~15s while a conversation exists.
  useEffect(() => {
    if (isMarketing || !activeConvId) { setProRequestId(null); setProMsgs([]); setProProfile(null); setUserRevealed(false); return; }
    let cancelled = false;
    const load = async () => {
      const r = await fetchActiveProForConversation(activeConvId);
      if (cancelled) return;
      if (r) { setProRequestId(r.id); setProMsgs(r.proMessages); setProProfile(r.proProfile); setUserRevealed(r.userRevealed); setEmailMuted(r.emailMuted); }
      else { setProRequestId(null); setProMsgs([]); setProProfile(null); setUserRevealed(false); }
    };
    load();
    const iv = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [activeConvId, isMarketing]);

  // Auto-ask the seed message when the window is opened/re-opened with one
  // (e.g. „Прегледај со …" hands an artifact to the agent for review). A fresh
  // seed starts a NEW thread so its focus context attaches cleanly.
  useEffect(() => {
    if (seedId && seed) {
      setMessages([]);
      setConv(null);
      sendRef.current?.(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedId]);

  if (!agent) return null;

  const fullPageHref = isMarketing ? '/terminal/marketing-ai' : `/terminal/ai-chat?agent=${agent.key}`;

  const send = async (text) => {
    const q = (text != null ? text : input).trim();
    if (!q || loading) return;
    setInput('');
    setError(null);
    // Human pro in the loop → the message goes ONLY to the pro's thread. No AI
    // call, so it costs no credits and doesn't count toward the weekly AI quota.
    // Re-check right before asking the AI: a pro may have joined since the last poll.
    let liveProId = isMarketing ? null : proRequestId;
    if (!isMarketing && !liveProId && convIdRef.current) {
      const r = await fetchActiveProForConversation(convIdRef.current);
      if (r) {
        setProRequestId(r.id); setProMsgs(r.proMessages); setProProfile(r.proProfile);
        setUserRevealed(r.userRevealed); setEmailMuted(r.emailMuted);
        liveProId = r.id;
      }
    }
    if (liveProId) {
      // Group chat: the message always goes to the group (pro thread); the AI
      // answers only when the user calls it with @ai / @<name>.
      const callAi = (aiArmed || mentionsAi(q, agent.name)) && convIdRef.current;
      setAiArmed(false); // one invite = one AI reply
      setLoading(true);
      try {
        const res = await ProRequestsApiService.addMessage(liveProId, q);
        if (!(res?.success && res.message)) {
          setInput(q); setError(res?.message || 'Пораката не е испратена. Обидете се повторно.');
          return;
        }
        if (!callAi) { setProMsgs((prev) => [...prev, toThreadMessage(res.message)]); return; }
        // Conversation copy of the user turn (the thread copy is de-duplicated on merge).
        setMessages((prev) => [...prev, { role: 'user', content: q, timestamp: new Date() }]);
        const ai = await api.sendMessage(convIdRef.current, q, agent.key, null, true, true);
        if (ai?.success) setMessages((prev) => [...prev, { role: 'ai', content: stripSuggestions(ai.data.answer), timestamp: new Date() }]);
        else setError(ai?.message || 'AI не одговори. Обидете се повторно.');
      } catch (e) {
        setError(e?.message || 'Пораката не е испратена. Обидете се повторно.');
      } finally {
        setLoading(false);
      }
      return;
    }
    setMessages((prev) => [...prev, { role: 'user', content: q, timestamp: new Date() }]);
    setLoading(true);
    try {
      let convId = convIdRef.current;
      if (!convId) {
        const created = isMarketing
          ? await api.createConversation(q)
          : await api.createConversation(q, agent.key, contextRef.current);
        if (created?.success) { convId = created.data.conversationId; setConv(convId); }
      }
      const res = isMarketing
        ? await api.sendMessage(convId, q)
        : await api.sendMessage(convId, q, agent.key);
      if (res?.success) {
        setMessages((prev) => [...prev, { role: 'ai', content: stripSuggestions(res.data.answer), timestamp: new Date() }]);
      } else {
        setError(res?.message || 'Се случи грешка. Обидете се повторно.');
      }
    } catch (e) {
      setError(e?.message || 'Не можевме да се поврземе. Обидете се повторно.');
    } finally {
      setLoading(false);
    }
  };
  sendRef.current = send;

  // „Покани професионалец" — one click invites any Pro (board broadcast, first to
  // claim joins). Same scope as the full-page chat: ONLY the latest exchange (the
  // user's last question + the AI answer to it) is shared, never earlier turns.
  const inviteSent = !!activeConvId && proInvitedConv === activeConvId;
  const inviteProNow = async () => {
    if (proBusy || inviteSent || proRequestId) return;
    // Wait for the AI's answer to land, so the Pro's summary includes it.
    if (loading) { setError('Почекајте AI да го заврши одговорот, па поканете професионалец.'); return; }
    let qIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) { if (messages[i].role === 'user') { qIdx = i; break; } }
    if (qIdx < 0) { setError('Прво поставете прашање, па поканете професионалец.'); return; }
    const q = messages[qIdx].content.trim();
    const excerpt = messages.slice(qIdx).map((m) => `${m.role === 'user' ? 'Јас' : agent.name}: ${m.content}`).join('\n\n');
    setProBusy(true); setError(null); setProNotice(null);
    try {
      const res = await ProRequestsApiService.create({
        type: 'consult',
        subject: q.slice(0, 120),
        agent: agent.key,
        context: { question: q, conversationId: convIdRef.current, transcriptExcerpt: excerpt },
        consentVersion: CURRENT_VERSIONS.proRequest,
      });
      if (res?.success) {
        setProInvitedConv(convIdRef.current);
        // From now on messages go to the Pro thread; the AI waits to be invited.
        if (res.item?._id) setProRequestId(res.item._id);
        setProNotice('Поканата е испратена до професионалците. Ако некој се приклучи, ќе ве известиме во „Разговори" — тоа засега не е загарантирано. NEXA е само канал за поврзување и не одговара за дадените совети.');
      } else setProNotice(res?.message || 'Грешка при поканата.');
    } catch (e) { setProNotice(e?.message || 'Грешка при поканата.'); }
    finally { setProBusy(false); }
  };

  // User toggles whether the assigned Pro can see their identity. Anonymous by default.
  const toggleReveal = async () => {
    if (!proRequestId || proBusy) return;
    const next = !userRevealed;
    if (next && !window.confirm('Да го откриете вашиот идентитет (име и компанија) на професионалецот?')) return;
    setProBusy(true);
    try {
      const res = await ProRequestsApiService.reveal(proRequestId, next);
      if (res?.success) setUserRevealed(next);
    } catch (_) { /* best-effort */ }
    finally { setProBusy(false); }
  };

  // Per-conversation email opt-out (bell notifications stay on).
  const toggleEmails = async () => {
    if (!proRequestId) return;
    const next = !emailMuted;
    setEmailMuted(next);
    try {
      const res = await ProRequestsApiService.setEmailMuted(proRequestId, next);
      if (!res?.success) setEmailMuted(!next);
    } catch (_) { setEmailMuted(!next); }
  };

  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };

  return (
    <div className={`${styles.dock} ${minimized ? styles.dockMin : ''}`}>
      {/* Header */}
      <button className={styles.header} onClick={onToggle} aria-label="Прошири/собери">
        <span className={styles.hdLeft}>
          {agent.photo
            ? <img src={agent.photo} alt={agent.name} className={styles.hdAvatar} />
            : <span className={styles.hdAvatarFallback}>{agent.icon}</span>}
          {proProfile && (
            <span className={styles.hdAvatarStack} aria-hidden="true">
              {(proProfile.name || 'П').trim().charAt(0).toUpperCase()}
            </span>
          )}
          <span className={styles.hdText}>
            <span className={styles.hdName}>{proProfile ? 'Групен разговор' : <AgentName name={agent.name} />}</span>
            <span className={styles.hdRole}>
              {proProfile ? `${agent.name} · ${proProfile.name || 'Професионалец'} · Вие` : agent.role}
            </span>
          </span>
          {!proProfile && <span className={styles.onlineDot} aria-hidden="true" />}
        </span>
        <span className={styles.hdActions}>
          {!isMarketing && (
            <span role="button" tabIndex={0}
              className={`${styles.iconBtn} ${inviteSent || proProfile ? styles.iconBtnActive : ''}`}
              title={proProfile ? 'Професионалец е во разговорот' : inviteSent ? 'Поканата е испратена' : 'Покани професионалец (еден клик)'}
              aria-label="Покани професионалец"
              onClick={stop(inviteProNow)}
              onKeyDown={(e) => { if (e.key === 'Enter') stop(inviteProNow)(e); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>
            </span>
          )}
          <span role="button" tabIndex={0} className={styles.iconBtn} title="Отвори цела страница"
            onClick={stop(() => { navigate(fullPageHref); onClose(); })}
            onKeyDown={(e) => { if (e.key === 'Enter') stop(() => { navigate(fullPageHref); onClose(); })(e); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M10 14L21 3M21 14v7H3V3h7" /></svg>
          </span>
          <span role="button" tabIndex={0} className={styles.iconBtn} title={minimized ? 'Отвори' : 'Собери'}
            onClick={stop(onToggle)}
            onKeyDown={(e) => { if (e.key === 'Enter') stop(onToggle)(e); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={minimized ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} /></svg>
          </span>
          <span role="button" tabIndex={0} className={styles.iconBtn} title="Затвори"
            onClick={stop(onClose)}
            onKeyDown={(e) => { if (e.key === 'Enter') stop(onClose)(e); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </span>
        </span>
      </button>

      {!minimized && (
        <>
          {proProfile && (
            <div className={styles.proBar}>
              <button type="button" className={styles.proBarName} onClick={() => setShowProModal(true)}>
                🧑‍⚖️ {proProfile.name || 'Професионалец'} <span className={styles.proBarInfo}>ℹ︎</span>
              </button>
              <button type="button" className={styles.proBarReveal} onClick={toggleReveal} disabled={proBusy}>
                {userRevealed ? 'Идентитетот е откриен' : 'Анонимни сте · Откриј идентитет'}
              </button>
              <button type="button" className={styles.proBarReveal} onClick={toggleEmails}
                title="Известувања по е-пошта за секоја нова порака во овој разговор">
                {emailMuted ? '🔕 Е-пошта' : '📧 Е-пошта'}
              </button>
            </div>
          )}
          {showProModal && (
            <ProProfileModal profile={proProfile} onClose={() => setShowProModal(false)} />
          )}
          <div className={styles.body}>
            {messages.length === 0 ? (
              <div className={styles.welcome}>
                {agent.photo && <img src={agent.photo} alt={agent.name} className={styles.welcomeAvatar} />}
                <p className={styles.welcomeText}>Здраво, јас сум {agent.name}. Како да помогнам?</p>
                <div className={styles.starters}>
                  {(agent.starters || []).slice(0, 3).map((s, i) => (
                    <button key={i} className={styles.starterChip} onClick={() => send(s)}>{s}</button>
                  ))}
                </div>
              </div>
            ) : (
              mergeProMessages(messages, proMsgs).map((m, i) => (
                m.type === 'pro' ? (
                  <div key={`pro-${m.messageId}`} className={`${styles.row} ${styles.rowPro}`}>
                    <div className={`${styles.bubble} ${styles.bubblePro}`}>
                      <button type="button" className={styles.proAuthor}
                        onClick={() => proProfile && setShowProModal(true)}>
                        🧑‍⚖️ {m.author}
                      </button>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div key={i} className={`${styles.row} ${m.role === 'user' ? styles.rowUser : styles.rowAi}`}>
                    {m.role === 'ai' && agent.photo && <img src={agent.photo} alt="" className={styles.msgAvatar} />}
                    <div className={`${styles.bubble} ${m.role === 'user' ? styles.bubbleUser : styles.bubbleAi}`}>
                      {m.role === 'ai'
                        ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                        : m.content}
                    </div>
                  </div>
                )
              ))
            )}
            {loading && (
              <div className={`${styles.row} ${styles.rowAi}`}>
                {agent.photo && <img src={agent.photo} alt="" className={styles.msgAvatar} />}
                <div className={`${styles.bubble} ${styles.bubbleAi}`}>
                  <span className={styles.typing}><i /><i /><i /></span>
                </div>
              </div>
            )}
            {error && <div className={styles.error}>{error}</div>}
            <div ref={endRef} />
          </div>

          {proNotice && <div className={styles.proNotice}>🧑‍⚖️ {proNotice}</div>}

          {proRequestId && (
            <AiInviteLink agentName={agent.name} armed={aiArmed} waiting={!proProfile}
              onToggle={() => setAiArmed((v) => !v)} />
          )}

          <form className={styles.composer} onSubmit={(e) => { e.preventDefault(); send(); }}>
            <input
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={proRequestId ? (aiArmed ? `Порака до групата — одговара и ${agent.name}…` : 'Порака до професионалецот…') : `Напиши порака до ${agent.name}…`}
              maxLength={500}
              disabled={loading}
            />
            <button type="submit" className={styles.sendBtn} disabled={loading || !input.trim()} aria-label="Испрати">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            </button>
          </form>
        </>
      )}
    </div>
  );
}
