import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import styles from '../../styles/terminal/AIChat.module.css';

const AIChat = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: '', // Will be set after translation loads
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Update initial message when translation loads
  useEffect(() => {
    setMessages([{
      id: 1,
      type: 'ai',
      content: t('dashboard.nexaAIWelcome'),
      timestamp: new Date()
    }]);
  }, [t]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response (you can replace this with actual AI API call)
    try {
      // For now, we'll simulate a response
      setTimeout(() => {
        const aiResponse = {
          id: Date.now() + 1,
          type: 'ai',
          content: generateAIResponse(userMessage.content),
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: t('dashboard.nexaAIError'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const generateAIResponse = (userInput) => {
    // Simple response generator using translations
    const responseKeys = [
      'dashboard.nexaAIResponse1',
      'dashboard.nexaAIResponse2',
      'dashboard.nexaAIResponse3',
      'dashboard.nexaAIResponse4',
      'dashboard.nexaAIResponse5'
    ];
    const randomKey = responseKeys[Math.floor(Math.random() * responseKeys.length)];
    return t(randomKey);
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.pageWrapper}>
      <Header isTerminal={true} />
      
      <div className={styles.layout}>
        <Sidebar />
        
        <main className={styles.mainContent}>
          <div className={styles.chatContainer}>
            <div className={styles.chatHeader}>
              <div className={styles.headerContent}>
                <div className={styles.aiAvatar}>🤖</div>
                <div className={styles.headerText}>
                  <h1>{t('dashboard.nexaAI')}</h1>
                  <p className={styles.subtitle}>{t('dashboard.nexaAISubtitle')}</p>
                </div>
              </div>
            </div>

            <div className={styles.messagesContainer}>
              <div className={styles.messagesList}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`${styles.messageItem} ${styles[message.type]}`}
                  >
                    <div className={styles.messageAvatar}>
                      {message.type === 'ai' ? '🤖' : '👤'}
                    </div>
                    <div className={styles.messageContent}>
                      <div className={styles.messageText}>
                        {message.content}
                      </div>
                      <div className={styles.messageTime}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className={`${styles.messageItem} ${styles.ai}`}>
                    <div className={styles.messageAvatar}>🤖</div>
                    <div className={styles.messageContent}>
                      <div className={styles.loadingIndicator}>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            <form className={styles.inputForm} onSubmit={handleSubmit}>
              <div className={styles.inputContainer}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={t('dashboard.nexaAIPlaceholder')}
                  className={styles.messageInput}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className={styles.sendButton}
                  disabled={!inputValue.trim() || isLoading}
                >
                  <span className={styles.sendIcon}>↗</span>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AIChat;
