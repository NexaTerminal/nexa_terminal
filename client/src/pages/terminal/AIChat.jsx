import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useCredit } from '../../contexts/CreditContext';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import ConversationSidebar from '../../components/chatbot/ConversationSidebar';
import PersonaControl from '../../components/chatbot/PersonaControl';
import ContractAnalysisPanel from '../../components/contractAnalysis/ContractAnalysisPanel';
import { DEFAULT_AGENT_KEY, getAgent } from '../../config/aiAgents';
import ChatbotApiService from '../../services/chatbotApi';
import ProRequestsApiService from '../../services/proRequestsApi';
import InsufficientCreditsModal from '../../components/common/InsufficientCreditsModal';
import FeatureTermsModal from '../../components/terminal/FeatureTermsModal';
import useCreditHandler from '../../hooks/useCreditHandler';
import useTermsGate from '../../hooks/useTermsGate';
import { CURRENT_VERSIONS } from '../../data/featureTerms';
import styles from '../../styles/terminal/AIChat.module.css';

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
  // Contract-review panel (corporate agent only).
  const [showContract, setShowContract] = useState(false);
  // Ask-a-Pro handoff
  const { requireTerms, termsModal } = useTermsGate();
  const [proNotice, setProNotice] = useState(null);

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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
   * Ask-a-Pro handoff: create a `consult` pro request from the current chat.
   * Uses the last user question (or the input box) + a short transcript excerpt;
   * gated behind the proRequest terms (data-sharing consent).
   */
  const handleAskPro = () => {
    const lastUser = [...messages].reverse().find((m) => m.type === 'user');
    const q = (lastUser?.content || question).trim();
    if (!q) { setError('Прво напишете или поставете прашање.'); return; }
    const excerpt = messages
      .slice(-6)
      .map((m) => `${m.type === 'user' ? 'Јас' : activeAgent.name}: ${m.content}`)
      .join('\n\n');
    requireTerms('proRequest', async () => {
      setProNotice(null);
      try {
        const res = await ProRequestsApiService.create({
          type: 'consult',
          subject: q.slice(0, 120),
          agent,
          context: { question: q, conversationId: currentConversationId, transcriptExcerpt: excerpt },
          consentVersion: CURRENT_VERSIONS.proRequest,
        });
        if (res.success) {
          setProNotice('Барањето е испратено. Ќе биде прегледано и доделено на професионалец — следете го во „Моите барања".');
        } else setError(res.message || 'Грешка при испраќање на барањето.');
      } catch (e) { setError(e.message || 'Грешка при испраќање на барањето.'); }
    });
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
          timestamp: new Date(msg.timestamp),
          messageId: msg.messageId || null,
          feedback: msg.feedback || null,
        }));

        setMessages(formattedMessages);
        setCurrentConversationId(conversationId);
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

    if (limits.remaining <= 0) {
      setError('Ја достигнавте вашата неделна граница од прашања.');
      return;
    }

    const userMessage = {
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const questionText = question;
    setQuestion('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);
    setIsStreaming(false);
    setError(null);

    try {
      let conversationId = currentConversationId;

      // If no current conversation, create one
      if (!conversationId) {
        const newConvResponse = await ChatbotApiService.createConversation(questionText);
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
      }, agent);

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
          async () => ChatbotApiService.sendMessage(conversationId, questionText, agent),
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
        />

        <main className={styles.chatMain}>
          <div className={styles.container}>
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
                  <h1 className={styles.title}>{activeAgent.name}</h1>
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
                  onClick={handleAskPro}
                  title="Испрати го прашањето на професионалец"
                >
                  🧑‍⚖️ Прашај професионалец
                </button>
                <PersonaControl />
                <div className={styles.limitsBadge}>
                  <span className={styles.limitsCount}>
                    {limits.remaining}/{limits.total}
                  </span>
                  <span className={styles.limitsLabel}>прашања</span>
                  {limits.resetDate && (
                    <span className={styles.resetInfo}>
                      · {formatResetDate(limits.resetDate)}
                    </span>
                  )}
                </div>
              </div>
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
                <p className={styles.welcomeBio}>{activeAgent.bio}</p>
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
                {messages.map((message, index) => (
                  <div
                    key={index}
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
                        {message.type === 'ai' ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          message.content
                        )}
                        {message.isStreaming && <span className={styles.streamingCursor}>|</span>}
                      </div>

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
                    </div>
                  </div>
                ))}

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

          {/* Input form */}
          <div className={styles.inputContainer}>
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
                    if (question.trim() && !isLoading && !isStreaming && limits.remaining > 0) {
                      handleSubmit(e);
                    }
                  }
                }}
                placeholder="Поставете ваше прашање..."
                className={styles.input}
                disabled={isLoading || isStreaming || limits.remaining <= 0}
                maxLength={500}
                rows={1}
              />
              <button
                type="submit"
                className={`${styles.sendButton} ${question.trim() && !isLoading && !isStreaming && limits.remaining > 0 ? styles.sendButtonActive : ''}`}
                disabled={isLoading || isStreaming || !question.trim() || limits.remaining <= 0}
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
