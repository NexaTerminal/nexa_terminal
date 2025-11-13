import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from '../../styles/terminal/ConversationSidebar.module.css';

/**
 * ConversationItem Component
 *
 * Displays a single conversation in the sidebar
 * Shows title, last updated time, and message count
 * Provides hover actions for rename and delete
 */
const ConversationItem = ({ conversation, isActive, onClick, onDelete, onRename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(conversation.title);
  const [showActions, setShowActions] = useState(false);

  const handleRenameClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSaveRename = (e) => {
    e.stopPropagation();
    if (editedTitle.trim() && editedTitle !== conversation.title) {
      onRename(conversation._id, editedTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setEditedTitle(conversation.title);
    setIsEditing(false);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (window.confirm('Дали сте сигурни дека сакате да ја избришете оваа конверзација?')) {
      onDelete(conversation._id);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveRename(e);
    } else if (e.key === 'Escape') {
      handleCancelRename(e);
    }
  };

  const formatRelativeTime = (date) => {
    const now = new Date();
    const updatedAt = new Date(date);
    const diffMs = now - updatedAt;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Сега';
    if (diffMins < 60) return `Пред ${diffMins} ${diffMins === 1 ? 'минута' : 'минути'}`;
    if (diffHours < 24) return `Пред ${diffHours} ${diffHours === 1 ? 'час' : 'часа'}`;
    if (diffDays < 7) return `Пред ${diffDays} ${diffDays === 1 ? 'ден' : 'дена'}`;

    return updatedAt.toLocaleDateString('mk-MK', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={`${styles.conversationItem} ${isActive ? styles.conversationItemActive : ''}`}
      onClick={() => !isEditing && onClick(conversation._id)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={styles.conversationContent}>
        {isEditing ? (
          <div className={styles.conversationEditForm} onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              className={styles.conversationEditInput}
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <div className={styles.conversationEditActions}>
              <button
                className={styles.conversationEditSave}
                onClick={handleSaveRename}
                title="Зачувај"
              >
                ✓
              </button>
              <button
                className={styles.conversationEditCancel}
                onClick={handleCancelRename}
                title="Откажи"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.conversationTitle}>
              {conversation.title}
            </div>
            <div className={styles.conversationMeta}>
              <span className={styles.conversationTime}>
                {formatRelativeTime(conversation.updatedAt)}
              </span>
              {conversation.messageCount > 0 && (
                <>
                  <span className={styles.conversationMetaDot}>•</span>
                  <span className={styles.conversationMessageCount}>
                    {conversation.messageCount} {conversation.messageCount === 1 ? 'порака' : 'пораки'}
                  </span>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {showActions && !isEditing && (
        <div className={styles.conversationActions} onClick={(e) => e.stopPropagation()}>
          <button
            className={styles.conversationActionBtn}
            onClick={handleRenameClick}
            title="Преименувај"
          >
            ✎
          </button>
          <button
            className={styles.conversationActionBtn}
            onClick={handleDeleteClick}
            title="Избриши"
          >
            🗑
          </button>
        </div>
      )}
    </div>
  );
};

ConversationItem.propTypes = {
  conversation: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    updatedAt: PropTypes.string.isRequired,
    messageCount: PropTypes.number.isRequired,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRename: PropTypes.func.isRequired,
};

export default ConversationItem;
