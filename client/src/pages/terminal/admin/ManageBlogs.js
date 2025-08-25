import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../../services/api';
import { getBlogUrl } from '../../../utils/blogUrls';
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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async (page = 1) => {
    setLoading(true);
    try {
      const response = await ApiService.getBlogs(page);
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
    window.open(getBlogUrl(blog._id), '_blank');
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('mk-MK', options);
  };

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

            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            {loading ? (
              <div className={styles.loading}>Вчитување...</div>
            ) : (
              <div className={styles.blogList}>
                {blogs && blogs.length > 0 ? (
                  <>
                    {blogs.map(blog => (
                      <div key={blog._id} className={styles.blogCard}>
                        {blog.image && (
                          <img 
                            src={`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}${blog.image}`}
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
                          <p className={styles.blogSummary}>{blog.summary}</p>
                          <div className={styles.stats}>
                            <span>{blog.views || 0} Прегледи</span>
                            <span>{blog.likes || 0} Допаѓања</span>
                            <span>{blog.tags?.length || 0} Тагови</span>
                          </div>
                          <div className={styles.blogActions}>
                            <button
                              onClick={() => navigate(`/terminal/admin/blogs/edit/${blog._id}`)}
                              className={styles.editButton}
                            >
                              Уреди
                            </button>
                            <button
                              onClick={() => handleDelete(blog._id)}
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
                    Нема пронајдени блогови
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
