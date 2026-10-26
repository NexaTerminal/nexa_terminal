import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import ConversationItem from './ConversationItem';
import ChatbotApiService from '../../services/chatbotApi';
import { getAgent } from '../../config/aiAgents';
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
 * - „Корпа" (trash): deleted threads are kept 30 days (restore / delete forever),
 *   then the server purges them; „Избриши ги сите" trashes every thread at once
 */

const DAY_MS = 86400000;
const daysLeft = (purgeAt) => Math.max(0, Math.ceil((new Date(purgeAt) - Date.now()) / DAY_MS));
const daysLabel = (n) => `${n} ${n === 1 ? 'ден' : 'дена'}`;
const ConversationSidebar = ({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  refreshTrigger,
  isOpen,
  onClose,
  agent,
}) => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const [view, setView] = useState('list'); // 'list' | 'trash'
  const [trash, setTrash] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [retentionDays, setRetentionDays] = useState(30);
  const [purgeArmedId, setPurgeArmedId] = useState(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const agentName = agent ? getAgent(agent).name : null;

  // Fetch conversations
  const fetchConversations = async (reset = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;
      const response = await ChatbotApiService.getConversations(limit, currentOffset, agent);

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

  // Initial load + reload whenever the active character changes (each character
  // shows only its own threads).
  useEffect(() => {
    fetchConversations(true);
    setView('list');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent]);

  const fetchTrash = async () => {
    try {
      setTrashLoading(true);
      const response = await ChatbotApiService.getTrash(agent);
      if (response.success) {
        setTrash(response.data.conversations);
        setRetentionDays(response.data.retentionDays || 30);
      }
    } catch (err) {
      console.error('Error fetching trash:', err);
    } finally {
      setTrashLoading(false);
    }
  };

  const openTrash = () => {
    setView('trash');
    setPurgeArmedId(null);
    fetchTrash();
  };

  const handleRestore = async (conversationId) => {
    try {
      const response = await ChatbotApiService.restoreConversation(conversationId);
      if (response.success) {
        setTrash((prev) => prev.filter((c) => c._id !== conversationId));
        fetchConversations(true);
      }
    } catch (err) {
      console.error('Error restoring conversation:', err);
      alert('Не можевме да ја вратиме конверзацијата.');
    }
  };

  // Two-step: first click arms the button, second click deletes for good.
  const handlePurge = async (conversationId) => {
    if (purgeArmedId !== conversationId) {
      setPurgeArmedId(conversationId);
      return;
    }
    try {
      const response = await ChatbotApiService.purgeConversation(conversationId);
      if (response.success) setTrash((prev) => prev.filter((c) => c._id !== conversationId));
    } catch (err) {
      console.error('Error purging conversation:', err);
      alert('Не можевме трајно да ја избришеме конверзацијата.');
    } finally {
      setPurgeArmedId(null);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setDeletingAll(true);
      const response = await ChatbotApiService.deleteAllConversations(agent);
      if (response.success) {
        setConversations([]);
        setHasMore(false);
        setOffset(0);
        setShowDeleteAll(false);
        onNewConversation();
      } else {
        alert('Не можевме да ги избришеме разговорите.');
      }
    } catch (err) {
      console.error('Error deleting all conversations:', err);
      alert('Грешка при бришење на разговорите.');
    } finally {
      setDeletingAll(false);
    }
  };

  // Refresh when trigger changes (after sending a message)
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchConversations(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Bucket conversations (already newest-first) into relative date groups so the
  // list reads like a real chat history.
  const groupByDate = (items) => {
    const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
    const today = startOfDay(Date.now());
    const DAY = 86400000;
    const buckets = [
      { label: 'Денес', items: [] },
      { label: 'Вчера', items: [] },
      { label: 'Последниве 7 дена', items: [] },
      { label: 'Постари', items: [] },
    ];
    items.forEach((c) => {
      const day = startOfDay(c.updatedAt || c.createdAt || Date.now());
      if (day >= today) buckets[0].items.push(c);
      else if (day >= today - DAY) buckets[1].items.push(c);
      else if (day >= today - 7 * DAY) buckets[2].items.push(c);
      else buckets[3].items.push(c);
    });
    return buckets.filter((b) => b.items.length > 0);
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

      {/* Conversations List / Trash */}
      <div className={styles.conversationListContainer}>
        {view === 'trash' ? (
          <div className={styles.trashView}>
            <button type="button" className={styles.trashBack} onClick={() => setView('list')}>
              ← Назад кон разговорите
            </button>
            <p className={styles.trashNote}>
              Избришаните разговори се чуваат {daysLabel(retentionDays)}, а потоа трајно се бришат.
            </p>
            {trashLoading && trash.length === 0 ? (
              <div className={styles.loadingMessage}>Вчитување...</div>
            ) : trash.length === 0 ? (
              <div className={styles.emptyConversations}><p>Корпата е празна.</p></div>
            ) : (
              <div className={styles.conversationList}>
                {trash.map((c) => (
                  <div key={c._id} className={styles.trashItem}>
                    <div className={styles.conversationTitle}>{c.title}</div>
                    <div className={styles.conversationMeta}>
                      <span className={styles.conversationTime}>
                        Трајно се брише за {daysLabel(daysLeft(c.purgeAt))}
                      </span>
                    </div>
                    <div className={styles.trashActions}>
                      <button type="button" className={styles.trashRestoreBtn} onClick={() => handleRestore(c._id)}>
                        Врати
                      </button>
                      <button
                        type="button"
                        className={styles.trashPurgeBtn}
                        onClick={() => handlePurge(c._id)}
                        onMouseLeave={() => purgeArmedId === c._id && setPurgeArmedId(null)}
                      >
                        {purgeArmedId === c._id ? 'Потврди трајно бришење' : 'Избриши трајно'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : isLoading && conversations.length === 0 ? (
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
              {groupByDate(conversations).map((group) => (
                <div key={group.label} className={styles.dateGroup}>
                  <div className={styles.dateGroupHeader}>{group.label}</div>
                  {group.items.map((conversation) => (
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

      {/* Footer: trash + erase all */}
      {view === 'list' && (
        <div className={styles.sidebarFooter}>
          <button type="button" className={styles.footerBtn} onClick={openTrash}>
            🗑 Корпа
          </button>
          {conversations.length > 0 && (
            <button
              type="button"
              className={`${styles.footerBtn} ${styles.footerBtnDanger}`}
              onClick={() => setShowDeleteAll(true)}
            >
              Избриши ги сите
            </button>
          )}
        </div>
      )}
    </div>

    {showDeleteAll && createPortal(
      <div className={styles.deleteModalOverlay} onClick={() => !deletingAll && setShowDeleteAll(false)}>
        <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.deleteModalIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </div>
          <h3 className={styles.deleteModalTitle}>Избриши ги сите разговори</h3>
          <p className={styles.deleteModalText}>
            Сите разговори{agentName ? <> со <strong>{agentName}</strong></> : ''} ќе се преместат во Корпа.
            Таму можете да ги вратите во наредните {daysLabel(retentionDays)}, а потоа трајно се бришат.
          </p>
          <div className={styles.deleteModalActions}>
            <button className={styles.deleteModalCancel} onClick={() => setShowDeleteAll(false)} disabled={deletingAll}>
              Откажи
            </button>
            <button className={styles.deleteModalConfirm} onClick={handleDeleteAll} disabled={deletingAll}>
              {deletingAll ? 'Бришење...' : 'Избриши ги сите'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
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
  agent: PropTypes.string,
};

export default ConversationSidebar;
