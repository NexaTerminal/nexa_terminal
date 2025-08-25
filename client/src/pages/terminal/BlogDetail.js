import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import RightSidebar from '../../components/terminal/RightSidebar';
import styles from '../../styles/terminal/BlogDetail.module.css';

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const data = await ApiService.request(`/blogs/${id}`);
        setBlog(data);
      } catch (error) {
        console.error('Error fetching blog:', error);
        setError('Грешка при вчитување на блогот');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBlog();
    }
  }, [id, token]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('mk-MK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles.layout}>
          <Sidebar />
          <main className={styles.main}>
            <div className={styles.loading}>Се вчитува...</div>
          </main>
          <RightSidebar />
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles.layout}>
          <Sidebar />
          <main className={styles.main}>
            <div className={styles.error}>
              {error || 'Блогот не е пронајден'}
            </div>
            <button 
              onClick={() => navigate('/terminal')} 
              className={styles.backButton}
            >
              ← Назад на контролен панел
            </button>
          </main>
          <RightSidebar />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header isTerminal={true} />
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>
          <div className={styles.blogContainer}>
            <button 
              onClick={() => navigate('/terminal')} 
              className={styles.backButton}
            >
              ← Назад на контролен панел
            </button>

            <article className={styles.blogArticle}>
              <header className={styles.blogHeader}>
                <div className={styles.blogMeta}>
                  <span className={styles.blogCategory}>{blog.category}</span>
                  <span className={styles.blogDate}>{formatDate(blog.createdAt)}</span>
                  {blog.views !== undefined && (
                    <span className={styles.blogViews}>👁️ {blog.views} прегледи</span>
                  )}
                </div>
                
                <h1 className={styles.blogTitle}>{blog.title}</h1>
                
                {blog.excerpt && (
                  <p className={styles.blogExcerpt}>{blog.excerpt}</p>
                )}

                {blog.author && (
                  <div className={styles.blogAuthor}>
                    <span>Автор: {blog.author.name}</span>
                  </div>
                )}

                {blog.tags && blog.tags.length > 0 && (
                  <div className={styles.blogTags}>
                    {blog.tags.map((tag, index) => (
                      <span key={index} className={styles.tag}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </header>

              <div className={styles.blogImage}>
                {blog.featuredImage ? (
                  <img 
                    src={blog.featuredImage.startsWith('http') ? blog.featuredImage : `${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/uploads/blogs/${blog.featuredImage}`} 
                    alt={blog.title}
                    className={styles.featuredImage}
                  />
                ) : (
                  <img 
                    src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
                    alt="Blog placeholder"
                    className={styles.featuredImage}
                  />
                )}
              </div>

              <div className={styles.blogContent}>
                <div 
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                  className={styles.content}
                />
              </div>

              <footer className={styles.blogFooter}>
                <div className={styles.blogStats}>
                  {blog.likes !== undefined && (
                    <span className={styles.blogLikes}>👍 {blog.likes} допаѓања</span>
                  )}
                  <span className={styles.blogLanguage}>
                    Јазик: {blog.contentLanguage === 'mk' ? 'Македонски' : 'English'}
                  </span>
                </div>
              </footer>
            </article>
          </div>
        </main>
        <RightSidebar />
      </div>
    </div>
  );
};

export default BlogDetail; 