import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ConversationItem from './ConversationItem';
import ChatbotApiService from '../../services/chatbotApi';
import styles from '../../styles/terminal/ConversationSidebar.module.css';

/**
 * ConversationSidebar Component
 *
 * Displays user's conversation history in a sidebar
 * Features:
 * - New conversation button
 * - Scrollable list of conversations
 * - Load more pagination
 * - Active conversation highlighting
 */
const ConversationSidebar = ({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  refreshTrigger,
  isOpen,
  onClose,
}) => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Fetch conversations
  const fetchConversations = async (reset = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;
      const response = await ChatbotApiService.getConversations(limit, currentOffset);

      if (response.success) {
        if (reset) {
          setConversations(response.data.conversations);
          setOffset(limit);
        } else {
          setConversations((prev) => [...prev, ...response.data.conversations]);
          setOffset((prev) => prev + limit);
        }
        setHasMore(response.data.hasMore);
      } else {
        setError('Не можевме да ги вчитаме конверзациите.');
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Грешка при вчитување на конверзациите.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchConversations(true);
  }, []);

  // Refresh when trigger changes (after sending a message)
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchConversations(true);
    }
  }, [refreshTrigger]);

  // Handle delete conversation
  const handleDelete = async (conversationId) => {
    try {
      const response = await ChatbotApiService.deleteConversation(conversationId);

      if (response.success) {
        // Remove from local state
        setConversations((prev) => prev.filter((conv) => conv._id !== conversationId));

        // If deleted conversation was active, start new one
        if (conversationId === currentConversationId) {
          onNewConversation();
        }
      } else {
        alert('Не можевме да ја избришеме конверзацијата.');
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      alert('Грешка при бришење на конверзацијата.');
    }
  };

  // Handle rename conversation
  const handleRename = async (conversationId, newTitle) => {
    try {
      const response = await ChatbotApiService.renameConversation(conversationId, newTitle);

      if (response.success) {
        // Update local state
        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === conversationId ? { ...conv, title: response.data.title } : conv
          )
        );
      } else {
        alert('Не можевме да го ажурираме насловот.');
      }
    } catch (err) {
      console.error('Error renaming conversation:', err);
      alert('Грешка при промена на насловот.');
    }
  };

  // Handle load more
  const handleLoadMore = () => {
    fetchConversations(false);
  };

  // Handle selecting a conversation and close sidebar on mobile
  const handleSelectConversation = (conversationId) => {
    onSelectConversation(conversationId);
    if (onClose) onClose();
  };

  // Handle new conversation and close sidebar on mobile
  const handleNewConversation = () => {
    onNewConversation();
    if (onClose) onClose();
  };

  return (
    <>
      {isOpen && <div className={styles.sidebarBackdrop} onClick={onClose} />}
      <div className={`${styles.conversationSidebar} ${isOpen ? styles.conversationSidebarOpen : ''}`}>
      {/* New Chat Button */}
      <div className={styles.newChatButtonContainer}>
        <button className={styles.newChatButton} onClick={handleNewConversation}>
          <span className={styles.newChatIcon}>+</span>
          <span className={styles.newChatLabel}>Нова конверзација</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className={styles.conversationListContainer}>
        {isLoading && conversations.length === 0 ? (
          <div className={styles.loadingMessage}>Вчитување...</div>
        ) : error ? (
          <div className={styles.errorMessage}>{error}</div>
        ) : conversations.length === 0 ? (
          <div className={styles.emptyConversations}>
            <p>Немате конверзации.</p>
            <p>Започнете со праш

ање!</p>
          </div>
        ) : (
          <>
            <div className={styles.conversationList}>
              {conversations.map((conversation) => (
                <ConversationItem
                  key={conversation._id}
                  conversation={conversation}
                  isActive={conversation._id === currentConversationId}
                  onClick={handleSelectConversation}
                  onDelete={handleDelete}
                  onRename={handleRename}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className={styles.loadMoreContainer}>
                <button
                  className={styles.loadMoreButton}
                  onClick={handleLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? 'Вчитување...' : 'Вчитај повеќе'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
};

ConversationSidebar.propTypes = {
  currentConversationId: PropTypes.string,
  onSelectConversation: PropTypes.func.isRequired,
  onNewConversation: PropTypes.func.isRequired,
  refreshTrigger: PropTypes.number.isRequired,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
};

export default ConversationSidebar;
