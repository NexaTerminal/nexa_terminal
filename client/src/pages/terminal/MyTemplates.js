import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import ProfileReminderBanner from '../../components/terminal/ProfileReminderBanner';
import { listTemplates, deleteTemplate, duplicateTemplate, getCategories, publishTemplate, unpublishTemplate } from '../../services/customTemplateApi';
import styles from '../../styles/terminal/MyTemplates.module.css';

const MyTemplates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [duplicatingId, setDuplicatingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });

  // Category filter
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchTemplates();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [selectedCategory]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await listTemplates(selectedCategory || undefined);
      setTemplates(data);
    } catch (err) {
      setError('Грешка при вчитување на шаблоните');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (err) { /* ignore */ }
  };

  const openDeleteModal = (e, id, name) => {
    e.stopPropagation();
    setDeleteModal({ open: true, id, name });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ open: false, id: null, name: '' });
  };

  const confirmDelete = async () => {
    const { id } = deleteModal;
    closeDeleteModal();

    try {
      setDeletingId(id);
      await deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      setError('Грешка при бришење на шаблонот');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (e, id) => {
    e.stopPropagation();
    try {
      setDuplicatingId(id);
      await duplicateTemplate(id);
      await fetchTemplates();
    } catch (err) {
      setError('Грешка при дуплирање на шаблонот');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handlePublishToggle = async (e, template) => {
    e.stopPropagation();
    try {
      if (template.isPublic) {
        await unpublishTemplate(template._id);
      } else {
        await publishTemplate(template._id);
      }
      await fetchTemplates();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCardClick = (templateId) => {
    navigate(`/terminal/my-templates/${templateId}/fill`);
  };

  const handleEditClick = (e, templateId) => {
    e.stopPropagation();
    navigate(`/terminal/my-templates/${templateId}/edit`);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('mk-MK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div>
      <Header isTerminal={true} />

      <div className={styles.dashboardLayout}>
        <Sidebar />

        <main className={styles.dashboardMain}>
          <ProfileReminderBanner />

          <div className={styles.pageHeader}>
            <div className={styles.headerLeft}>
              <h1 className={styles.pageTitle}>Мои шаблони</h1>
              <p className={styles.pageSubtitle}>
                Прикачете ваш .docx документ и креирајте шаблон за автоматско генерирање
              </p>
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.secondaryButton}
                onClick={() => navigate('/terminal/my-templates/history')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Историја
              </button>
              <button
                className={styles.createButton}
                onClick={() => navigate('/terminal/my-templates/new')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Нов шаблон
              </button>
            </div>
          </div>

          {/* Category filter pills */}
          {categories.length > 0 && (
            <div className={styles.categoryFilter}>
              <button
                className={`${styles.categoryPill} ${!selectedCategory ? styles.categoryPillActive : ''}`}
                onClick={() => setSelectedCategory('')}
              >
                Сите
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`${styles.categoryPill} ${selectedCategory === cat ? styles.categoryPillActive : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

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
          ) : templates.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <h2 className={styles.emptyTitle}>Немате креирано шаблони</h2>
              <p className={styles.emptyText}>
                Прикачете .docx документ, означете ги динамичните полиња, и користете го шаблонот за автоматско генерирање документи.
              </p>
              <button
                className={styles.createButton}
                onClick={() => navigate('/terminal/my-templates/new')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Креирај прв шаблон
              </button>
            </div>
          ) : (
            <div className={styles.templateGrid}>
              {templates.map(template => (
                <div
                  key={template._id}
                  className={styles.templateCard}
                  onClick={() => handleCardClick(template._id)}
                >
                  {/* Badges row */}
                  <div className={styles.cardBadges}>
                    {template.category && (
                      <span className={styles.categoryBadge}>{template.category}</span>
                    )}
                    {template.isPublic && (
                      <span className={styles.publicBadge}>Објавен</span>
                    )}
                  </div>

                  <h3 className={styles.cardTitle}>{template.name}</h3>
                  {template.description && (
                    <p className={styles.cardDescription}>{template.description}</p>
                  )}

                  <div className={styles.cardMeta}>
                    <span className={styles.metaItem}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="9" y1="21" x2="9" y2="9" />
                      </svg>
                      {template.fields?.length || 0} полиња
                    </span>
                    {template.generationCount > 0 && (
                      <span className={styles.metaItem}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 6 2 18 2 18 9" />
                          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                          <rect x="6" y="14" width="12" height="8" />
                        </svg>
                        {template.generationCount}x
                      </span>
                    )}
                    <span className={styles.metaItem}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {formatDate(template.createdAt)}
                    </span>
                  </div>

                  {/* Inline action bar */}
                  <div className={styles.cardFooter}>
                    <span className={styles.cardCta}>
                      Генерирај документ
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.iconBtn}
                        onClick={(e) => handleEditClick(e, template._id)}
                        title="Уреди"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className={styles.iconBtn}
                        onClick={(e) => handleDuplicate(e, template._id)}
                        disabled={duplicatingId === template._id}
                        title="Дуплирај"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                      <button
                        className={`${styles.iconBtn} ${template.isPublic ? styles.iconBtnActive : ''}`}
                        onClick={(e) => handlePublishToggle(e, template)}
                        title={template.isPublic ? 'Повлечи од маркетплејс' : 'Објави на маркетплејс'}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="18" cy="5" r="3" />
                          <circle cx="6" cy="12" r="3" />
                          <circle cx="18" cy="19" r="3" />
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={(e) => openDeleteModal(e, template._id, template.name)}
                        disabled={deletingId === template._id}
                        title="Избриши"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {deleteModal.open && (
        <div className={styles.modalOverlay} onClick={closeDeleteModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h3 className={styles.modalTitle}>Избриши шаблон</h3>
            <p className={styles.modalText}>
              Дали сте сигурни дека сакате да го избришете <strong>"{deleteModal.name}"</strong>? Оваа акција не може да се поврати.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={closeDeleteModal}>
                Откажи
              </button>
              <button className={styles.modalConfirm} onClick={confirmDelete}>
                Избриши
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTemplates;
