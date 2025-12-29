import React from 'react';
import styles from '../../../styles/terminal/admin/ManageChatbot.module.css';

/**
 * Conversation Details Modal Component
 * Displays full conversation with all messages
 */
const ConversationDetailsModal = ({ conversation, onClose }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Н/А';
    return new Date(dateString).toLocaleString('mk-MK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const messages = conversation.messages || [];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modalContent} ${styles.conversationModal}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div>
            <h3>💬 Детали на разговор</h3>
            <p className={styles.modalSubtitle}>
              {conversation.userEmail || conversation.userName || 'Непознат корисник'}
            </p>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Conversation Metadata */}
          <div className={styles.conversationMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>ID:</span>
              <span className={styles.metaValue}>{conversation._id}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Корисник:</span>
              <span className={styles.metaValue}>
                {conversation.userEmail || conversation.userName || 'Н/А'}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Број на пораки:</span>
              <span className={styles.metaValue}>{messages.length}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Креиран:</span>
              <span className={styles.metaValue}>{formatDate(conversation.createdAt)}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Последна активност:</span>
              <span className={styles.metaValue}>
                {formatDate(conversation.updatedAt || conversation.lastActivity)}
              </span>
            </div>
            {conversation.flagged && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Статус:</span>
                <span className={styles.badgeFlagged}>🚩 Означен</span>
              </div>
            )}
            {conversation.flaggedReason && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Причина:</span>
                <span className={styles.metaValue}>{conversation.flaggedReason}</span>
              </div>
            )}
          </div>

          {/* Messages Timeline */}
          <div className={styles.messagesTimeline}>
            <h4>Историја на разговор</h4>
            {messages.length === 0 ? (
              <div className={styles.emptyMessages}>
                <p>Нема пораки во овој разговор</p>
              </div>
            ) : (
              <div className={styles.messagesList}>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`${styles.message} ${
                      message.type === 'user' || message.role === 'user'
                        ? styles.messageUser
                        : styles.messageBot
                    }`}
                  >
                    <div className={styles.messageHeader}>
                      <span className={styles.messageSender}>
                        {message.type === 'user' || message.role === 'user' ? (
                          <>👤 Корисник</>
                        ) : (
                          <>🤖 Chatbot</>
                        )}
                      </span>
                      <span className={styles.messageTime}>
                        {formatDate(message.timestamp || message.createdAt)}
                      </span>
                    </div>
                    <div className={styles.messageContent}>
                      {message.content || message.text || message.message}
                    </div>
                    {message.sources && message.sources.length > 0 && (
                      <div className={styles.messageSources}>
                        <strong>Извори:</strong>
                        {message.sources.map((source, idx) => (
                          <div key={idx} className={styles.sourceItem}>
                            📄 {source.documentName || source.source || 'Н/А'}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.secondaryButton} onClick={onClose}>
            Затвори
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationDetailsModal;
