import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import { browsePublicTemplates, clonePublicTemplate, getCategories } from '../../services/customTemplateApi';
import styles from '../../styles/terminal/TemplateMarketplace.module.css';

const TemplateMarketplace = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cloningId, setCloningId] = useState(null);
  const [cloneSuccess, setCloneSuccess] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [page, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (err) { /* ignore */ }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await browsePublicTemplates({
        search: search || undefined,
        category: selectedCategory || undefined,
        page
      });
      setTemplates(data.templates);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError('Грешка при вчитување');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTemplates();
  };

  const handleClone = async (id) => {
    try {
      setCloningId(id);
      await clonePublicTemplate(id);
      setCloneSuccess('Шаблонот е клониран во вашите шаблони');
      setTimeout(() => setCloneSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setCloningId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('mk-MK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div>
      <Header isTerminal={true} />

      <div className={styles.dashboardLayout}>
        <Sidebar />

        <main className={styles.dashboardMain}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Маркетплејс на шаблони</h1>
            <p className={styles.pageSubtitle}>
              Прегледајте и клонирајте шаблони споделени од други корисници
            </p>
          </div>

          {/* Search */}
          <form className={styles.searchBar} onSubmit={handleSearch}>
            <input
              type="text"
              className={styles.searchInput}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Пребарај шаблони..."
            />
            <button type="submit" className={styles.searchButton}>Пребарај</button>
          </form>

          {/* Category pills */}
          <div className={styles.categoryFilter}>
            <button
              className={`${styles.categoryPill} ${!selectedCategory ? styles.categoryPillActive : ''}`}
              onClick={() => { setSelectedCategory(''); setPage(1); }}
            >
              Сите
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={`${styles.categoryPill} ${selectedCategory === cat ? styles.categoryPillActive : ''}`}
                onClick={() => { setSelectedCategory(cat); setPage(1); }}
              >
                {cat}
              </button>
            ))}
          </div>

          {error && (
            <div className={styles.errorBanner}>
              {error}
              <button onClick={() => setError('')} className={styles.errorDismiss}>×</button>
            </div>
          )}

          {cloneSuccess && (
            <div className={styles.successBanner}>
              {cloneSuccess}
              <button
                className={styles.goToTemplates}
                onClick={() => navigate('/terminal/my-templates')}
              >
                Кон мои шаблони →
              </button>
            </div>
          )}

          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Вчитување...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Нема објавени шаблони</p>
            </div>
          ) : (
            <>
              <div className={styles.templateGrid}>
                {templates.map(template => (
                  <div key={template._id} className={styles.templateCard}>
                    <h3 className={styles.cardTitle}>{template.name}</h3>
                    {template.description && (
                      <p className={styles.cardDescription}>{template.description}</p>
                    )}

                    <div className={styles.cardMeta}>
                      {template.publisherName && (
                        <span className={styles.publisher}>{template.publisherName}</span>
                      )}
                      {template.category && (
                        <span className={styles.categoryBadge}>{template.category}</span>
                      )}
                    </div>

                    <div className={styles.cardStats}>
                      <span>{template.fields?.length || 0} полиња</span>
                      <span>{template.cloneCount || 0} клонирања</span>
                      {template.publishedAt && (
                        <span>{formatDate(template.publishedAt)}</span>
                      )}
                    </div>

                    <button
                      className={styles.cloneButton}
                      onClick={() => handleClone(template._id)}
                      disabled={cloningId === template._id}
                    >
                      {cloningId === template._id ? 'Се клонира...' : 'Клонирај'}
                    </button>
                  </div>
                ))}
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

export default TemplateMarketplace;
