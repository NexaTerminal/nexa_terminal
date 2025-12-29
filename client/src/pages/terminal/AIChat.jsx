import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCredit } from '../../contexts/CreditContext';
import Header from '../../components/common/Header';
import ConversationSidebar from '../../components/chatbot/ConversationSidebar';
import ChatbotApiService from '../../services/chatbotApi';
import InsufficientCreditsModal from '../../components/common/InsufficientCreditsModal';
import useCreditHandler from '../../hooks/useCreditHandler';
import styles from '../../styles/terminal/AIChat.module.css';
import dashboardStyles from '../../styles/terminal/Dashboard.module.css';

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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
          timestamp: new Date(msg.timestamp)
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
   * Handle sending a question to the chatbot
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim()) return;

    // Check if user has questions remaining
    if (limits.remaining <= 0) {
      setError('Ја достигнавте вашата неделна граница од прашања.');
      return;
    }

    // Add user's question to messages
    const userMessage = {
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const questionText = question; // Store before clearing
    setQuestion(''); // Clear input
    setIsLoading(true);
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

      // Send message to conversation with credit handling
      const data = await handleCreditOperation(
        async () => ChatbotApiService.sendMessage(conversationId, questionText),
        'AI прашање',
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

        // Trigger conversation list refresh
        setRefreshTrigger(prev => prev + 1);

        // Refresh credits after successful operation
        await refreshCredits();
      } else {
        // Handle error response
        setError(data.message || 'Се случи грешка. Ве молиме обидете се повторно.');

        // Remove the user message if request failed
        setMessages(prev => prev.slice(0, -1));
      }
    } catch (err) {
      console.error('Error asking question:', err);
      setError('Не можевме да се поврземе со серверот. Ве молиме обидете се повторно.');

      // Remove the user message if request failed
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
        {/* Conversation History Sidebar */}
        <ConversationSidebar
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          refreshTrigger={refreshTrigger}
        />

        <main className={styles.chatMain}>
          <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>AI Правен Асистент</h1>
            <p className={styles.subtitle}>
              Поставувајте прашања за правни документи и постапки
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

            {/* Disclaimer */}
            <div className={styles.disclaimer}>
              ⚠️ <strong>Важно:</strong> Овој асистент не е лиценциран адвокат.
              За специфични правни прашања, консултирајте се со{' '}
              <a
                href="https://mba.org.mk/index.php/mk/imenik-advokati/imenik-aktivni-advokati"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.disclaimerLink}
              >
                квалификуван правен професионалец
              </a>.
            </div>
          </div>

          {/* Chat messages area */}
          <div className={styles.messagesContainer}>
            {messages.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>💬</div>
                <h3>Започнете разговор</h3>
                <p>Поставете прашање за правни документи, процедури или барајте совети.</p>
                <div className={styles.exampleQuestions}>
                  <p className={styles.examplesTitle}>Примери на прашања:</p>
                  <ul>
                    <li>Кои се основните елементи на работен договор?</li>
                    <li>Какви се правата на вработените при отпуштање?</li>
                    <li>Што содржи согласност за обработка на лични податоци?</li>
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
                        {message.type === 'user' ? '👤 Вие' : '🤖 AI Асистент'}
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
                      <span className={styles.messageAuthor}>🤖 AI Асистент</span>
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
                placeholder="Поставете ваше прашање..."
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

export default AIChat;
