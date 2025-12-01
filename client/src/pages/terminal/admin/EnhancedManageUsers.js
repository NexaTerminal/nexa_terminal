import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from '../../../styles/terminal/admin/EnhancedManageUsers.module.css';
import UserDetailModal from '../../../components/admin/UserDetailModal';
import BulkActionModal from '../../../components/admin/BulkActionModal';
import SuspendUserModal from '../../../components/admin/SuspendUserModal';
import UserAnalytics from '../../../components/admin/UserAnalytics';
import LiveMonitoringDashboard from '../../../components/admin/LiveMonitoringDashboard';
import axios from 'axios';

const EnhancedManageUsers = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Selection & Modals
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState(null);
  
  // Analytics & Monitoring
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showLiveMonitoring, setShowLiveMonitoring] = useState(false);

  // Fetch users with filters
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        status: statusFilter,
        verified: verificationFilter,
        sortBy,
        sortOrder
      });

      const response = await axios.get(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUsers(response.data.data);
        setTotalPages(response.data.pagination.pages);
        setTotalUsers(response.data.pagination.total);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, pageSize, searchTerm, statusFilter, verificationFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle user selection
  const toggleUserSelection = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const selectAllUsers = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(user => user._id)));
    }
  };

  // User actions
  const handleUserAction = async (userId, action, params = {}) => {
    try {
      setError('');
      let endpoint = '';
      let method = 'POST';
      let data = params;

      switch (action) {
        case 'suspend':
          endpoint = `/api/admin/users/${userId}/suspend`;
          break;
        case 'unsuspend':
          endpoint = `/api/admin/users/${userId}/unsuspend`;
          break;
        case 'updateRole':
          endpoint = `/api/admin/users/${userId}/role`;
          method = 'PATCH';
          break;
        case 'updateStatus':
          endpoint = `/api/admin/users/${userId}/status`;
          method = 'PATCH';
          break;
        case 'delete':
          endpoint = `/api/admin/users/${userId}`;
          method = 'DELETE';
          break;
        default:
          throw new Error('Invalid action');
      }

      const response = await axios({
        method,
        url: endpoint,
        data,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Bulk actions
  const handleBulkAction = async (action, params = {}) => {
    try {
      const response = await axios.post('/api/admin/bulk-action', {
        action,
        userIds: Array.from(selectedUsers),
        params
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess(`${response.data.message} (${response.data.modifiedCount} users affected)`);
        setSelectedUsers(new Set());
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Bulk action failed');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Export data
  const handleExport = async () => {
    try {
      const response = await axios.get('/api/admin/export/users?format=csv', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Export failed');
    }
  };

  // Render user status badge
  const renderStatusBadge = (user) => {
    if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
      return <span className={`${styles.badge} ${styles.suspended}`}>Suspended</span>;
    } else if (!user.isActive) {
      return <span className={`${styles.badge} ${styles.inactive}`}>Inactive</span>;
    } else {
      return <span className={`${styles.badge} ${styles.active}`}>Active</span>;
    }
  };

  // Render verification badge
  const renderVerificationBadge = (user) => {
    if (user.isVerified && user.emailVerified) {
      return <span className={`${styles.badge} ${styles.verified}`}>✅ Verified</span>;
    } else if (user.emailVerified) {
      return <span className={`${styles.badge} ${styles.partial}`}>📧 Email Only</span>;
    } else {
      return <span className={`${styles.badge} ${styles.unverified}`}>❌ Unverified</span>;
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Управување со корисници</h1>
          <p>{totalUsers} вкупно корисници</p>
        </div>
        <div className={styles.headerActions}>
          <button 
            onClick={() => setShowAnalytics(true)}
            className={styles.analyticsButton}
          >
            📊 Аналитика
          </button>
          <button 
            onClick={() => setShowLiveMonitoring(true)}
            className={styles.analyticsButton}
          >
            🔴 Следење во живо
          </button>
          <button 
            onClick={handleExport}
            className={styles.exportButton}
          >
            📤 Извези CSV
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}
      
      {success && (
        <div className={styles.successMessage}>
          <span className={styles.successIcon}>✅</span>
          {success}
        </div>
      )}

      {/* Filters & Search */}
      <div className={styles.filtersSection}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Пребарај корисници, компании, е-пошти..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <button 
            onClick={fetchUsers}
            className={styles.searchButton}
          >
            🔍
          </button>
        </div>

        <div className={styles.filters}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Сите статуси</option>
            <option value="active">Активен</option>
            <option value="inactive">Неактивен</option>
            <option value="suspended">Суспендиран</option>
          </select>

          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Сите верификации</option>
            <option value="verified">Верификуван</option>
            <option value="unverified">Неверификуван</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value))}
            className={styles.filterSelect}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className={styles.bulkActions}>
          <span className={styles.selectionCount}>
            {selectedUsers.size} корисник{selectedUsers.size !== 1 ? 'и' : ''} избрани
          </span>
          <div className={styles.bulkButtons}>
            <button 
              onClick={() => setShowBulkActions(true)}
              className={styles.bulkActionButton}
            >
              Групни акции
            </button>
            <button 
              onClick={() => setSelectedUsers(new Set())}
              className={styles.clearSelectionButton}
            >
              Избриши избор
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className={styles.tableContainer}>
        <table className={styles.usersTable}>
          <thead>
            <tr>
              <th className={styles.checkboxColumn}>
                <input
                  type="checkbox"
                  checked={selectedUsers.size === users.length && users.length > 0}
                  onChange={selectAllUsers}
                />
              </th>
              <th>Корисник</th>
              <th>Компанија</th>
              <th>Статус</th>
              <th>Верификација</th>
              <th>Активност (30д)</th>
              <th>Се зачлени</th>
              <th>Акции</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr 
                key={user._id} 
                className={selectedUsers.has(user._id) ? styles.selectedRow : ''}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user._id)}
                    onChange={() => toggleUserSelection(user._id)}
                  />
                </td>
                
                <td className={styles.userCell}>
                  <div className={styles.userInfo}>
                    <div className={styles.userAvatar}>
                      {(user.companyInfo?.companyName || user.email).charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.userDetails}>
                      <div className={styles.userName}>
                        {user.username || user.email}
                      </div>
                      <div className={styles.userEmail}>
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td>
                  <div className={styles.companyInfo}>
                    <div className={styles.companyName}>
                      {user.companyInfo?.companyName || 'N/A'}
                    </div>
                    {user.companyInfo?.address && (
                      <div className={styles.companyAddress}>
                        {user.companyInfo.address}
                      </div>
                    )}
                  </div>
                </td>
                
                <td>
                  {renderStatusBadge(user)}
                  {user.role === 'admin' && (
                    <span className={`${styles.badge} ${styles.admin}`}>Admin</span>
                  )}
                </td>
                
                <td>
                  {renderVerificationBadge(user)}
                </td>
                
                <td className={styles.analyticsCell}>
                  <div className={styles.analyticsGrid}>
                    <div className={styles.analyticItem}>
                      <span className={styles.analyticValue}>
                        {user.analytics?.logins30d || 0}
                      </span>
                      <span className={styles.analyticLabel}>logins</span>
                    </div>
                    <div className={styles.analyticItem}>
                      <span className={styles.analyticValue}>
                        {user.analytics?.documents30d || 0}
                      </span>
                      <span className={styles.analyticLabel}>docs</span>
                    </div>
                    <div className={styles.analyticItem}>
                      <span className={styles.analyticValue}>
                        {user.analytics?.aiQueries30d || 0}
                      </span>
                      <span className={styles.analyticLabel}>AI</span>
                    </div>
                  </div>
                </td>
                
                <td className={styles.dateCell}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                
                <td className={styles.actionsCell}>
                  <div className={styles.actionButtons}>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserDetail(true);
                      }}
                      className={styles.viewButton}
                      title="View Details"
                    >
                      👁️
                    </button>
                    
                    <select
                      value={user.role}
                      onChange={(e) => handleUserAction(user._id, 'updateRole', { role: e.target.value })}
                      className={styles.roleSelect}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                    
                    {user.suspendedUntil && new Date(user.suspendedUntil) > new Date() ? (
                      <button
                        onClick={() => handleUserAction(user._id, 'unsuspend')}
                        className={styles.unsuspendButton}
                        title="Unsuspend User"
                      >
                        🔓
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setUserToSuspend(user);
                          setShowSuspendModal(true);
                        }}
                        className={styles.suspendButton}
                        title="Suspend User"
                      >
                        🚫
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleUserAction(user._id, 'updateStatus', { isActive: !user.isActive })}
                      className={user.isActive ? styles.deactivateButton : styles.activateButton}
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {user.isActive ? '⏸️' : '▶️'}
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`⚠️ WARNING: Are you sure you want to PERMANENTLY DELETE this user?\n\nUser: ${user.username || user.email}\nEmail: ${user.email}\n\nThis action CANNOT be undone!`)) {
                          handleUserAction(user._id, 'delete');
                        }
                      }}
                      className={styles.deleteButton}
                      title="Delete User Permanently"
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
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            ← Претходно
          </button>
          
          <div className={styles.pageInfo}>
            <span>Страница {currentPage} од {totalPages}</span>
            <span className={styles.totalCount}>({totalUsers} вкупно корисници)</span>
          </div>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            Следно →
          </button>
        </div>
      )}

      {/* Loading overlay for actions */}
      {loading && users.length > 0 && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}

      {/* Modals */}
      {showUserDetail && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setShowUserDetail(false);
            setSelectedUser(null);
          }}
          onUserUpdate={fetchUsers}
        />
      )}

      {showBulkActions && (
        <BulkActionModal
          selectedUsers={Array.from(selectedUsers)}
          onClose={() => setShowBulkActions(false)}
          onAction={handleBulkAction}
        />
      )}

      {showSuspendModal && userToSuspend && (
        <SuspendUserModal
          user={userToSuspend}
          onClose={() => {
            setShowSuspendModal(false);
            setUserToSuspend(null);
          }}
          onConfirm={(params) => {
            handleUserAction(userToSuspend._id, 'suspend', params);
            setShowSuspendModal(false);
            setUserToSuspend(null);
          }}
        />
      )}

      {showAnalytics && (
        <UserAnalytics
          isOpen={showAnalytics}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {showLiveMonitoring && (
        <LiveMonitoringDashboard
          isOpen={showLiveMonitoring}
          onClose={() => setShowLiveMonitoring(false)}
        />
      )}
    </div>
  );
};

export default EnhancedManageUsers;