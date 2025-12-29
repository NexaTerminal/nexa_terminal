import React, { useState, useEffect } from 'react';
import ApiService from '../../../services/api';
import UploadDocumentModal from './UploadDocumentModal';
import styles from '../../../styles/terminal/admin/ManageChatbot.module.css';

/**
 * Document Management Component
 * Manages documents in the Qdrant vector database for the chatbot
 */
const DocumentManagement = ({ showMessage, setLoading }) => {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDocuments();
    loadStats();
  }, []);

  const loadDocuments = async () => {
    try {
      setLocalLoading(true);
      console.log('🔍 [FRONTEND] Calling ApiService.getChatbotDocuments()...');
      const response = await ApiService.getChatbotDocuments();
      console.log('🔍 [FRONTEND] API Response:', response);

      if (response.success) {
        const docs = response.data?.documents || response.documents || [];
        console.log('✅ [FRONTEND] Documents loaded:', docs.length);
        setDocuments(docs);
      } else {
        console.error('❌ [FRONTEND] API returned success: false');
        showMessage('error', 'Неуспешно вчитување на документи');
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Error loading documents:', error);
      showMessage('error', error.message || 'Грешка при вчитување на документи');
    } finally {
      setLocalLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await ApiService.getChatbotDocumentStats();

      if (response.success) {
        const statsData = response.data?.stats || response.stats;
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    showMessage('success', 'Документот е успешно додаден и процесиран!');
    loadDocuments();
    loadStats();
  };

  const handleDeleteClick = (documentName) => {
    setDeleteConfirm(documentName);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      setLoading(true);
      const response = await ApiService.deleteChatbotDocument(deleteConfirm);

      if (response.success) {
        showMessage('success', `Документот "${deleteConfirm}" е успешно избришан`);
        setDeleteConfirm(null);
        loadDocuments();
        loadStats();
      } else {
        showMessage('error', 'Неуспешно бришење на документ');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      showMessage('error', error.message || 'Грешка при бришење на документ');
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

  const formatLastUpdated = (dateString) => {
    if (!dateString) return 'Никогаш';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Штотуку';
    if (diffMins < 60) return `Пред ${diffMins} мин`;
    if (diffHours < 24) return `Пред ${diffHours} час${diffHours > 1 ? 'а' : ''}`;
    if (diffDays < 7) return `Пред ${diffDays} ден${diffDays > 1 ? 'а' : ''}`;

    return date.toLocaleDateString('mk-MK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filter documents based on search query
  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return doc.documentName?.toLowerCase().includes(query);
  });

  if (localLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Вчитување документи...</p>
      </div>
    );
  }

  return (
    <div className={styles.documentManagement}>
      {/* Statistics Cards - AI Learning Progress */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📚</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Вкупно документи</div>
              <div className={styles.statValue}>{stats.totalDocuments || documents.length}</div>
              <div className={styles.statHint}>Обучени извори</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🧩</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Вкупно парчиња</div>
              <div className={styles.statValue}>{stats.totalChunks || 0}</div>
              <div className={styles.statHint}>Векторски записи</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Просек парчиња/документ</div>
              <div className={styles.statValue}>{stats.averageChunksPerDocument || 0}</div>
              <div className={styles.statHint}>Детаљност на обука</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🕒</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Последно ажурирање</div>
              <div className={styles.statValueSmall}>
                {formatLastUpdated(stats.lastUpdated)}
              </div>
              <div className={styles.statHint}>AI статус на база</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className={styles.actionBar}>
        <h2>Документи во базата</h2>
        <button
          className={styles.primaryButton}
          onClick={() => setShowUploadModal(true)}
        >
          <span className={styles.buttonIcon}>📤</span>
          Додади нов документ
        </button>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Пребарај документи по име..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className={styles.searchClear}
              onClick={() => setSearchQuery('')}
              title="Исчисти пребарување"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <div className={styles.searchResults}>
            Пронајдени {filteredDocuments.length} од {documents.length} документи
          </div>
        )}
      </div>

      {/* Documents Table */}
      {documents.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📭</div>
          <h3>Нема документи</h3>
          <p>Сè уште нема додадено документи во базата. Додадете PDF или DOCX документ за да започнете.</p>
          <button
            className={styles.primaryButton}
            onClick={() => setShowUploadModal(true)}
          >
            Додади прв документ
          </button>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Име на документ</th>
                <th>Број на парчиња</th>
                <th>Број на страници</th>
                <th>Датум на процесирање</th>
                <th>Акции</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc, index) => (
                <tr key={index}>
                  <td className={styles.documentName}>
                    <span className={styles.fileIcon}>
                      {doc.documentName?.endsWith('.pdf') ? '📕' : '📘'}
                    </span>
                    {doc.documentName}
                  </td>
                  <td className={styles.centered}>{doc.chunkCount || 0}</td>
                  <td className={styles.centered}>{doc.pageCount || 'N/A'}</td>
                  <td className={styles.dateCell}>{formatDate(doc.uploadedAt)}</td>
                  <td>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteClick(doc.documentName)}
                      title="Избриши документ"
                    >
                      🗑️ Избриши
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadDocumentModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
          showMessage={showMessage}
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
              <p>Дали сте сигурни дека сакате да го избришете документот:</p>
              <div className={styles.confirmFileName}>
                <strong>{deleteConfirm}</strong>
              </div>
              <p className={styles.warningText}>
                Ова ќе ги избрише сите парчиња (chunks) поврзани со овој документ од векторската база.
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

export default DocumentManagement;
