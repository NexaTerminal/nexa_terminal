import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faCheck, 
  faHeart, 
  faComment, 
  faFileText, 
  faTrendingUp,
  faTimes,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import styles from '../../styles/terminal/Notifications.module.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      // Silently handle notification fetch errors
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      // Get CSRF token
      const csrfResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const { csrfToken } = await csrfResponse.json();

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include'
      });

      if (response.ok) {
        setNotifications(notifications.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      // Silently handle mark as read errors
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      
      // Get CSRF token
      const csrfResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const { csrfToken } = await csrfResponse.json();

      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include'
      });

      if (response.ok) {
        setNotifications(notifications.map(notif => ({ ...notif, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      // Silently handle mark all as read errors
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'post_liked':
        return faHeart;
      case 'new_comment':
        return faComment;
      case 'new_post':
        return faFileText;
      case 'verification_approved':
      case 'verification_rejected':
        return faCheckCircle;
      case 'investment':
        return faTrendingUp;
      default:
        return faBell;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'post_liked':
        return 'var(--color-primary)';
      case 'new_comment':
        return 'var(--color-primary-light)';
      case 'new_post':
        return 'var(--color-success)';
      case 'verification_approved':
        return 'var(--color-success)';
      case 'verification_rejected':
        return 'var(--color-error)';
      case 'investment':
        return 'var(--color-warning)';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      // Navigate to the action URL
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <div className={styles.notificationsContainer}>
      <button 
        className={styles.notificationButton}
        onClick={() => setIsOpen(!isOpen)}
        data-unread={unreadCount > 0}
      >
        <FontAwesomeIcon icon={faBell} />
        {unreadCount > 0 && (
          <span className={styles.unreadBadge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.notificationsDropdown}>
          <div className={styles.notificationsHeader}>
            <h3>Notifications</h3>
            <div className={styles.headerActions}>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  disabled={loading}
                  className={styles.markAllRead}
                >
                  {loading ? 'Marking...' : 'Mark all read'}
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className={styles.closeButton}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>

          <div className={styles.notificationsList}>
            {notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <FontAwesomeIcon icon={faBell} className={styles.emptyIcon} />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div 
                    className={styles.notificationIcon}
                    style={{ color: getNotificationColor(notification.type) }}
                  >
                    <FontAwesomeIcon icon={getNotificationIcon(notification.type)} />
                  </div>
                  
                  <div className={styles.notificationContent}>
                    <p className={styles.notificationMessage}>
                      {notification.message}
                    </p>
                    <span className={styles.notificationTime}>
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>

                  {!notification.read && (
                    <div className={styles.unreadIndicator} />
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className={styles.notificationsFooter}>
              <button className={styles.viewAllButton}>
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
