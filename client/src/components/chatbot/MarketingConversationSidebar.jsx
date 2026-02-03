import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ConversationItem from './ConversationItem';
import MarketingBotApiService from '../../services/marketingBotApi';
import styles from '../../styles/terminal/ConversationSidebar.module.css';

/**
 * MarketingConversationSidebar Component
 *
 * Displays user's marketing conversation history in a sidebar
 * Features:
 * - New conversation button
 * - Scrollable list of conversations
 * - Load more pagination
 * - Active conversation highlighting
 */
const MarketingConversationSidebar = ({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  refreshTrigger,
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
      const response = await MarketingBotApiService.getConversations(limit, currentOffset);

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
      console.error('Error fetching marketing conversations:', err);
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
      const response = await MarketingBotApiService.deleteConversation(conversationId);

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
      console.error('Error deleting marketing conversation:', err);
      alert('Грешка при бришење на конверзацијата.');
    }
  };

  // Handle rename conversation
  const handleRename = async (conversationId, newTitle) => {
    try {
      const response = await MarketingBotApiService.renameConversation(conversationId, newTitle);

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
      console.error('Error renaming marketing conversation:', err);
      alert('Грешка при промена на насловот.');
    }
  };

  // Handle load more
  const handleLoadMore = () => {
    fetchConversations(false);
  };

  return (
    <div className={styles.conversationSidebar}>
      {/* Header */}
      <div className={styles.sidebarHeader}>
      </div>

      {/* New Chat Button */}
      <div className={styles.newChatButtonContainer}>
        <button className={styles.newChatButton} onClick={onNewConversation}>
          <span className={styles.newChatIcon}>+</span>
          Нова конверзација
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
            <p>Започнете со прашање!</p>
          </div>
        ) : (
          <>
            <div className={styles.conversationList}>
              {conversations.map((conversation) => (
                <ConversationItem
                  key={conversation._id}
                  conversation={conversation}
                  isActive={conversation._id === currentConversationId}
                  onClick={onSelectConversation}
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
  );
};

MarketingConversationSidebar.propTypes = {
  currentConversationId: PropTypes.string,
  onSelectConversation: PropTypes.func.isRequired,
  onNewConversation: PropTypes.func.isRequired,
  refreshTrigger: PropTypes.number.isRequired,
};

export default MarketingConversationSidebar;
