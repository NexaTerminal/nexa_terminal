import React, { useState, useEffect } from 'react';
import styles from '../../styles/terminal/Notifications.module.css';

// Inline SVG icons (stroke-only, currentColor) — the app avoids icon-font deps
// and uses inline SVGs everywhere (see Header/Sidebar). `name` maps to a glyph.
const Icon = ({ name }) => {
  const c = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'bell':    return (<svg {...c}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>);
    case 'check':   return (<svg {...c}><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></svg>);
    case 'x':       return (<svg {...c}><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></svg>);
    case 'close':   return (<svg {...c}><path d="M18 6L6 18M6 6l12 12" /></svg>);
    case 'trend':   return (<svg {...c}><path d="M3 17l6-6 4 4 7-7" /><path d="M17 8h4v4" /></svg>);
    default:        return (<svg {...c}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>);
  }
};

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
      case 'verification_approved':
      case 'subscription_approved':
        return 'check';
      case 'verification_rejected':
      case 'subscription_rejected':
        return 'x';
      case 'investment':
        return 'trend';
      default:
        return 'bell';
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
      case 'subscription_approved':
        return 'var(--color-success)';
      case 'verification_rejected':
      case 'subscription_rejected':
        return 'var(--color-error)';
      case 'investment':
      case 'subscription_requested':
        return 'var(--color-warning)';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return 'сега';
    if (diffInMinutes < 60) return `пред ${diffInMinutes} мин`;
    if (diffInMinutes < 1440) return `пред ${Math.floor(diffInMinutes / 60)} ч`;
    return `пред ${Math.floor(diffInMinutes / 1440)} дена`;
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
        <Icon name="bell" />
        {unreadCount > 0 && (
          <span className={styles.unreadBadge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.notificationsDropdown}>
          <div className={styles.notificationsHeader}>
            <h3>Известувања</h3>
            <div className={styles.headerActions}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className={styles.markAllRead}
                >
                  {loading ? 'Означувам...' : 'Означи ги сите'}
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className={styles.closeButton}
              >
                <Icon name="close" />
              </button>
            </div>
          </div>

          <div className={styles.notificationsList}>
            {notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}><Icon name="bell" /></span>
                <p>Нема известувања</p>
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
                    <Icon name={getNotificationIcon(notification.type)} />
                  </div>
                  
                  <div className={styles.notificationContent}>
                    {notification.title && (
                      <p className={styles.notificationTitle}>
                        {notification.title}
                      </p>
                    )}
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

        </div>
      )}
    </div>
  );
};

export default Notifications;
