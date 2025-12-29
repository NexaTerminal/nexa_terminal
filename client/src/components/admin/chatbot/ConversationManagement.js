import React, { useState, useEffect } from 'react';
import ApiService from '../../../services/api';
import ConversationDetailsModal from './ConversationDetailsModal';
import styles from '../../../styles/terminal/admin/ManageChatbot.module.css';

/**
 * Conversation Management Component
 * Manages user conversations with the chatbot - view, flag, delete
 */
const ConversationManagement = ({ showMessage, setLoading }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [localLoading, setLocalLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadConversations();
  }, [filter, pagination.page]);

  const loadConversations = async () => {
    try {
      setLocalLoading(true);
      console.log('🔍 [FRONTEND] Loading conversations...', { filter, page: pagination.page });

      const response = await ApiService.getChatbotConversations(
        pagination.page,
        pagination.limit,
        filter
      );

      console.log('🔍 [FRONTEND] Conversations response:', response);

      if (response.success) {
        const convos = response.data?.conversations || response.conversations || [];
        const paginationData = response.data?.pagination || response.pagination || {};

        setConversations(convos);
        setPagination({
          page: paginationData.page || 1,
          limit: paginationData.limit || 20,
          total: paginationData.total || 0,
          totalPages: paginationData.totalPages || 0
        });
      } else {
        showMessage('error', 'Неуспешно вчитување на разговори');
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      showMessage('error', error.message || 'Грешка при вчитување на разговори');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleViewDetails = async (conversationId) => {
    try {
      setLoading(true);
      const response = await ApiService.getChatbotConversationDetails(conversationId);

      if (response.success) {
        const conversation = response.data?.conversation || response.conversation;
        setSelectedConversation(conversation);
        setShowDetailsModal(true);
      } else {
        showMessage('error', 'Неуспешно вчитување на детали');
      }
    } catch (error) {
      console.error('Error loading conversation details:', error);
      showMessage('error', error.message || 'Грешка при вчитување на детали');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = async (conversationId, currentlyFlagged) => {
    try {
      setLoading(true);
      const flagged = !currentlyFlagged;
      const reason = flagged ? 'Означено од администратор' : '';

      const response = await ApiService.flagChatbotConversation(
        conversationId,
        flagged,
        reason
      );

      if (response.success) {
        showMessage('success', flagged ? 'Разговорот е означен' : 'Означувањето е отстрането');
        loadConversations();
      } else {
        showMessage('error', 'Неуспешна промена на статус');
      }
    } catch (error) {
      console.error('Error toggling flag:', error);
      showMessage('error', error.message || 'Грешка при промена на статус');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (conversation) => {
    setDeleteConfirm(conversation);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      setLoading(true);
      const response = await ApiService.deleteChatbotConversation(deleteConfirm._id);

      if (response.success) {
        showMessage('success', 'Разговорот е успешно избришан');
        setDeleteConfirm(null);
        loadConversations();
      } else {
        showMessage('error', 'Неуспешно бришење на разговор');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      showMessage('error', error.message || 'Грешка при бришење на разговор');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Н/А';
    return new Date(dateString).toLocaleDateString('mk-MK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filters = [
    { id: 'all', label: 'Сите' },
    { id: 'flagged', label: 'Означени' },
    { id: 'active', label: 'Активни' }
  ];

  if (localLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Вчитување разговори...</p>
      </div>
    );
  }

  return (
    <div className={styles.conversationManagement}>
      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        {filters.map((f) => (
          <button
            key={f.id}
            className={`${styles.filterTab} ${filter === f.id ? styles.filterTabActive : ''}`}
            onClick={() => {
              setFilter(f.id);
              setPagination({ ...pagination, page: 1 });
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Conversations Table */}
      {conversations.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💬</div>
          <h3>Нема разговори</h3>
          <p>
            {filter === 'flagged'
              ? 'Нема означени разговори за момент.'
              : 'Сè уште нема разговори со корисници.'}
          </p>
        </div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Корисник</th>
                  <th>Број на пораки</th>
                  <th>Последна активност</th>
                  <th>Статус</th>
                  <th>Акции</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((conversation) => (
                  <tr key={conversation._id}>
                    <td className={styles.userCell}>
                      <div className={styles.userInfo}>
                        <strong>{conversation.userEmail || conversation.userName || 'Н/А'}</strong>
                        {conversation.userName && (
                          <small>{conversation.userName}</small>
                        )}
                      </div>
                    </td>
                    <td className={styles.centered}>{conversation.messageCount || 0}</td>
                    <td className={styles.dateCell}>
                      {formatDate(conversation.updatedAt || conversation.lastActivity)}
                    </td>
                    <td>
                      {conversation.flagged ? (
                        <span className={styles.badgeFlagged}>🚩 Означен</span>
                      ) : (
                        <span className={styles.badgeActive}>✓ Активен</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.iconButton}
                          onClick={() => handleViewDetails(conversation._id)}
                          title="Прегледај детали"
                        >
                          👁️
                        </button>
                        <button
                          className={`${styles.iconButton} ${
                            conversation.flagged ? styles.iconButtonActive : ''
                          }`}
                          onClick={() => handleToggleFlag(conversation._id, conversation.flagged)}
                          title={conversation.flagged ? 'Отстрани означување' : 'Означи'}
                        >
                          🚩
                        </button>
                        <button
                          className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                          onClick={() => handleDeleteClick(conversation)}
                          title="Избриши"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.paginationButton}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
              >
                ← Претходна
              </button>
              <span className={styles.paginationInfo}>
                Страна {pagination.page} од {pagination.totalPages} (Вкупно: {pagination.total})
              </span>
              <button
                className={styles.paginationButton}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.totalPages}
              >
                Следна →
              </button>
            </div>
          )}
        </>
      )}

      {/* Conversation Details Modal */}
      {showDetailsModal && selectedConversation && (
        <ConversationDetailsModal
          conversation={selectedConversation}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedConversation(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>⚠️ Потврди бришење</h3>
              <button
                className={styles.closeButton}
                onClick={() => setDeleteConfirm(null)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Дали сте сигурни дека сакате да го избришете овој разговор?</p>
              <div className={styles.confirmDetails}>
                <p><strong>Корисник:</strong> {deleteConfirm.userEmail || 'Н/А'}</p>
                <p><strong>Пораки:</strong> {deleteConfirm.messageCount || 0}</p>
                <p><strong>Датум:</strong> {formatDate(deleteConfirm.updatedAt)}</p>
              </div>
              <p className={styles.warningText}>
                Оваа акција не може да се врати.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.secondaryButton}
                onClick={() => setDeleteConfirm(null)}
              >
                Откажи
              </button>
              <button
                className={styles.dangerButton}
                onClick={handleDeleteConfirm}
              >
                🗑️ Избриши
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationManagement;
