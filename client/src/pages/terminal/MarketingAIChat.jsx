import React, { useState, useEffect, useRef } from 'react';
import { useCredit } from '../../contexts/CreditContext';
import Header from '../../components/common/Header';
import MarketingBotApiService from '../../services/marketingBotApi';
import InsufficientCreditsModal from '../../components/common/InsufficientCreditsModal';
import useCreditHandler from '../../hooks/useCreditHandler';
import styles from '../../styles/terminal/AIChat.module.css';

/**
 * MarketingAIChat Component
 *
 * AI-powered marketing chatbot interface
 * - Ask questions about marketing strategies and tactics
 * - Get creative and practical marketing advice
 * - Weekly limit of 4 questions per user (separate from legal)
 */
const MarketingAIChat = () => {
  const { refreshCredits } = useCredit();
  const { handleCreditOperation, showInsufficientModal, modalConfig, closeModal } = useCreditHandler();

  // State management
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [limits, setLimits] = useState({
    remaining: 4,
    total: 4,
    resetDate: null
  });

  // Conversation history state
  const [currentConversationId, setCurrentConversationId] = useState(null);

  // Ref for auto-scrolling to bottom
  const messagesEndRef = useRef(null);

  // Fetch user's remaining question limits on component mount
  useEffect(() => {
    fetchLimits();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Fetch user's weekly question limits for marketing
   */
  const fetchLimits = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.warn('No auth token found');
        return;
      }

      const data = await MarketingBotApiService.getLimits();

      if (data.success) {
        setLimits({
          remaining: data.data.remaining,
          total: data.data.total,
          resetDate: data.data.resetDate
        });
      } else {
        console.warn('Failed to fetch marketing limits:', data.message);
      }
    } catch (err) {
      console.error('Error fetching marketing limits:', err);
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
   * Handle sending a question to the marketing chatbot
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim()) return;

    // Check if user has questions remaining
    if (limits.remaining <= 0) {
      setError('Ја достигнавте вашата неделна граница од маркетинг прашања.');
      return;
    }

    // Add user's question to messages
    const userMessage = {
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const questionText = question;
    setQuestion('');
    setIsLoading(true);
    setError(null);

    try {
      let conversationId = currentConversationId;

      // If no current conversation, create one
      if (!conversationId) {
        const newConvResponse = await MarketingBotApiService.createConversation(questionText);
        if (newConvResponse.success) {
          conversationId = newConvResponse.data.conversationId;
          setCurrentConversationId(conversationId);
        }
      }

      // Send message to conversation with credit handling
      const data = await handleCreditOperation(
        async () => MarketingBotApiService.sendMessage(conversationId, questionText),
        'Маркетинг AI прашање',
        1
      );

      // If null, it means insufficient credits (handled by modal)
      if (!data) {
        setMessages(prev => prev.slice(0, -1));
        setIsLoading(false);
        return;
      }

      if (data.success) {
        // Add AI response to messages
        const aiMessage = {
          type: 'ai',
          content: data.data.answer,
          sources: data.data.sources,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);

        // Update remaining questions
        setLimits(prev => ({
          ...prev,
          remaining: data.data.remainingQuestions
        }));

        // Refresh credits after successful operation
        await refreshCredits();
      } else {
        setError(data.message || 'Се случи грешка. Ве молиме обидете се повторно.');
        setMessages(prev => prev.slice(0, -1));
      }
    } catch (err) {
      console.error('Error asking marketing question:', err);
      setError('Не можевме да се поврземе со серверот. Ве молиме обидете се повторно.');
      setMessages(prev => prev.slice(0, -1));
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

      <div className={styles.chatLayout}>
        {/* Simple sidebar for new conversation */}
        <aside className={styles.conversationSidebar}>
          <div className={styles.sidebarHeader}>
            <h3>Маркетинг AI</h3>
          </div>
          <button
            className={styles.newConversationBtn}
            onClick={handleNewConversation}
          >
            + Нова конверзација
          </button>
        </aside>

        <main className={styles.chatMain}>
          <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Маркетинг Стратег AI</h1>
            <p className={styles.subtitle}>
              Вашиот персонален маркетинг консултант - заедно градиме стратегија за вашиот бизнис
            </p>

            {/* Question counter */}
            <div className={styles.limitsCard}>
              <div className={styles.limitsInfo}>
                <span className={styles.limitsLabel}>Преостанати прашања:</span>
                <span className={styles.limitsCount}>
                  {limits.remaining} / {limits.total}
                </span>
              </div>
              {limits.resetDate && (
                <div className={styles.resetInfo}>
                  Ресетирање: {formatResetDate(limits.resetDate)}
                </div>
              )}
            </div>

            {/* Marketing info */}
            <div className={styles.disclaimer} style={{ borderLeftColor: '#10b981', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.02))' }}>
              💡 <strong>Совет:</strong> Опишете го вашиот бизнис или предизвик - AI консултантот ќе ви постави прашања за да ве разбере подобро и да ви даде персонализирани препораки.
            </div>
          </div>

          {/* Chat messages area */}
          <div className={styles.messagesContainer}>
            {messages.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📈</div>
                <h3>Вашиот персонален маркетинг консултант</h3>
                <p>Разговарајте со AI маркетинг стратег кој ќе ви помогне да изградите персонализирана маркетинг стратегија за вашиот бизнис.</p>
                <div className={styles.exampleQuestions}>
                  <p className={styles.examplesTitle}>Како функционира:</p>
                  <ul>
                    <li>Опишете го вашиот бизнис или маркетинг предизвик</li>
                    <li>AI консултантот ќе постави прашања за да ве разбере подобро</li>
                    <li>Заедно ќе изградите персонализирана маркетинг стратегија</li>
                    <li>Добивате конкретни, акциони препораки</li>
                  </ul>
                </div>
                <div className={styles.exampleQuestions} style={{ marginTop: '1rem' }}>
                  <p className={styles.examplesTitle}>Примери како да започнете:</p>
                  <ul>
                    <li>"Сакам да го подобрам маркетингот на мојата компанија"</li>
                    <li>"Имам мал бизнис и сакам повеќе клиенти"</li>
                    <li>"Сакам да почнам со дигитален маркетинг"</li>
                    <li>"Како да го зголемам brand awareness?"</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className={styles.messagesList}>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`${styles.message} ${
                      message.type === 'user' ? styles.userMessage : styles.aiMessage
                    }`}
                  >
                    <div className={styles.messageHeader}>
                      <span className={styles.messageAuthor}>
                        {message.type === 'user' ? '👤 Вие' : '📈 Маркетинг Стратег'}
                      </span>
                      <span className={styles.messageTime}>
                        {message.timestamp.toLocaleTimeString('mk-MK', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className={styles.messageContent}>
                      {message.content}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className={`${styles.message} ${styles.aiMessage}`}>
                    <div className={styles.messageHeader}>
                      <span className={styles.messageAuthor}>📈 Маркетинг Стратег</span>
                    </div>
                    <div className={styles.loadingIndicator}>
                      <span className={styles.dot}></span>
                      <span className={styles.dot}></span>
                      <span className={styles.dot}></span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className={styles.errorMessage}>
              ❌ {error}
            </div>
          )}

          {/* Input form */}
          <div className={styles.inputContainer}>
            <form onSubmit={handleSubmit} className={styles.inputForm}>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Опишете го вашиот бизнис или маркетинг предизвик..."
                className={styles.input}
                disabled={isLoading || limits.remaining <= 0}
                maxLength={500}
              />
              <button
                type="submit"
                className={styles.sendButton}
                disabled={isLoading || !question.trim() || limits.remaining <= 0}
              >
                {isLoading ? 'Се обработува...' : 'Прашај'}
              </button>
            </form>
            <div className={styles.charCount}>
              {question.length} / 500 карактери
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
    </div>
  );
};

export default MarketingAIChat;
