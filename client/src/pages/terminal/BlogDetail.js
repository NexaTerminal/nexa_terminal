import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// import { Helmet } from 'react-helmet-async';
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

  const formatBlogContent = (content) => {
    if (!content) return '';

    // If content already has HTML tags, return as is
    if (content.includes('<p>') || content.includes('<div>') || content.includes('<br>')) {
      return content;
    }

    // For content without HTML tags, wrap in a single paragraph
    return `<p>${content.trim()}</p>`;
  };

  const stripHtmlTags = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  };

  const createMetaDescription = (blog) => {
    if (!blog) return 'Nexa Terminal - AI-powered business document generator';

    let description = blog.excerpt || stripHtmlTags(blog.content) || blog.title;

    // Limit to 160 characters for optimal SEO
    if (description.length > 160) {
      description = description.substring(0, 157) + '...';
    }

    return description;
  };

  const getImageUrl = (blog) => {
    if (blog?.featuredImage) {
      // If it's a relative path, make it absolute
      if (blog.featuredImage.startsWith('/')) {
        return `${window.location.origin}${blog.featuredImage}`;
      }
      return blog.featuredImage;
    }
    // Default social sharing image
    return `${window.location.origin}/nexa-blog-share.png`;
  };

  const getCurrentUrl = () => {
    return window.location.href;
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
      {/* Helmet SEO component temporarily disabled for deployment
      <Helmet>
        <title>{blog ? `${blog.title} - Nexa Terminal` : 'Блог - Nexa Terminal'}</title>
        <meta name="description" content={createMetaDescription(blog)} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={getCurrentUrl()} />
        <meta property="og:title" content={blog ? `${blog.title} - Nexa Terminal` : 'Блог - Nexa Terminal'} />
        <meta property="og:description" content={createMetaDescription(blog)} />
        <meta property="og:image" content={getImageUrl(blog)} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Nexa Terminal" />
        <meta property="og:locale" content={blog?.contentLanguage === 'mk' ? 'mk_MK' : 'en_US'} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={getCurrentUrl()} />
        <meta name="twitter:title" content={blog ? `${blog.title} - Nexa Terminal` : 'Блог - Nexa Terminal'} />
        <meta name="twitter:description" content={createMetaDescription(blog)} />
        <meta name="twitter:image" content={getImageUrl(blog)} />
        <meta name="robots" content="index, follow" />
        <meta name="author" content={blog?.author?.name || 'Nexa Terminal'} />
        <link rel="canonical" content={getCurrentUrl()} />
      </Helmet>
      */}

      <Header isTerminal={true} />
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.mainFullWidth}>
          <div className={styles.blogContainer}>
            <button
              onClick={() => navigate('/terminal')}
              className={styles.backButton}
            >
              ← Назад на контролен панел
            </button>

            <article className={styles.blogArticle}>

              <div className={styles.blogContentWrapper}>
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

                  <div className={styles.authorAndTags}>
                    {blog.author && (
                      <div className={styles.blogAuthor}>
                        <span>Автор: {blog.author.name}</span>
                      </div>
                    )}

                    {blog.tags && Array.isArray(blog.tags) && blog.tags.length > 0 && (
                      <div className={styles.blogTags}>
                        {blog.tags.map((tag, index) => (
                          <span key={index} className={styles.tag}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </header>

                <div className={styles.blogContent}>
                  <div
                    dangerouslySetInnerHTML={{ __html: formatBlogContent(blog.content) }}
                    className={styles.content}
                  />
                </div>
              </div>

            </article>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BlogDetail; 