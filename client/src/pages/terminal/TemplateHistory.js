import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import { getHistory, downloadGeneratedDocument, deleteHistoryRecord } from '../../services/customTemplateApi';
import styles from '../../styles/terminal/TemplateHistory.module.css';

const TemplateHistory = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getHistory(page, 20);
      setRecords(data.records);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError('Грешка при вчитување на историјата');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (record) => {
    try {
      setDownloadingId(record._id);
      const blob = await downloadGeneratedDocument(record._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = record.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Грешка при преземање');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (recordId) => {
    try {
      await deleteHistoryRecord(recordId);
      setRecords(prev => prev.filter(r => r._id !== recordId));
    } catch (err) {
      setError('Грешка при бришење');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('mk-MK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div>
      <Header isTerminal={true} />

      <div className={styles.dashboardLayout}>
        <Sidebar />

        <main className={styles.dashboardMain}>
          <button
            className={styles.backLink}
            onClick={() => navigate('/terminal/my-templates')}
          >
            ← Назад кон шаблони
          </button>

          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Историја на генерирани документи</h1>
            <p className={styles.pageSubtitle}>
              Преглед и преземање на претходно генерирани документи
            </p>
          </div>

          {error && (
            <div className={styles.errorBanner}>
              {error}
              <button onClick={() => setError('')} className={styles.errorDismiss}>×</button>
            </div>
          )}

          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Вчитување...</p>
            </div>
          ) : records.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Нема генерирани документи</p>
            </div>
          ) : (
            <>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Шаблон</th>
                      <th>Датотека</th>
                      <th>Големина</th>
                      <th>Датум</th>
                      <th>Акции</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map(record => (
                      <tr key={record._id}>
                        <td className={styles.templateName}>{record.templateName}</td>
                        <td className={styles.fileName}>{record.fileName}</td>
                        <td>{formatSize(record.fileSize)}</td>
                        <td>{formatDate(record.generatedAt)}</td>
                        <td>
                          <div className={styles.tableActions}>
                            <button
                              className={styles.downloadBtn}
                              onClick={() => handleDownload(record)}
                              disabled={downloadingId === record._id}
                            >
                              {downloadingId === record._id ? '...' : 'Преземи'}
                            </button>
                            <button
                              className={styles.deleteBtn}
                              onClick={() => handleDelete(record._id)}
                            >
                              Избриши
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={styles.pageBtn}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    ← Претходна
                  </button>
                  <span className={styles.pageInfo}>
                    Страна {page} од {totalPages}
                  </span>
                  <button
                    className={styles.pageBtn}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Следна →
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default TemplateHistory;
