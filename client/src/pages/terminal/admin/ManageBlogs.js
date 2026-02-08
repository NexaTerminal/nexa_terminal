import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../../services/api';
import styles from '../../../styles/terminal/admin/ManageBlogs.module.css';
import Header from '../../../components/common/Header';
import Footer from '../../../components/common/Footer';
import Sidebar from '../../../components/terminal/Sidebar';
import ProfileRequired from '../../../components/common/ProfileRequired';

const ManageBlogs = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 24,
    total: 0,
    pages: 1
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async (page = 1) => {
    setLoading(true);
    try {
      const response = await ApiService.getBlogs(page, 24);
      if (response && response.blogs) {
        setBlogs(response.blogs);
        setPagination(response.pagination);
      } else {
        setBlogs([]);
      }
      setError('');
    } catch (err) {
      setError('Грешка при вчитување на блогови');
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    fetchBlogs(newPage);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Дали сте сигурни дека сакате да го избришете овој блог?')) {
      try {
        await ApiService.deleteBlog(id);
        setSuccess('Блогот е успешно избришан');
        fetchBlogs();
      } catch (err) {
        setError('Грешка при бришење на блогот');
      }
    }
  };

  const handlePreview = (blog) => {
    const identifier = blog.slug || blog.id;
    window.open(`/blog/${identifier}`, '_blank');
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('mk-MK', options);
  };

  // Filter blogs based on search term
  const filteredBlogs = blogs.filter(blog => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      blog.title?.toLowerCase().includes(search) ||
      blog.excerpt?.toLowerCase().includes(search) ||
      blog.tags?.some(tag => tag.toLowerCase().includes(search)) ||
      blog.category?.toLowerCase().includes(search)
    );
  });

  return (
    <ProfileRequired>
      <div>
        <Header isTerminal={true} />
        
        <div className={styles["dashboard-layout"]}>
          <Sidebar />
          
          <main className={styles["dashboard-main"]}>
            <div className={styles.container}>
              <div className={styles.header}>
                <h1>Управувај со блогови</h1>
                <button
                  onClick={() => navigate('/terminal/admin/blogs/add')}
                  className={styles.addButton}
                >
                  Додади нов блог
                </button>
              </div>

              <div className={styles.searchBar}>
                <input
                  type="text"
                  placeholder="Пребарај по наслов, содржина, тагови..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className={styles.clearSearch}
                  >
                    ✕
                  </button>
                )}
              </div>

            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            {loading ? (
              <div className={styles.loading}>Вчитување...</div>
            ) : (
              <div className={styles.blogList}>
                {filteredBlogs && filteredBlogs.length > 0 ? (
                  <>
                    {filteredBlogs.map(blog => (
                      <div key={blog.id} className={styles.blogCard}>
                        {blog.featuredImage && (
                          <img
                            src={blog.featuredImage}
                            alt={blog.title}
                            className={styles.blogImage}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/placeholder-image.jpg';
                            }}
                          />
                        )}
                        <div className={styles.blogContent}>
                          <h2>{blog.title}</h2>
                          <p className={styles.blogMeta}>
                            Објавено на {formatDate(blog.createdAt)}
                          </p>
                          <p className={styles.blogSummary}>{blog.excerpt}</p>
                          <div className={styles.stats}>
                            <span>{blog.views || 0} Прегледи</span>
                            <span>{blog.likes || 0} Допаѓања</span>
                            <span>{blog.tags?.length || 0} Тагови</span>
                          </div>
                          <div className={styles.blogActions}>
                            <button
                              onClick={() => navigate(`/terminal/admin/blogs/edit/${blog.id}`)}
                              className={styles.editButton}
                            >
                              Уреди
                            </button>
                            <button
                              onClick={() => handleDelete(blog.id)}
                              className={styles.deleteButton}
                            >
                              Избриши
                            </button>
                            <button
                              onClick={() => handlePreview(blog)}
                              className={styles.previewButton}
                            >
                              Прегледај
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className={styles.pagination}>
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className={styles.paginationButton}
                      >
                        Претходна
                      </button>
                      <span className={styles.pageInfo}>
                        Страна {pagination.page} од {pagination.pages}
                      </span>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.pages}
                        className={styles.paginationButton}
                      >
                        Следна
                      </button>
                    </div>
                  </>
                ) : (
                  <div className={styles.noBlogsMessage}>
                    {searchTerm ? `Нема резултати за "${searchTerm}"` : 'Нема пронајдени блогови'}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
    </ProfileRequired>
  );
};

export default ManageBlogs;
