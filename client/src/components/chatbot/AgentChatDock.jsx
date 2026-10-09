import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatDock } from '../../contexts/ChatDockContext';
import { getAgent } from '../../config/aiAgents';
import ChatbotApiService from '../../services/chatbotApi';
import MarketingBotApiService from '../../services/marketingBotApi';
import styles from './AgentChatDock.module.css';

const stripSuggestions = (t) => (t || '').replace(/\[SUGGESTIONS\][\s\S]*?\[\/SUGGESTIONS\]/, '').trim();
// Clean a stored AI message for display in the compact dock (no suggestion chips
// or hand-off markers are rendered here).
const cleanAi = (t) => stripSuggestions((t || '').replace(/\[\[HANDOFF:[a-z]*\]\]/ig, '')).trim();

/**
 * AgentChatDock — the footer dock. Renders one ChatWindow per open agent,
 * Facebook-style, lined up from the right edge. Each window keeps its own
 * conversation state for as long as it stays open.
 */
export default function AgentChatDock() {
  const { windows = [], closeChat, toggleMinimize } = useChatDock();
  if (windows.length === 0) return null;

  return (
    <div className={styles.dockBar}>
      {windows.map((w) => (
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
      ))}
    </div>
  );
}

function ChatWindow({ agentKey, minimized, seed, seedId, context, onClose, onToggle }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);
  const sendRef = useRef(null);
  // Refs so the seed effect + send() always read the latest without stale closures.
  // conversationId isn't rendered, so a ref (not state) is enough.
  const convIdRef = useRef(null);
  const contextRef = useRef(context);
  contextRef.current = context;
  const setConv = (id) => { convIdRef.current = id; };
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
        })));
        setConv(String(conv._id));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
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
        setMessages((prev) => [...prev, { role: 'ai', content: stripSuggestions(res.data.answer) }]);
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

  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };

  return (
    <div className={`${styles.dock} ${minimized ? styles.dockMin : ''}`}>
      {/* Header */}
      <button className={styles.header} onClick={onToggle} aria-label="Прошири/собери">
        <span className={styles.hdLeft}>
          {agent.photo
            ? <img src={agent.photo} alt={agent.name} className={styles.hdAvatar} />
            : <span className={styles.hdAvatarFallback}>{agent.icon}</span>}
          <span className={styles.hdText}>
            <span className={styles.hdName}>{agent.name}</span>
            <span className={styles.hdRole}>{agent.role}</span>
          </span>
          <span className={styles.onlineDot} aria-hidden="true" />
        </span>
        <span className={styles.hdActions}>
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
              messages.map((m, i) => (
                <div key={i} className={`${styles.row} ${m.role === 'user' ? styles.rowUser : styles.rowAi}`}>
                  {m.role === 'ai' && agent.photo && <img src={agent.photo} alt="" className={styles.msgAvatar} />}
                  <div className={`${styles.bubble} ${m.role === 'user' ? styles.bubbleUser : styles.bubbleAi}`}>
                    {m.role === 'ai'
                      ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      : m.content}
                  </div>
                </div>
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

          <form className={styles.composer} onSubmit={(e) => { e.preventDefault(); send(); }}>
            <input
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Напиши порака до ${agent.name}…`}
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
