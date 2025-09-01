import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/admin/UserAnalytics.module.css';
import axios from 'axios';

const UserAnalytics = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState(30);

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen, timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/analytics?days=${timeframe}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch platform analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toString() || '0';
  };

  const renderLoadingState = () => (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <p>Loading analytics...</p>
    </div>
  );

  const renderErrorState = () => (
    <div className={styles.errorContainer}>
      <span className={styles.errorIcon}>⚠️</span>
      <p>{error}</p>
      <button onClick={fetchAnalytics} className={styles.retryButton}>
        Try Again
      </button>
    </div>
  );

  const renderAnalytics = () => (
    <div className={styles.analyticsContent}>
      <div className={styles.analyticsHeader}>
        <h3>Platform Analytics</h3>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(parseInt(e.target.value))}
          className={styles.timeframeSelect}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </select>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>👥</div>
          <div className={styles.metricValue}>{formatNumber(analytics.totalUsers)}</div>
          <div className={styles.metricLabel}>Total Users</div>
          <div className={styles.metricChange}>
            +{analytics.newUsers} new users
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>🔐</div>
          <div className={styles.metricValue}>{formatNumber(analytics.totalLogins)}</div>
          <div className={styles.metricLabel}>Total Logins</div>
          <div className={styles.metricChange}>
            {analytics.avgDailyLogins} avg daily
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>📄</div>
          <div className={styles.metricValue}>{formatNumber(analytics.totalDocuments)}</div>
          <div className={styles.metricLabel}>Documents Generated</div>
          <div className={styles.metricChange}>
            {analytics.avgDailyDocuments} avg daily
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>🤖</div>
          <div className={styles.metricValue}>{formatNumber(analytics.totalAiQueries)}</div>
          <div className={styles.metricLabel}>AI Queries</div>
          <div className={styles.metricChange}>
            {analytics.avgDailyAiQueries} avg daily
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>📱</div>
          <div className={styles.metricValue}>{formatNumber(analytics.totalSocialPosts)}</div>
          <div className={styles.metricLabel}>Social Posts</div>
          <div className={styles.metricChange}>
            {analytics.avgDailySocialPosts} avg daily
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>✅</div>
          <div className={styles.metricValue}>{analytics.verifiedUsers}</div>
          <div className={styles.metricLabel}>Verified Users</div>
          <div className={styles.metricChange}>
            {((analytics.verifiedUsers / analytics.totalUsers) * 100).toFixed(1)}% verified
          </div>
        </div>
      </div>

      <div className={styles.chartSection}>
        <h4>User Activity Breakdown</h4>
        <div className={styles.activityBreakdown}>
          <div className={styles.activityItem}>
            <span className={styles.activityLabel}>Active Users</span>
            <div className={styles.activityBar}>
              <div 
                className={styles.activityProgress}
                style={{ width: `${(analytics.activeUsers / analytics.totalUsers) * 100}%` }}
              ></div>
            </div>
            <span className={styles.activityValue}>{analytics.activeUsers}</span>
          </div>

          <div className={styles.activityItem}>
            <span className={styles.activityLabel}>Suspended Users</span>
            <div className={styles.activityBar}>
              <div 
                className={`${styles.activityProgress} ${styles.suspended}`}
                style={{ width: `${(analytics.suspendedUsers / analytics.totalUsers) * 100}%` }}
              ></div>
            </div>
            <span className={styles.activityValue}>{analytics.suspendedUsers}</span>
          </div>

          <div className={styles.activityItem}>
            <span className={styles.activityLabel}>Admin Users</span>
            <div className={styles.activityBar}>
              <div 
                className={`${styles.activityProgress} ${styles.admin}`}
                style={{ width: `${(analytics.adminUsers / analytics.totalUsers) * 100}%` }}
              ></div>
            </div>
            <span className={styles.activityValue}>{analytics.adminUsers}</span>
          </div>
        </div>
      </div>

      <div className={styles.topUsersSection}>
        <h4>Most Active Users</h4>
        <div className={styles.topUsersList}>
          {analytics.topUsers?.map((user, index) => (
            <div key={user._id} className={styles.topUserItem}>
              <div className={styles.userRank}>#{index + 1}</div>
              <div className={styles.userAvatar}>
                {(user.companyInfo?.companyName || user.email).charAt(0).toUpperCase()}
              </div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>
                  {user.companyInfo?.companyName || user.email}
                </div>
                <div className={styles.userStats}>
                  {user.totalActivity} total activities
                </div>
              </div>
              <div className={styles.activityScore}>
                {user.totalActivity}
              </div>
            </div>
          )) || <p>No user activity data available</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>📊 Platform Analytics</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {loading && renderLoadingState()}
          {error && !loading && renderErrorState()}
          {analytics && !loading && !error && renderAnalytics()}
        </div>
      </div>
    </div>
  );
};

export default UserAnalytics;