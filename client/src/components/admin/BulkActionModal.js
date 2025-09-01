import React, { useState } from 'react';
import styles from '../../styles/admin/BulkActionModal.module.css';

const BulkActionModal = ({ isOpen, onClose, selectedUsers, onAction }) => {
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('');
  const [newRole, setNewRole] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const actionData = {
        userIds: Array.from(selectedUsers),
        action,
        ...(action === 'suspend' && { reason, duration: parseInt(duration) || 0 }),
        ...(action === 'changeRole' && { newRole })
      };

      await onAction(actionData);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAction('');
    setReason('');
    setDuration('');
    setNewRole('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getActionTitle = () => {
    const actionTitles = {
      activate: 'Activate Users',
      deactivate: 'Deactivate Users',
      suspend: 'Suspend Users',
      unsuspend: 'Unsuspend Users',
      changeRole: 'Change User Role',
      delete: 'Delete Users'
    };
    return actionTitles[action] || 'Bulk Action';
  };

  const getActionDescription = () => {
    const count = selectedUsers.size;
    const actionDescriptions = {
      activate: `Activate ${count} selected user${count > 1 ? 's' : ''}`,
      deactivate: `Deactivate ${count} selected user${count > 1 ? 's' : ''}`,
      suspend: `Suspend ${count} selected user${count > 1 ? 's' : ''}`,
      unsuspend: `Remove suspension from ${count} selected user${count > 1 ? 's' : ''}`,
      changeRole: `Change role for ${count} selected user${count > 1 ? 's' : ''}`,
      delete: `Permanently delete ${count} selected user${count > 1 ? 's' : ''}`
    };
    return actionDescriptions[action] || `Perform action on ${count} selected user${count > 1 ? 's' : ''}`;
  };

  const renderActionFields = () => {
    switch (action) {
      case 'suspend':
        return (
          <>
            <div className={styles.formGroup}>
              <label>Reason for Suspension</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a reason for the suspension..."
                required
                className={styles.textarea}
                rows="3"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Duration (days)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="0 for permanent suspension"
                min="0"
                className={styles.input}
              />
              <small className={styles.helpText}>
                Leave empty or enter 0 for permanent suspension
              </small>
            </div>
          </>
        );

      case 'changeRole':
        return (
          <div className={styles.formGroup}>
            <label>New Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              required
              className={styles.select}
            >
              <option value="">Select new role...</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        );

      case 'delete':
        return (
          <div className={styles.warningBox}>
            <div className={styles.warningIcon}>⚠️</div>
            <div>
              <p><strong>Warning: This action cannot be undone!</strong></p>
              <p>All user data, documents, and activity will be permanently deleted.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isDestructiveAction = action === 'delete' || action === 'suspend';

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{getActionTitle()}</h2>
          <button onClick={handleClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.selectionInfo}>
            <div className={styles.selectionCount}>
              {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
            </div>
            <p className={styles.actionDescription}>
              {action ? getActionDescription() : 'Choose an action to perform on the selected users:'}
            </p>
          </div>

          <div className={styles.formGroup}>
            <label>Action</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              required
              className={styles.select}
            >
              <option value="">Select action...</option>
              <option value="activate">✅ Activate Users</option>
              <option value="deactivate">⏸️ Deactivate Users</option>
              <option value="suspend">🚫 Suspend Users</option>
              <option value="unsuspend">🔓 Unsuspend Users</option>
              <option value="changeRole">👤 Change Role</option>
              <option value="delete">🗑️ Delete Users</option>
            </select>
          </div>

          {renderActionFields()}

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !action}
              className={`${styles.confirmButton} ${isDestructiveAction ? styles.destructive : ''}`}
            >
              {loading ? (
                <>
                  <div className={styles.spinner}></div>
                  Processing...
                </>
              ) : (
                `Confirm ${getActionTitle()}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkActionModal;