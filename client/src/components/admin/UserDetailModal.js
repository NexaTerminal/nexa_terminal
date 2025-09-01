import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/admin/UserDetailModal.module.css';
import axios from 'axios';

const UserDetailModal = ({ user, onClose, onUserUpdate }) => {
  const { token } = useAuth();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [activityLogs, setActivityLogs] = useState([]);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState(30);

  useEffect(() => {
    fetchUserDetails();
  }, [user._id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/users/${user._id}?days=${analyticsTimeframe}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUserDetails(response.data.data);
        setActivityLogs(response.data.data.recentActivity || []);
      }
    } catch (err) {
      setError('Failed to fetch user details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (reason, duration) => {
    try {
      await axios.post(`/api/admin/users/${user._id}/suspend`, {
        reason,
        duration
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchUserDetails();
      onUserUpdate();
    } catch (err) {
      setError('Failed to suspend user');
    }
  };

  const handleUnsuspend = async () => {
    try {
      await axios.post(`/api/admin/users/${user._id}/unsuspend`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchUserDetails();
      onUserUpdate();
    } catch (err) {
      setError('Failed to unsuspend user');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  const formatAction = (action) => {
    const actionMap = {
      login: '🔐 Login',
      document_generated: '📄 Generated Document',
      ai_query: '🤖 AI Query',
      social_post: '📱 Social Post',
      verification: '✅ Verification Action',
      profile_update: '👤 Profile Update'
    };
    return actionMap[action] || action;
  };

  const renderOverviewTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.infoGrid}>
        {/* Basic Information */}
        <div className={styles.infoSection}>
          <h3>Основни информации</h3>
          <div className={styles.infoItems}>
            <div className={styles.infoItem}>
              <label>Корисничко име:</label>
              <span>{userDetails.user.username || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Е-пошта:</label>
              <span>{userDetails.user.email}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Улога:</label>
              <span className={`${styles.badge} ${styles[userDetails.user.role]}`}>
                {userDetails.user.role}
              </span>
            </div>
            <div className={styles.infoItem}>
              <label>Статус:</label>
              <span className={`${styles.badge} ${userDetails.user.isActive ? styles.active : styles.inactive}`}>
                {userDetails.user.isActive ? 'Активен' : 'Неактивен'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <label>Зачленет:</label>
              <span>{formatDate(userDetails.user.createdAt)}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Последна најава:</label>
              <span>{formatDate(userDetails.user.lastLoginAt)}</span>
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className={styles.infoSection}>
          <h3>Company Information</h3>
          <div className={styles.infoItems}>
            <div className={styles.infoItem}>
              <label>Company Name:</label>
              <span>{userDetails.user.companyInfo?.companyName || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Address:</label>
              <span>{userDetails.user.companyInfo?.address || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Tax Number:</label>
              <span>{userDetails.user.companyInfo?.taxNumber || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Business Activity:</label>
              <span>{userDetails.user.companyInfo?.businessActivity || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Company Manager:</label>
              <span>{userDetails.user.companyManager || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Official Email:</label>
              <span>{userDetails.user.officialEmail || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className={styles.infoSection}>
          <h3>Verification Status</h3>
          <div className={styles.infoItems}>
            <div className={styles.infoItem}>
              <label>Company Verified:</label>
              <span className={`${styles.badge} ${userDetails.user.isVerified ? styles.verified : styles.unverified}`}>
                {userDetails.user.isVerified ? 'Verified' : 'Unverified'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <label>Email Verified:</label>
              <span className={`${styles.badge} ${userDetails.user.emailVerified ? styles.verified : styles.unverified}`}>
                {userDetails.user.emailVerified ? 'Verified' : 'Unverified'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <label>Profile Complete:</label>
              <span className={`${styles.badge} ${userDetails.user.profileComplete ? styles.complete : styles.incomplete}`}>
                {userDetails.user.profileComplete ? 'Complete' : 'Incomplete'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <label>Verification Status:</label>
              <span>{userDetails.user.verificationStatus || 'pending'}</span>
            </div>
          </div>
        </div>

        {/* Suspension Information */}
        {userDetails.user.suspendedUntil && (
          <div className={styles.infoSection}>
            <h3>Suspension Information</h3>
            <div className={styles.infoItems}>
              <div className={styles.infoItem}>
                <label>Suspended Until:</label>
                <span className={styles.suspensionDate}>
                  {formatDate(userDetails.user.suspendedUntil)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <label>Reason:</label>
                <span>{userDetails.user.suspensionReason}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        {userDetails.user.suspendedUntil && new Date(userDetails.user.suspendedUntil) > new Date() ? (
          <button onClick={handleUnsuspend} className={styles.unsuspendButton}>
            🔓 Unsuspend User
          </button>
        ) : (
          <button 
            onClick={() => {
              const reason = prompt('Reason for suspension:');
              const duration = prompt('Duration in days (0 for permanent):');
              if (reason !== null) {
                handleSuspend(reason, parseInt(duration) || 0);
              }
            }}
            className={styles.suspendButton}
          >
            🚫 Suspend User
          </button>
        )}
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.analyticsHeader}>
        <h3>Usage Analytics</h3>
        <select
          value={analyticsTimeframe}
          onChange={(e) => {
            setAnalyticsTimeframe(parseInt(e.target.value));
            fetchUserDetails();
          }}
          className={styles.timeframeSelect}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className={styles.analyticsGrid}>
        <div className={styles.analyticCard}>
          <div className={styles.analyticIcon}>🔐</div>
          <div className={styles.analyticValue}>{userDetails.analytics.totalLogins}</div>
          <div className={styles.analyticLabel}>Total Logins</div>
        </div>

        <div className={styles.analyticCard}>
          <div className={styles.analyticIcon}>📄</div>
          <div className={styles.analyticValue}>{userDetails.analytics.totalDocuments}</div>
          <div className={styles.analyticLabel}>Documents Generated</div>
        </div>

        <div className={styles.analyticCard}>
          <div className={styles.analyticIcon}>🤖</div>
          <div className={styles.analyticValue}>{userDetails.analytics.totalAiQueries}</div>
          <div className={styles.analyticLabel}>AI Queries</div>
        </div>

        <div className={styles.analyticCard}>
          <div className={styles.analyticIcon}>📱</div>
          <div className={styles.analyticValue}>{userDetails.analytics.totalSocialPosts}</div>
          <div className={styles.analyticLabel}>Social Posts</div>
        </div>

        <div className={styles.analyticCard}>
          <div className={styles.analyticIcon}>📊</div>
          <div className={styles.analyticValue}>{userDetails.analytics.totalComplianceReports}</div>
          <div className={styles.analyticLabel}>Compliance Reports</div>
        </div>

        <div className={styles.analyticCard}>
          <div className={styles.analyticIcon}>📅</div>
          <div className={styles.analyticValue}>{userDetails.analytics.activeDays}</div>
          <div className={styles.analyticLabel}>Active Days</div>
        </div>
      </div>
    </div>
  );

  const renderActivityTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.activityHeader}>
        <h3>Recent Activity</h3>
        <span className={styles.activityCount}>
          {activityLogs.length} recent actions
        </span>
      </div>

      <div className={styles.activityList}>
        {activityLogs.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📭</span>
            <p>No recent activity found</p>
          </div>
        ) : (
          activityLogs.map((log, index) => (
            <div key={index} className={styles.activityItem}>
              <div className={styles.activityIcon}>
                {formatAction(log.action).split(' ')[0]}
              </div>
              <div className={styles.activityDetails}>
                <div className={styles.activityAction}>
                  {formatAction(log.action)}
                </div>
                <div className={styles.activityTime}>
                  {formatDate(log.timestamp)}
                </div>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className={styles.activityMetadata}>
                    {JSON.stringify(log.metadata, null, 2)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading user details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.userHeader}>
            <div className={styles.userAvatar}>
              {(userDetails.user.companyInfo?.companyName || userDetails.user.email).charAt(0).toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <h2>{userDetails.user.companyInfo?.companyName || userDetails.user.email}</h2>
              <p>{userDetails.user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <span className={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        <div className={styles.tabNav}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`${styles.tabButton} ${activeTab === 'overview' ? styles.active : ''}`}
          >
            Преглед
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`${styles.tabButton} ${activeTab === 'analytics' ? styles.active : ''}`}
          >
            Аналитика
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`${styles.tabButton} ${activeTab === 'activity' ? styles.active : ''}`}
          >
            Активност
          </button>
        </div>

        <div className={styles.modalBody}>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
          {activeTab === 'activity' && renderActivityTab()}
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;