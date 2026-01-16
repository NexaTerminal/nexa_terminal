import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from '../../../styles/terminal/admin/ManageNewsletterSubscribers.module.css';
import axios from 'axios';
import ApiService from '../../../services/api';

const ManageNewsletterSubscribers = () => {
  const { token } = useAuth();
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    unsubscribed: 0
  });

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('subscribedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Selection & Modals
  const [selectedSubscribers, setSelectedSubscribers] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState(null);

  // CSV Import
  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Add/Edit Form
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: ''
  });

  // Fetch subscribers with filters
  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        status: statusFilter,
        sortBy,
        sortOrder
      });

      const response = await axios.get(`/api/newsletter/subscribers?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSubscribers(response.data.subscribers);
        setTotalPages(response.data.pagination.pages);
        setStats(response.data.stats);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при вчитување на претплатници');
      console.error('Error fetching subscribers:', err);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, pageSize, searchTerm, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  // Handle subscriber selection
  const toggleSubscriberSelection = (subscriberId) => {
    const newSelected = new Set(selectedSubscribers);
    if (newSelected.has(subscriberId)) {
      newSelected.delete(subscriberId);
    } else {
      newSelected.add(subscriberId);
    }
    setSelectedSubscribers(newSelected);
  };

  const selectAllSubscribers = () => {
    if (selectedSubscribers.size === subscribers.length) {
      setSelectedSubscribers(new Set());
    } else {
      setSelectedSubscribers(new Set(subscribers.map(sub => sub._id)));
    }
  };

  // Add subscriber
  const handleAddSubscriber = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const csrfToken = await ApiService.getCSRFToken();
      const headers = {
        Authorization: `Bearer ${token}`
      };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await axios.post('/api/newsletter/subscribers', formData, {
        headers
      });

      if (response.data.success) {
        setSuccess('Претплатникот е успешно додаден');
        setShowAddModal(false);
        setFormData({ email: '', firstName: '', lastName: '' });
        fetchSubscribers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при додавање на претплатник');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Edit subscriber
  const handleEditSubscriber = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const csrfToken = await ApiService.getCSRFToken();
      const headers = {
        Authorization: `Bearer ${token}`
      };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await axios.patch(
        `/api/newsletter/subscribers/${editingSubscriber._id}`,
        formData,
        { headers }
      );

      if (response.data.success) {
        setSuccess('Претплатникот е успешно ажуриран');
        setShowEditModal(false);
        setEditingSubscriber(null);
        setFormData({ email: '', firstName: '', lastName: '' });
        fetchSubscribers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при ажурирање на претплатник');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Delete subscriber
  const handleDeleteSubscriber = async (subscriberId) => {
    if (!window.confirm('Дали сте сигурни дека сакате да го избришете претплатникот?')) {
      return;
    }

    try {
      const csrfToken = await ApiService.getCSRFToken();
      const headers = {
        Authorization: `Bearer ${token}`
      };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await axios.delete(`/api/newsletter/subscribers/${subscriberId}`, {
        headers
      });

      if (response.data.success) {
        setSuccess('Претплатникот е успешно избришан');
        fetchSubscribers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при бришење на претплатник');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!window.confirm(`Дали сте сигурни дека сакате да ги избришете ${selectedSubscribers.size} претплатник(и)?`)) {
      return;
    }

    try {
      const csrfToken = await ApiService.getCSRFToken();
      const headers = {
        Authorization: `Bearer ${token}`
      };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await axios.post(
        '/api/newsletter/subscribers/bulk-delete',
        { subscriberIds: Array.from(selectedSubscribers) },
        { headers }
      );

      if (response.data.success) {
        setSuccess(`${response.data.deletedCount} претплатник(и) се успешно избришани`);
        setSelectedSubscribers(new Set());
        fetchSubscribers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при групно бришење');
      setTimeout(() => setError(''), 3000);
    }
  };

  // CSV Import
  const handleCsvImport = async (e) => {
    e.preventDefault();

    if (!csvFile) {
      setError('Ве молиме изберете CSV датотека');
      return;
    }

    setImporting(true);
    setError('');
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', csvFile);

      const csrfToken = await ApiService.getCSRFToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await axios.post(
        '/api/newsletter/subscribers/import-csv',
        formData,
        { headers }
      );

      if (response.data.success) {
        setImportResult(response.data.result);
        setSuccess(`Успешно увезени ${response.data.result.imported} претплатници`);
        setCsvFile(null);
        fetchSubscribers();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при увоз на CSV');
    } finally {
      setImporting(false);
    }
  };

  // Export CSV
  const handleExport = async () => {
    try {
      const response = await axios.get('/api/newsletter/subscribers/export-csv', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Грешка при извоз на CSV');
    }
  };

  // Open edit modal
  const openEditModal = (subscriber) => {
    setEditingSubscriber(subscriber);
    setFormData({
      email: subscriber.email,
      firstName: subscriber.firstName || '',
      lastName: subscriber.lastName || ''
    });
    setShowEditModal(true);
  };

  if (loading && subscribers.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Вчитување на претплатници...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Претплатници на билтен</h1>
          <div className={styles.statsCards}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Вкупно</span>
              <span className={styles.statValue}>{stats.total}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Активни</span>
              <span className={`${styles.statValue} ${styles.active}`}>{stats.active}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Отпишани</span>
              <span className={`${styles.statValue} ${styles.unsubscribed}`}>{stats.unsubscribed}</span>
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={() => setShowAddModal(true)}
            className={styles.addButton}
          >
            ➕ Додади претплатник
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className={styles.importButton}
          >
            📥 Увези CSV
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
            placeholder="Пребарај по email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <button
            onClick={fetchSubscribers}
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
            <option value="active">Активни</option>
            <option value="unsubscribed">Отпишани</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value))}
            className={styles.filterSelect}
          >
            <option value={20}>20 по страница</option>
            <option value={50}>50 по страница</option>
            <option value={100}>100 по страница</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedSubscribers.size > 0 && (
        <div className={styles.bulkActions}>
          <span className={styles.selectionCount}>
            {selectedSubscribers.size} претплатник{selectedSubscribers.size !== 1 ? 'и' : ''} избрани
          </span>
          <div className={styles.bulkButtons}>
            <button
              onClick={handleBulkDelete}
              className={styles.deleteButton}
            >
              🗑️ Избриши избрани
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedSubscribers.size === subscribers.length && subscribers.length > 0}
                  onChange={selectAllSubscribers}
                />
              </th>
              <th>Email</th>
              <th>Име</th>
              <th>Презиме</th>
              <th>Статус</th>
              <th>Извор</th>
              <th>Претплатен на</th>
              <th>Акции</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map(subscriber => (
              <tr key={subscriber._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedSubscribers.has(subscriber._id)}
                    onChange={() => toggleSubscriberSelection(subscriber._id)}
                  />
                </td>
                <td>{subscriber.email}</td>
                <td>{subscriber.firstName || '-'}</td>
                <td>{subscriber.lastName || '-'}</td>
                <td>
                  <span className={`${styles.badge} ${styles[subscriber.status]}`}>
                    {subscriber.status === 'active' ? 'Активен' : 'Отпишан'}
                  </span>
                </td>
                <td>{subscriber.source === 'manual' ? 'Рачно' : 'CSV увоз'}</td>
                <td>{new Date(subscriber.subscribedAt).toLocaleDateString('mk-MK')}</td>
                <td>
                  <div className={styles.actionButtons}>
                    <button
                      onClick={() => openEditModal(subscriber)}
                      className={styles.editButton}
                      title="Уреди"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteSubscriber(subscriber._id)}
                      className={styles.deleteButtonSmall}
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

        {subscribers.length === 0 && !loading && (
          <div className={styles.emptyState}>
            <p>Нема пронајдено претплатници</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={styles.pageButton}
          >
            ‹ Претходна
          </button>
          <span className={styles.pageInfo}>
            Страница {currentPage} од {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={styles.pageButton}
          >
            Следна ›
          </button>
        </div>
      )}

      {/* Add Subscriber Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Додади нов претплатник</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddSubscriber} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Email адреса *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="primer@example.com"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Име</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Марко"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Презиме</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Марковски"
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={styles.cancelButton}
                >
                  Откажи
                </button>
                <button type="submit" className={styles.submitButton}>
                  Додади
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subscriber Modal */}
      {showEditModal && editingSubscriber && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Уреди претплатник</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubscriber} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Email адреса *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Име</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Презиме</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className={styles.cancelButton}
                >
                  Откажи
                </button>
                <button type="submit" className={styles.submitButton}>
                  Зачувај
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowImportModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Увези претплатници од CSV</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCsvImport} className={styles.form}>
              <div className={styles.formGroup}>
                <label>CSV датотека</label>
                <p className={styles.helpText}>
                  Форматот треба да биде: email,firstName,lastName
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  required
                />
              </div>

              {importResult && (
                <div className={styles.importResults}>
                  <h3>Резултати од увоз:</h3>
                  <p>✅ Увезени: {importResult.imported}</p>
                  <p>⚠️ Дупликати: {importResult.duplicates}</p>
                  {importResult.errors.length > 0 && (
                    <div className={styles.importErrors}>
                      <h4>Грешки:</h4>
                      {importResult.errors.map((err, idx) => (
                        <p key={idx}>{err.email}: {err.error}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportResult(null);
                    setCsvFile(null);
                  }}
                  className={styles.cancelButton}
                >
                  Затвори
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={importing}
                >
                  {importing ? 'Увезување...' : 'Увези'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageNewsletterSubscribers;
