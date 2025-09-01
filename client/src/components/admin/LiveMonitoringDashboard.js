import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/admin/LiveMonitoringDashboard.module.css';
import io from 'socket.io-client';
import axios from 'axios';

const LiveMonitoringDashboard = ({ isOpen, onClose }) => {
  const { token, user } = useAuth();
  const [systemStatus, setSystemStatus] = useState(null);
  const [liveActivity, setLiveActivity] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (isOpen && user?.role === 'admin') {
      initializeSocket();
      fetchInitialData();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isOpen, user]);

  const initializeSocket = () => {
    socketRef.current = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5001');
    
    socketRef.current.on('connect', () => {
      setConnected(true);
      socketRef.current.emit('joinAdminMonitoring', {
        adminId: user.id,
        token
      });
    });

    socketRef.current.on('disconnect', () => {
      setConnected(false);
    });

    socketRef.current.on('systemStatus', (data) => {
      setSystemStatus(data);
      setActiveSessions(data.activeSessions || []);
      setSystemMetrics(data.systemMetrics || null);
    });

    socketRef.current.on('userLogin', (data) => {
      setLiveActivity(prev => [data, ...prev].slice(0, 50));
    });

    socketRef.current.on('userLogout', (data) => {
      setLiveActivity(prev => [{ ...data, type: 'logout' }, ...prev].slice(0, 50));
      setActiveSessions(prev => prev.filter(session => session.userId !== data.userId));
    });

    socketRef.current.on('securityAlert', (data) => {
      setSecurityAlerts(prev => [data, ...prev].slice(0, 100));
    });

    socketRef.current.on('suspiciousActivity', (data) => {
      setSecurityAlerts(prev => [{
        ...data,
        type: 'suspicious_activity',
        severity: 'high'
      }, ...prev].slice(0, 100));
    });

    socketRef.current.on('userSessionUpdate', (data) => {
      setActiveSessions(prev => {
        const updated = prev.filter(session => session.userId !== data.userId);
        return [{ userId: data.userId, ...data.session }, ...updated];
      });
    });
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const [statusRes, alertsRes, sessionsRes, metricsRes] = await Promise.all([
        axios.get('/api/realtime-admin/system-status', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/realtime-admin/security-alerts', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/realtime-admin/sessions', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/realtime-admin/metrics', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (statusRes.data.success) setSystemStatus(statusRes.data.data);
      if (alertsRes.data.success) setSecurityAlerts(alertsRes.data.data);
      if (sessionsRes.data.success) {
        setActiveSessions(sessionsRes.data.data.sessions);
      }
      if (metricsRes.data.success) setSystemMetrics(metricsRes.data.data);
      
    } catch (err) {
      setError('Failed to fetch monitoring data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const forceDisconnectUser = async (userId, reason = 'Administrative action') => {
    try {
      await axios.post(`/api/realtime-admin/users/${userId}/disconnect`, 
        { reason }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Remove from active sessions
      setActiveSessions(prev => prev.filter(session => session.userId !== userId));
    } catch (error) {
      console.error('Failed to disconnect user:', error);
    }
  };

  const triggerSecurityCheck = async (userId, checkType) => {
    try {
      const response = await axios.post('/api/realtime-admin/security-check', {
        userId,
        checkType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        console.log('Security check result:', response.data.data);
      }
    } catch (error) {
      console.error('Security check failed:', error);
    }
  };

  const formatDuration = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString();
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#dc2626';
      case 'medium': return '#d97706';
      case 'low': return '#16a34a';
      default: return '#64748b';
    }
  };

  const renderOverviewTab = () => (
    <div className={styles.overviewTab}>
      {/* System Status Cards */}
      <div className={styles.statusGrid}>
        <div className={styles.statusCard}>
          <div className={styles.statusIcon}>🔗</div>
          <div className={styles.statusValue}>{connected ? 'Поврзано' : 'Исклучено'}</div>
          <div className={styles.statusLabel}>Врска во реално време</div>
          <div className={`${styles.statusIndicator} ${connected ? styles.online : styles.offline}`}></div>
        </div>

        <div className={styles.statusCard}>
          <div className={styles.statusIcon}>👥</div>
          <div className={styles.statusValue}>{activeSessions.length}</div>
          <div className={styles.statusLabel}>Активни сесии</div>
        </div>

        <div className={styles.statusCard}>
          <div className={styles.statusIcon}>🚨</div>
          <div className={styles.statusValue}>{securityAlerts.length}</div>
          <div className={styles.statusLabel}>Безбедносни предупредувања</div>
        </div>

        {systemMetrics && (
          <>
            <div className={styles.statusCard}>
              <div className={styles.statusIcon}>💾</div>
              <div className={styles.statusValue}>{systemMetrics.memory.used}MB</div>
              <div className={styles.statusLabel}>Користење на меморија</div>
            </div>

            <div className={styles.statusCard}>
              <div className={styles.statusIcon}>⏱️</div>
              <div className={styles.statusValue}>{Math.floor(systemMetrics.uptime / 3600)}h</div>
              <div className={styles.statusLabel}>Работно време на системот</div>
            </div>
          </>
        )}
      </div>

      {/* Recent Activity */}
      <div className={styles.activitySection}>
        <h3>Скорешна активност</h3>
        <div className={styles.activityList}>
          {liveActivity.slice(0, 10).map((activity, index) => (
            <div key={index} className={styles.activityItem}>
              <div className={styles.activityIcon}>
                {activity.type === 'logout' ? '👋' : '🔐'}
              </div>
              <div className={styles.activityDetails}>
                <div className={styles.activityText}>
                  {activity.type === 'logout' ? 'Корисник се одјави' : 'Корисник се најави'}
                </div>
                <div className={styles.activityUser}>
                  {activity.userInfo?.email || activity.userId}
                </div>
              </div>
              <div className={styles.activityTime}>
                {formatTime(activity.timestamp)}
              </div>
            </div>
          ))}
          {liveActivity.length === 0 && (
            <div className={styles.emptyState}>Нема скорешна активност</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSessionsTab = () => (
    <div className={styles.sessionsTab}>
      <div className={styles.sessionsHeader}>
        <h3>Active User Sessions</h3>
        <div className={styles.sessionCount}>
          {activeSessions.filter(s => s.isActive).length} active of {activeSessions.length} total
        </div>
      </div>

      <div className={styles.sessionsList}>
        {activeSessions.map((session, index) => (
          <div key={index} className={`${styles.sessionItem} ${session.isActive ? styles.active : styles.inactive}`}>
            <div className={styles.sessionUser}>
              <div className={styles.sessionAvatar}>
                {session.userInfo?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className={styles.sessionInfo}>
                <div className={styles.sessionName}>
                  {session.userInfo?.companyInfo?.companyName || session.userInfo?.email || session.userId}
                </div>
                <div className={styles.sessionEmail}>
                  {session.userInfo?.email}
                </div>
              </div>
            </div>

            <div className={styles.sessionStats}>
              <div className={styles.sessionStat}>
                <span className={styles.statLabel}>Duration:</span>
                <span className={styles.statValue}>{formatDuration(session.sessionDuration)}</span>
              </div>
              <div className={styles.sessionStat}>
                <span className={styles.statLabel}>Activities:</span>
                <span className={styles.statValue}>{session.activityCount}</span>
              </div>
              <div className={styles.sessionStat}>
                <span className={styles.statLabel}>Last Activity:</span>
                <span className={styles.statValue}>{formatTime(session.lastActivity)}</span>
              </div>
            </div>

            <div className={styles.sessionActions}>
              <button
                onClick={() => triggerSecurityCheck(session.userId, 'session_audit')}
                className={styles.checkButton}
                title="Security Check"
              >
                🔍
              </button>
              <button
                onClick={() => forceDisconnectUser(session.userId)}
                className={styles.disconnectButton}
                title="Force Disconnect"
              >
                🔌
              </button>
            </div>
          </div>
        ))}
        
        {activeSessions.length === 0 && (
          <div className={styles.emptyState}>No active sessions</div>
        )}
      </div>
    </div>
  );

  const renderAlertsTab = () => (
    <div className={styles.alertsTab}>
      <div className={styles.alertsHeader}>
        <h3>Security Alerts</h3>
        <div className={styles.alertsCount}>
          {securityAlerts.filter(a => a.severity === 'high').length} high priority
        </div>
      </div>

      <div className={styles.alertsList}>
        {securityAlerts.map((alert, index) => (
          <div key={index} className={`${styles.alertItem} ${styles[alert.severity]}`}>
            <div className={styles.alertIcon}>
              {alert.severity === 'high' ? '🚨' : alert.severity === 'medium' ? '⚠️' : 'ℹ️'}
            </div>
            <div className={styles.alertContent}>
              <div className={styles.alertTitle}>
                {alert.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Security Alert'}
              </div>
              <div className={styles.alertDescription}>
                {alert.details?.description || JSON.stringify(alert.details) || 'Security incident detected'}
              </div>
              <div className={styles.alertMeta}>
                User: {alert.userId} | {formatTime(alert.timestamp)}
              </div>
            </div>
            <div 
              className={styles.alertSeverity}
              style={{ backgroundColor: getSeverityColor(alert.severity) }}
            >
              {alert.severity?.toUpperCase()}
            </div>
          </div>
        ))}
        
        {securityAlerts.length === 0 && (
          <div className={styles.emptyState}>No security alerts</div>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>🔴 Контролна табла за следење во живо</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.tabNav}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`${styles.tabButton} ${activeTab === 'overview' ? styles.active : ''}`}
          >
            Преглед
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`${styles.tabButton} ${activeTab === 'sessions' ? styles.active : ''}`}
          >
            Сесии ({activeSessions.length})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`${styles.tabButton} ${activeTab === 'alerts' ? styles.active : ''}`}
          >
            Предупредувања ({securityAlerts.length})
          </button>
        </div>

        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Loading monitoring data...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <span className={styles.errorIcon}>⚠️</span>
              <p>{error}</p>
              <button onClick={fetchInitialData} className={styles.retryButton}>
                Try Again
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverviewTab()}
              {activeTab === 'sessions' && renderSessionsTab()}
              {activeTab === 'alerts' && renderAlertsTab()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveMonitoringDashboard;