import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useCredit } from '../../contexts/CreditContext';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import ConversationSidebar from '../../components/chatbot/ConversationSidebar';
import PersonaControl from '../../components/chatbot/PersonaControl';
import MemoryControl from '../../components/chatbot/MemoryControl';
import AgentRoster from '../../components/chatbot/AgentRoster';
import ContractAnalysisPanel from '../../components/contractAnalysis/ContractAnalysisPanel';
import { DEFAULT_AGENT_KEY, getAgent } from '../../config/aiAgents';
import AgentName from '../../components/chatbot/AgentName';
import ChatbotApiService from '../../services/chatbotApi';
import ProRequestsApiService from '../../services/proRequestsApi';
import { fetchActiveProForConversation, mergeProMessages, toThreadMessage, mentionsAi } from '../../lib/proChat';
import AiInviteLink from '../../components/chatbot/AiInviteLink';
import ProProfileModal from '../../components/chatbot/ProProfileModal';
import CitationChips from '../../components/chatbot/CitationChips';
import InsufficientCreditsModal from '../../components/common/InsufficientCreditsModal';
import FeatureTermsModal from '../../components/terminal/FeatureTermsModal';
import useCreditHandler from '../../hooks/useCreditHandler';
import useTermsGate from '../../hooks/useTermsGate';
import { CURRENT_VERSIONS } from '../../data/featureTerms';
import styles from '../../styles/terminal/AIChat.module.css';

// Teammate hand-off marker emitted by the agent (see server/chatbot/agentProfiles.js).
// We parse it at render time so it works for streamed, fallback and loaded messages
// alike: the key drives the „Префрли се на <Име> →" chip; the marker is stripped
// from the displayed text (incl. any trailing partial fragment mid-stream).
const HANDOFF_RE = /\[\[HANDOFF:(legal|corporate|hr|insurance|accounting|marketing)\]\]/i;
// AI-suggested human handoff: [[ASK_PRO: short reason why a human helps]] on the
// final line. The captured reason is shown in the inline "invite a pro" card.
const ASK_PRO_RE = /\[\[ASK_PRO:\s*([^\]]*?)\]\]/i;
function splitMarkers(text = '') {
  const hm = text.match(HANDOFF_RE);
  const handoff = hm ? hm[1].toLowerCase() : null;
  const am = text.match(ASK_PRO_RE);
  const askPro = am ? (am[1] || '').trim() : null;
  const clean = text
    .replace(HANDOFF_RE, '')
    .replace(ASK_PRO_RE, '')
    // strip trailing partial markers mid-stream so they never flash on screen
    .replace(/\[\[HANDOFF:?[a-z]*\]?\]?\s*$/i, '')
    .replace(/\[\[ASK_PRO:?[^\]]*\]?\]?\s*$/i, '')
    .trim();
  return { clean, handoff, askPro };
}

/**
 * AIChat Component
 *
 * AI-powered legal document chatbot interface
 * - Ask questions about legal documents in Macedonian
 * - Get answers with source citations
 * - Weekly limit of 4 questions per user
 */
const AIChat = () => {
  // const { user } = useAuth(); // Not needed for this component
  const { refreshCredits } = useCredit();
  const { handleCreditOperation, showInsufficientModal, modalConfig, closeModal } = useCreditHandler();
  const navigate = useNavigate();

  // Active AI Team agent (legal RAG engine). Marketing agent lives on its own page.
  const [agent, setAgent] = useState(DEFAULT_AGENT_KEY);
  const activeAgent = getAgent(agent);
  // When the user is routed here from a teammate, remember who sent them so the
  // receiving agent opens with a warm acknowledgment (sent as `from` on next ask).
  const [handoffFrom, setHandoffFrom] = useState(null);
  // Contract-review panel (corporate agent only).
  const [showContract, setShowContract] = useState(false);
  // Ask-a-Pro handoff
  const { termsModal } = useTermsGate();
  const [proNotice, setProNotice] = useState(null);
  // Per-message state for the inline "invite a pro" card: index -> 'invited' | 'dismissed'.
  const [proCardState, setProCardState] = useState({});

  // State management
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [limits, setLimits] = useState({
    remaining: 4,
    total: 4,
    resetDate: null
  });

  // Conversation history state
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Per-character relationship note — powers the "welcome back" greeting.
  const [agentMemoryNote, setAgentMemoryNote] = useState('');

  // Human-in-the-loop: a claimed pro linked to THIS conversation. When present,
  // the pro's replies are merged into the timeline, the user's new messages are
  // mirrored to the pro's thread, and the AI defers to the human.
  const [proRequestId, setProRequestId] = useState(null);
  const [assignedProName, setAssignedProName] = useState(null);
  const [proMessages, setProMessages] = useState([]);
  const [proProfile, setProProfile] = useState(null);
  // Group chat: user invited the AI to answer their NEXT message (one reply only).
  const [aiArmed, setAiArmed] = useState(false);
  const [userRevealed, setUserRevealed] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [revealBusy, setRevealBusy] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Fetch user's remaining question limits on component mount
  useEffect(() => {
    fetchLimits();
  }, []);

  // Handoff: prefill the question from ?q= (e.g. "Ask the AI" from an LHC finding)
  // and optionally preselect an agent via ?agent= (legal RAG agents only).
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      const a = params.get('agent');
      if (a) {
        const picked = getAgent(a);
        if (picked && picked.engine === 'legal') {
          setAgent(picked.key);
          // ?review=1 from the Team page opens the contract panel for НОВА.
          if (params.get('review') && picked.hasContractReview) setShowContract(true);
        }
      }
      if (q) {
        setQuestion(q);
        textareaRef.current?.focus();
      }
    } catch (_) { /* no-op */ }
  }, []);

  // Continue where you left off: on first load, resume the active character's most
  // recent conversation. Skipped when ?q= is present (the user arrived to ask a
  // specific new question — e.g. from an LHC finding) so we don't bury it.
  const didBootstrapRef = useRef(false);
  useEffect(() => {
    if (didBootstrapRef.current) return;
    didBootstrapRef.current = true;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('q')) return; // fresh thread for the prefilled question
      const a = params.get('agent');
      const picked = a ? getAgent(a) : getAgent(DEFAULT_AGENT_KEY);
      const resumeKey = picked && picked.engine === 'legal' ? picked.key : DEFAULT_AGENT_KEY;

      ChatbotApiService.getLatestConversation(resumeKey)
        .then((res) => {
          const conv = res?.success ? res.data?.conversation : null;
          if (!conv || !Array.isArray(conv.messages) || conv.messages.length === 0) return;
          setAgent(resumeKey);
          setMessages(conv.messages.map((msg) => ({
            type: msg.type,
            content: msg.content,
            sources: msg.sources || [],
            citations: msg.citations || [],
            unverifiedCitations: msg.unverifiedCitations || [],
            timestamp: new Date(msg.timestamp),
            messageId: msg.messageId || null,
            feedback: msg.feedback || null,
          })));
          setCurrentConversationId(String(conv._id));
        })
        .catch(() => { /* no prior thread → fresh slate */ });
    } catch (_) { /* no-op */ }
  }, []);

  // Fetch the active character's relationship note (for the "welcome back"
  // greeting). Refetches on character switch; honors the global memory opt-out.
  useEffect(() => {
    let cancelled = false;
    ChatbotApiService.getAgentMemory(agent)
      .then((r) => { if (!cancelled) setAgentMemoryNote(r?.success && r.data?.hasMemory ? r.data.note : ''); })
      .catch(() => { if (!cancelled) setAgentMemoryNote(''); });
    return () => { cancelled = true; };
  }, [agent]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll the linked (claimed) pro request for this conversation so the pro's
  // replies stream into the chat. Polls every ~15s + on window focus; cleared
  // when the conversation changes or the component unmounts.
  useEffect(() => {
    if (!currentConversationId) {
      setProRequestId(null); setAssignedProName(null); setProMessages([]); setProProfile(null); setUserRevealed(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const r = await fetchActiveProForConversation(currentConversationId);
      if (cancelled) return;
      if (r) { setProRequestId(r.id); setAssignedProName(r.assignedProName); setProMessages(r.proMessages); setProProfile(r.proProfile); setUserRevealed(r.userRevealed); setEmailMuted(r.emailMuted); }
      else { setProRequestId(null); setAssignedProName(null); setProMessages([]); setProProfile(null); setUserRevealed(false); }
    };
    load();
    const iv = setInterval(load, 15000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => { cancelled = true; clearInterval(iv); window.removeEventListener('focus', onFocus); };
  }, [currentConversationId]);

  // Per-conversation email opt-out (bell notifications stay on).
  const [emailMuted, setEmailMuted] = useState(false);
  const toggleEmails = async () => {
    if (!proRequestId) return;
    const next = !emailMuted;
    setEmailMuted(next);
    try {
      const res = await ProRequestsApiService.setEmailMuted(proRequestId, next);
      if (!res?.success) setEmailMuted(!next);
    } catch (_) { setEmailMuted(!next); }
  };

  // User toggles whether the assigned Pro can see their identity. Anonymous by default.
  const toggleReveal = async () => {
    if (!proRequestId || revealBusy) return;
    const next = !userRevealed;
    if (next && !window.confirm('Да го откриете вашиот идентитет (име и компанија) на професионалецот?')) return;
    setRevealBusy(true);
    try {
      const res = await ProRequestsApiService.reveal(proRequestId, next);
      if (res?.success) setUserRevealed(next);
    } catch (_) { /* best-effort */ }
    finally { setRevealBusy(false); }
  };

  /**
   * Fetch user's weekly question limits
   */
  const fetchLimits = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.warn('No auth token found');
        return;
      }

      const data = await ChatbotApiService.getLimits();

      if (data.success) {
        setLimits({
          remaining: data.data.remaining,
          total: data.data.total,
          resetDate: data.data.resetDate
        });
      } else {
        // Silently fail - keep default limits
        console.warn('Failed to fetch limits:', data.message);
      }
    } catch (err) {
      // Silently fail - keep default limits
      console.error('Error fetching limits:', err);
    }
  };

  /**
   * Handle starting a new conversation
   */
  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setError(null);
  };

  /**
   * Teammate hand-off: user clicked „Префрли се на <колега>". Switch the active
   * agent, start a fresh thread, carry over the last question, and remember who
   * sent them so the receiving agent greets warmly (passed as `from` on next ask).
   * Marketing (Миа) lives on its own page, so route there instead.
   */
  const handleHandoff = (targetKey) => {
    const target = getAgent(targetKey);
    if (!target || target.key === agent) return;
    if (target.engine !== 'legal') {
      navigate(target.route || '/terminal/marketing-ai');
      return;
    }
    const lastUser = [...messages].reverse().find((m) => m.type === 'user');
    const carried = (lastUser?.content || '').trim();
    const fromKey = agent;
    handleNewConversation();
    setAgent(targetKey);
    setHandoffFrom(fromKey);
    if (carried) setQuestion(carried);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  /**
   * Manual expert switch from the in-chat roster bar. Unlike a hand-off, the user
   * is deliberately picking a teammate, so we start that expert's own fresh thread
   * (no "handed off from" framing). Marketing lives on its own page.
   */
  const handleSelectAgent = (a) => {
    if (!a || a.key === agent) return;
    if (a.engine !== 'legal') { navigate(a.route || '/terminal/marketing-ai'); return; }
    handleNewConversation();
    setHandoffFrom(null);
    setAgent(a.key);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  /**
   * Ask-a-Pro handoff: create a `consult` pro request from the current chat.
   * Uses the last user question (or the input box) + a short transcript excerpt;
   * gated behind the proRequest terms (data-sharing consent).
   */
  const handleAskPro = (reason = null, msgIndex = null) => {
    // Wait for the AI's answer to land, so the Pro's session summary includes it.
    if (isLoading || isStreaming) { setError('Почекајте AI да го заврши одговорот, па побарајте професионалец.'); return; }
    // The excerpt below is a fallback: when the chat is saved, the server builds
    // the Pro's intro from the user's current session (see proRequestsController).
    // Share ONLY the exchange being escalated — the user's question + the AI
    // answer(s) to it — never the user's earlier messages. When invoked from an
    // AI message's card, that message's question; otherwise the latest one.
    const end = msgIndex != null ? msgIndex + 1 : messages.length;
    let qIdx = -1;
    for (let i = end - 1; i >= 0; i--) { if (messages[i].type === 'user') { qIdx = i; break; } }
    const q = (qIdx >= 0 ? messages[qIdx].content : question).trim();
    if (!q) { setError('Прво напишете или поставете прашање.'); return; }
    const excerpt = (qIdx >= 0 ? messages.slice(qIdx, end) : [])
      .map((m) => `${m.type === 'user' ? 'Корисник' : activeAgent.name}: ${m.content}`)
      .join('\n\n');
    // No heavy consent modal — inviting creates the request directly. Consent is
    // implied (and the one-line disclaimer lives in the conversation); consentVersion
    // is still recorded on the request.
    (async () => {
      setProNotice(null);
      try {
        const res = await ProRequestsApiService.create({
          type: 'consult',
          subject: q.slice(0, 120),
          agent,
          context: { question: q, conversationId: currentConversationId, transcriptExcerpt: excerpt, reason: reason || undefined },
          consentVersion: CURRENT_VERSIONS.proRequest,
        });
        if (res.success) {
          // IMPORTANT: no pro users yet — do NOT promise a response. Frame it as
          // "we'll check availability".
          setProNotice('Го зачувавме вашето барање и проверуваме дали има достапен професионалец што може да се вклучи. Ако некој се приклучи, ќе ве известиме во „Разговори" — тоа засега не е загарантирано.');
          // From now on messages go to the Pro thread; the AI waits to be invited.
          if (res.item?._id) setProRequestId(res.item._id);
          if (msgIndex != null) setProCardState((s) => ({ ...s, [msgIndex]: 'invited' }));
        } else setError(res.message || 'Грешка при испраќање на барањето.');
      } catch (e) { setError(e.message || 'Грешка при испраќање на барањето.'); }
    })();
  };

  /**
   * Handle loading a previous conversation
   */
  const handleSelectConversation = async (conversationId) => {
    try {
      setIsLoading(true);
      const response = await ChatbotApiService.getConversation(conversationId);

      if (response.success) {
        const conversation = response.data.conversation;

        // Format messages from conversation history
        const formattedMessages = conversation.messages.map(msg => ({
          type: msg.type,
          content: msg.content,
          sources: msg.sources || [],
          citations: msg.citations || [],
          unverifiedCitations: msg.unverifiedCitations || [],
          timestamp: new Date(msg.timestamp),
          messageId: msg.messageId || null,
          feedback: msg.feedback || null,
        }));

        setMessages(formattedMessages);
        setCurrentConversationId(conversationId);
        // Adopt the conversation's character so the header + bubbles match it.
        if (conversation.agent) {
          const picked = getAgent(conversation.agent);
          if (picked && picked.engine === 'legal') setAgent(picked.key);
        }
        setError(null);
      } else {
        setError('Не можевме да ја вчитаме конверзацијата.');
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Грешка при вчитување на конверзацијата.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle sending a question to the chatbot (with streaming)
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim()) return;

    // Human pro in the loop → the message goes ONLY to the pro's thread. No AI
    // call, so it costs no credits and doesn't count toward the weekly AI quota.
    // Re-check right before asking the AI: a pro may have joined since the last
    // 15s poll (the server refuses the AI call in that case anyway).
    let liveProId = proRequestId;
    if (!liveProId && currentConversationId) {
      const r = await fetchActiveProForConversation(currentConversationId);
      if (r) {
        setProRequestId(r.id); setAssignedProName(r.assignedProName); setProMessages(r.proMessages);
        setProProfile(r.proProfile); setUserRevealed(r.userRevealed); setEmailMuted(r.emailMuted);
        liveProId = r.id;
      }
    }
    // Group chat: once a pro is invited, every message goes to the group; the AI
    // answers only when the user invited it for this one message (link or @ai).
    let groupText = null;
    if (liveProId) {
      const text = question.trim();
      const invited = aiArmed || mentionsAi(text, activeAgent?.name);
      setAiArmed(false); // one invite = one AI reply
      const sent = await sendToPro(liveProId);
      if (!sent || !currentConversationId || !invited) return;
      groupText = text;
    }

    if (outOfQuota) {
      // The dedicated limit-wall card (below) communicates this + offers the pro
      // hand-off; no raw error banner needed.
      return;
    }

    const questionText = groupText ?? question;
    const userMessage = {
      type: 'user',
      content: questionText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    // Hand-off origin applies only to THIS (first) message after a switch.
    const fromAgent = handoffFrom;
    setHandoffFrom(null);
    setQuestion('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);
    setIsStreaming(false);
    setError(null);

    try {
      let conversationId = currentConversationId;

      // If no current conversation, create one — tagged with the active character
      // so it joins that character's own thread list.
      if (!conversationId) {
        const newConvResponse = await ChatbotApiService.createConversation(questionText, agent);
        if (newConvResponse.success) {
          conversationId = newConvResponse.data.conversationId;
          setCurrentConversationId(conversationId);
        }
      }

      // Add empty AI message placeholder for streaming
      const aiMessage = {
        type: 'ai',
        content: '',
        sources: [],
        timestamp: new Date(),
        isStreaming: true,
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
      setIsStreaming(true);

      await ChatbotApiService.sendMessageStream(conversationId, questionText, {
        onToken: (token) => {
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.type === 'ai') {
              updated[updated.length - 1] = { ...last, content: last.content + token };
            }
            return updated;
          });
        },
        onSources: (sources) => {
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.type === 'ai') {
              updated[updated.length - 1] = { ...last, sources };
            }
            return updated;
          });
        },
        onSuggestions: (suggestions) => {
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.type === 'ai') {
              // Remove [SUGGESTIONS]...[/SUGGESTIONS] tags from displayed content
              const cleanContent = last.content.replace(/\[SUGGESTIONS\][\s\S]*?\[\/SUGGESTIONS\]/, '').trim();
              updated[updated.length - 1] = { ...last, content: cleanContent, suggestions };
            }
            return updated;
          });
        },
        // Server-checked answer: replaces the streamed text (⚠ on unverified
        // article numbers) and carries the verified citations for the chips.
        onCitations: ({ content, citations, unverified }) => {
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.type === 'ai') {
              updated[updated.length - 1] = { ...last, content, citations, unverifiedCitations: unverified };
            }
            return updated;
          });
        },
        onDone: (data) => {
          if (data.creditsOnly) return;
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.type === 'ai') {
              updated[updated.length - 1] = { ...last, isStreaming: false, messageId: data.messageId };
            }
            return updated;
          });
          if (data.remainingQuestions !== undefined) {
            setLimits(prev => ({ ...prev, remaining: data.remainingQuestions }));
          }
          setIsStreaming(false);
          setRefreshTrigger(prev => prev + 1);
          refreshCredits();
        },
        onError: (errorMsg) => {
          setError(errorMsg || 'Се случи грешка при обработка на вашето прашање.');
          setMessages(prev => prev.filter(m => !(m.type === 'ai' && m.isStreaming && !m.content)));
          setIsStreaming(false);
        },
      }, agent, fromAgent, !!groupText, !!groupText);

    } catch (err) {
      console.error('Error asking question:', err);

      // Fallback to non-streaming
      try {
        // Remove the streaming AI message if it exists
        setMessages(prev => prev.filter(m => !(m.type === 'ai' && m.isStreaming)));
        setIsLoading(true);
        setIsStreaming(false);

        let conversationId = currentConversationId;
        const data = await handleCreditOperation(
          async () => ChatbotApiService.sendMessage(conversationId, questionText, agent, fromAgent),
          'AI прашање',
          1
        );

        if (!data) {
          setMessages(prev => prev.slice(0, prev.length - 1));
          setIsLoading(false);
          return;
        }

        if (data.success) {
          const aiMessage = {
            type: 'ai',
            content: data.data.answer,
            sources: data.data.sources,
            citations: data.data.citations || [],
            unverifiedCitations: data.data.unverifiedCitations || [],
            suggestions: data.data.suggestions || [],
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          setLimits(prev => ({ ...prev, remaining: data.data.remainingQuestions }));
          setRefreshTrigger(prev => prev + 1);
          await refreshCredits();
        } else {
          setError(data.message || 'Се случи грешка. Ве молиме обидете се повторно.');
          setMessages(prev => prev.slice(0, -1));
        }
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        setError('Не можевме да се поврземе со серверот. Ве молиме обидете се повторно.');
        setMessages(prev => prev.filter(m => m.type !== 'ai' || m.content));
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Shared human thread: post the user's message to the assigned pro. The thread
   * (not the AI conversation) stores it, so it's appended to proMessages and the
   * poll keeps it in sync. On failure the text goes back into the input.
   */
  const sendToPro = async (requestId = proRequestId) => {
    const text = question.trim();
    setQuestion('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setError(null);
    setIsLoading(true);
    try {
      const res = await ProRequestsApiService.addMessage(requestId, text);
      if (res?.success && res.message) {
        setProMessages(prev => [...prev, toThreadMessage(res.message, assignedProName)]);
        return true;
      }
      setQuestion(text);
      setError(res?.message || 'Пораката не е испратена. Обидете се повторно.');
    } catch (e) {
      setQuestion(text);
      setError(e?.message || 'Пораката не е испратена. Обидете се повторно.');
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Handle clicking a suggestion chip - fills the input
   */
  const handleSuggestionClick = (suggestion) => {
    setQuestion(suggestion);
  };

  /**
   * Handle feedback (thumbs up/down) on AI messages
   */
  const handleFeedback = async (messageIndex, rating) => {
    const message = messages[messageIndex];
    if (!message || message.type !== 'ai' || !message.messageId || !currentConversationId) return;

    // Toggle: if same rating clicked, remove it
    const newRating = message.feedback?.rating === rating ? null : rating;

    try {
      await ChatbotApiService.rateMessage(currentConversationId, message.messageId, newRating);
      setMessages(prev => {
        const updated = [...prev];
        updated[messageIndex] = {
          ...updated[messageIndex],
          feedback: newRating ? { rating: newRating } : null,
        };
        return updated;
      });
    } catch (err) {
      console.error('Error rating message:', err);
    }
  };

  /**
   * Format reset date in Macedonian
   */
  const formatResetDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('mk-MK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Timeline shown to the user = conversation turns (tagged with their original
  // index for feedback/pro-card handlers) merged with the pro's replies.
  // Out of weekly AI questions — but talking to an active pro is still free.
  const outOfQuota = limits.remaining <= 0 && !proRequestId;

  const displayMessages = mergeProMessages(
    messages.map((m, i) => ({ ...m, _idx: i })),
    proMessages
  );

  return (
    <div>
      <Header isTerminal={true} />
      <Sidebar />

      <div className={styles.chatLayout}>
        {/* Conversation History Sidebar */}
        <ConversationSidebar
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          refreshTrigger={refreshTrigger}
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          agent={agent}
        />

        <main className={styles.chatMain}>
          <div className={styles.container} style={{ ['--agent-accent']: activeAgent.accent }}>
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <div className={styles.titleMain}>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => navigate('/terminal/ai-team')}
                  title="Назад кон AI Тим"
                  aria-label="Назад кон AI Тим"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                {activeAgent.photo && (
                  <span className={styles.avatarWrap2}>
                    <img src={activeAgent.photo} alt={activeAgent.name} className={styles.titleAvatar} />
                    <span className={styles.onlineDot} aria-hidden="true" />
                  </span>
                )}
                <div>
                  <h1 className={styles.title}><AgentName name={activeAgent.name} /></h1>
                  <p className={styles.roleLine}>
                    {activeAgent.role} · <span className={styles.onlineText}>достапен</span>
                  </p>
                </div>
              </div>
              <div className={styles.headerActions}>
                {activeAgent.hasContractReview && (
                  <button
                    type="button"
                    className={styles.contractToggle}
                    onClick={() => setShowContract((v) => !v)}
                  >
                    📄 {showContract ? 'Затвори преглед' : 'Преглед на договор'}
                  </button>
                )}
                <button
                  type="button"
                  className={styles.askProBtn}
                  onClick={() => handleAskPro()}
                  title="Провери дали има достапен професионалец што може да се вклучи во разговорот"
                >
                  🧑‍⚖️ Побарај професионалец
                </button>
                <PersonaControl />
                <MemoryControl />
                <div className={`${styles.limitsBadge} ${limits.remaining <= 1 ? styles.limitsBadgeLow : ''}`}>
                  <span className={styles.limitsCount}>
                    {limits.remaining}/{limits.total}
                  </span>
                  <span className={styles.limitsLabel}>{limits.remaining === 1 ? 'последно' : 'прашања'}</span>
                  {limits.resetDate && (
                    <span className={styles.resetInfo}>
                      · {formatResetDate(limits.resetDate)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* In-chat expert switcher — jump between the team without leaving */}
            <div className={styles.switcherRow}>
              <AgentRoster variant="bar" activeKey={agent} onSelect={handleSelectAgent} />
            </div>

            {/* Disclaimer */}
            <p className={styles.disclaimer}>
              {activeAgent.name} не е лиценциран адвокат. За специфични правни прашања, консултирајте се со{' '}
              <a
                href="https://mba.org.mk/index.php/mk/imenik-advokati/imenik-aktivni-advokati"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.disclaimerLink}
              >
                квалификуван правен професионалец
              </a>.
            </p>
          </div>

          {/* Contract review panel (Елена only) */}
          {activeAgent.hasContractReview && showContract && (
            <div className={styles.contractPanel}>
              <ContractAnalysisPanel />
            </div>
          )}

          {/* Chat messages area */}
          <div className={styles.messagesContainer}>
            {messages.length === 0 ? (
              <div className={styles.welcome}>
                {activeAgent.photo && (
                  <img src={activeAgent.photo} alt={activeAgent.name} className={styles.welcomeAvatar} />
                )}
                <h3 className={styles.welcomeTitle}>Здраво, јас сум {activeAgent.name}</h3>
                <p className={styles.welcomeRole}>{activeAgent.role}</p>
                {activeAgent.tags && activeAgent.tags.length > 0 && (
                  <div className={styles.welcomeTags}>
                    {activeAgent.tags.map((tag, i) => (
                      <span key={i} className={styles.welcomeTag}>{tag}</span>
                    ))}
                  </div>
                )}
                {handoffFrom && getAgent(handoffFrom) && (
                  <p className={styles.handoffNote}>
                    Префрлени сте од {getAgent(handoffFrom).name}. {activeAgent.name} презема од тука.
                  </p>
                )}
                {!handoffFrom && agentMemoryNote && (
                  <p className={styles.handoffNote}>
                    👋 Добредојде назад! Последен пат работевме на: {agentMemoryNote}
                  </p>
                )}
                <p className={styles.welcomeBio}>{activeAgent.greeting || activeAgent.bio}</p>
                <div className={styles.starters}>
                  {(activeAgent.starters || []).map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      className={styles.starterChip}
                      onClick={() => handleSuggestionClick(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.messagesList}>
                {proProfile && (
                  <div className={styles.proBar}>
                    <button type="button" className={styles.proBarName} onClick={() => setShowProModal(true)}>
                      🧑‍⚖️ {proProfile.name || 'Професионалец'} <span aria-hidden="true">ℹ︎</span>
                    </button>
                    <button type="button" className={styles.proBarReveal} onClick={toggleReveal} disabled={revealBusy}>
                      {userRevealed ? 'Идентитетот е откриен' : 'Анонимни сте · Откриј идентитет'}
                    </button>
                    <button type="button" className={styles.proBarReveal} onClick={toggleEmails}
                      title="Известувања по е-пошта за секоја нова порака во овој разговор">
                      {emailMuted ? '🔕 Е-пошта: исклучена' : '📧 Е-пошта: вклучена'}
                    </button>
                  </div>
                )}
                {showProModal && (
                  <ProProfileModal profile={proProfile} onClose={() => setShowProModal(false)} />
                )}
                {displayMessages.map((message) => {
                  // Human pro reply — rendered as its own bubble; never triggers
                  // the AI (step 5) and carries no feedback/pro-card affordances.
                  if (message.type === 'pro') {
                    return (
                      <div key={`pro-${message.messageId}`} className={`${styles.messageRow} ${styles.rowPro}`}>
                        <div className={styles.bubbleCol}>
                          <div className={styles.messageHeader}>
                            <span className={styles.messageAuthor}
                              style={proProfile ? { cursor: 'pointer' } : undefined}
                              onClick={() => proProfile && setShowProModal(true)}>
                              🧑‍⚖️ {message.author} · Професионалец
                            </span>
                            <span className={styles.messageTime}>
                              {message.timestamp.toLocaleTimeString('mk-MK', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className={`${styles.bubble} ${styles.bubblePro}`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  const index = message._idx;
                  const isAi = message.type === 'ai';
                  const { clean: displayContent, handoff, askPro } = isAi
                    ? splitMarkers(message.content)
                    : { clean: message.content, handoff: null, askPro: null };
                  const handoffAgent = handoff ? getAgent(handoff) : null;
                  return (
                  <div
                    key={index ?? `thread-${message.messageId}`}
                    className={`${styles.messageRow} ${
                      message.type === 'user' ? styles.rowUser : styles.rowAi
                    }`}
                  >
                    {message.type === 'ai' && (
                      activeAgent.photo
                        ? <img src={activeAgent.photo} alt={activeAgent.name} className={styles.msgAvatar} />
                        : <span className={styles.msgAvatarFallback}>{activeAgent.icon}</span>
                    )}

                    <div className={styles.bubbleCol}>
                      <div className={styles.messageHeader}>
                        <span className={styles.messageAuthor}>
                          {message.type === 'user' ? 'Вие' : activeAgent.name}
                        </span>
                        <span className={styles.messageTime}>
                          {message.timestamp.toLocaleTimeString('mk-MK', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <div className={`${styles.bubble} ${message.type === 'user' ? styles.bubbleUser : styles.bubbleAi} ${message.type === 'ai' ? styles.markdownContent : ''}`}>
                        {isAi && message.isStreaming && !displayContent ? (
                          <span className={styles.typingDots} aria-label="пишува…">
                            <span></span><span></span><span></span>
                          </span>
                        ) : isAi ? (
                          <>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {displayContent}
                            </ReactMarkdown>
                            {message.isStreaming && <span className={styles.streamingCursor}>|</span>}
                          </>
                        ) : (
                          message.content
                        )}
                      </div>

                      {isAi && !message.isStreaming && (message.citations?.length > 0 || message.unverifiedCitations?.length > 0) && (
                        <CitationChips citations={message.citations || []} unverified={message.unverifiedCitations || []} />
                      )}

                      {/* Feedback buttons for AI messages (not during streaming) */}
                      {message.type === 'ai' && !message.isStreaming && message.content && (
                        <div className={styles.feedbackRow}>
                          <button
                            className={`${styles.feedbackBtn} ${message.feedback?.rating === 'up' ? styles.feedbackActive : ''}`}
                            onClick={() => handleFeedback(index, 'up')}
                            title="Корисен одговор"
                          >
                            👍
                          </button>
                          <button
                            className={`${styles.feedbackBtn} ${message.feedback?.rating === 'down' ? styles.feedbackActive : ''}`}
                            onClick={() => handleFeedback(index, 'down')}
                            title="Некорисен одговор"
                          >
                            👎
                          </button>
                        </div>
                      )}

                      {/* Suggestion chips for AI messages */}
                      {message.type === 'ai' && !message.isStreaming && message.suggestions && message.suggestions.length > 0 && (
                        <div className={styles.suggestionsRow}>
                          {message.suggestions.map((suggestion, sIdx) => (
                            <button
                              key={sIdx}
                              className={styles.suggestionChip}
                              onClick={() => handleSuggestionClick(suggestion)}
                              disabled={isLoading || isStreaming}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Teammate hand-off chip (light) — switch to the right specialist */}
                      {isAi && !message.isStreaming && handoffAgent && handoffAgent.key !== agent && (
                        <div className={styles.handoffRow}>
                          <button
                            type="button"
                            className={styles.handoffChip}
                            onClick={() => handleHandoff(handoffAgent.key)}
                            disabled={isLoading || isStreaming}
                            title={`Продолжи со ${handoffAgent.name} — ${handoffAgent.role}`}
                          >
                            {handoffAgent.photo
                              ? <img src={handoffAgent.photo} alt="" className={styles.handoffAvatar} />
                              : <span className={styles.handoffIcon}>{handoffAgent.icon}</span>}
                            <span>Префрли се на <strong>{handoffAgent.name}</strong> →</span>
                          </button>
                        </div>
                      )}

                      {/* AI-suggested human handoff — the AI itself offers to check for a pro.
                          Cautious copy: we CHECK availability, never promise a response. */}
                      {isAi && !message.isStreaming && askPro && proCardState[index] !== 'dismissed' && (
                        <div className={styles.askProCard}>
                          {proCardState[index] === 'invited' ? (
                            <span className={styles.askProDone}>
                              ✓ Го зачувавме барањето и проверуваме дали има достапен професионалец. Следете во „Разговори".
                            </span>
                          ) : (
                            <>
                              <span className={styles.askProText}>
                                🧑‍⚖️ {askPro} Да проверам дали има достапен професионалец што може да се вклучи во разговорот?
                              </span>
                              <span className={styles.askProActions}>
                                <button
                                  type="button"
                                  className={styles.askProYes}
                                  onClick={() => handleAskPro(askPro, index)}
                                  disabled={isLoading || isStreaming}
                                >
                                  Да, провери
                                </button>
                                <button
                                  type="button"
                                  className={styles.askProNo}
                                  onClick={() => setProCardState((s) => ({ ...s, [index]: 'dismissed' }))}
                                >
                                  Не, продолжи со тебе
                                </button>
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}

                {/* Loading indicator */}
                {isLoading && (
                  <div className={`${styles.messageRow} ${styles.rowAi}`}>
                    {activeAgent.photo
                      ? <img src={activeAgent.photo} alt={activeAgent.name} className={styles.msgAvatar} />
                      : <span className={styles.msgAvatarFallback}>{activeAgent.icon}</span>}
                    <div className={styles.bubbleCol}>
                      <div className={`${styles.bubble} ${styles.bubbleAi}`}>
                        <div className={styles.loadingIndicator}>
                          <span className={styles.dot}></span>
                          <span className={styles.dot}></span>
                          <span className={styles.dot}></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Ask-a-Pro confirmation */}
          {proNotice && (
            <div className={styles.proNotice}>
              ✓ {proNotice}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className={styles.errorMessage}>
              ❌ {error}
            </div>
          )}

          {/* Weekly-limit wall — graceful, turns the wall into the pro hand-off moment */}
          {outOfQuota && (
            <div className={styles.limitWall}>
              <div className={styles.limitWallText}>
                <strong>Ги искористивте бесплатните прашања за оваа недела.</strong>
                <span>
                  {limits.resetDate ? `Се ресетира на ${formatResetDate(limits.resetDate)}. ` : ''}
                  За конкретно прашање не морате да чекате — можеме да провериме дали има достапен професионалец.
                </span>
              </div>
              <div className={styles.limitWallActions}>
                <button type="button" className={styles.limitWallBtn} onClick={() => handleAskPro()}>
                  🧑‍⚖️ Побарај професионалец
                </button>
                <a
                  href="https://mba.org.mk/index.php/mk/imenik-advokati/imenik-aktivni-advokati"
                  target="_blank" rel="noopener noreferrer" className={styles.limitWallLink}
                >
                  Именик на адвокати →
                </a>
              </div>
            </div>
          )}

          {/* Input form */}
          <div className={styles.inputContainer}>
            {proRequestId && (
              <AiInviteLink agentName={activeAgent?.name || 'AI'} armed={aiArmed} waiting={!proProfile}
                onToggle={() => { setAiArmed((v) => !v); textareaRef.current?.focus(); }} />
            )}
            <form onSubmit={handleSubmit} className={styles.inputForm}>
              <textarea
                ref={textareaRef}
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (question.trim() && !isLoading && !isStreaming && !outOfQuota) {
                      handleSubmit(e);
                    }
                  }
                }}
                placeholder={proRequestId ? (aiArmed ? `Порака до групата — одговара и ${activeAgent?.name}…` : 'Порака до професионалецот…') : 'Поставете ваше прашање...'}
                className={styles.input}
                disabled={isLoading || isStreaming || outOfQuota}
                maxLength={500}
                rows={1}
              />
              <button
                type="submit"
                className={`${styles.sendButton} ${question.trim() && !isLoading && !isStreaming && !outOfQuota ? styles.sendButtonActive : ''}`}
                disabled={isLoading || isStreaming || !question.trim() || outOfQuota}
                aria-label="Испрати"
              >
                {isLoading || isStreaming ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={styles.sendIconSpinner}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="50" strokeDashoffset="20" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5" />
                    <path d="M5 12l7-7 7 7" />
                  </svg>
                )}
              </button>
            </form>
            <div className={styles.charCount}>
              {question.length} / 500 · Enter за испраќање, Shift+Enter за нов ред
            </div>
          </div>
        </div>
        </main>
      </div>

      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        isOpen={showInsufficientModal}
        onClose={closeModal}
        requiredCredits={modalConfig.requiredCredits}
        actionName={modalConfig.actionName}
      />

      {/* Ask-a-Pro consent */}
      {termsModal && <FeatureTermsModal {...termsModal} />}
    </div>
  );
};

export default AIChat;
