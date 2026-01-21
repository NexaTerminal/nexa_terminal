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
  const [suggestedBlogs, setSuggestedBlogs] = useState([]);
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

  // Fetch suggested blogs based on category (with fallback to any category)
  useEffect(() => {
    const fetchSuggestedBlogs = async () => {
      if (!blog) return;

      try {
        // Fetch all blogs excluding current blog
        const allBlogs = await ApiService.request('/blogs');
        const otherBlogs = allBlogs.filter(b => b._id !== blog._id);

        const currentCategory = blog.category?.toUpperCase() || '';

        // First, get blogs from the same category
        const sameCategoryBlogs = otherBlogs
          .filter(b => (b.category?.toUpperCase() || '') === currentCategory)
          .sort(() => 0.5 - Math.random());

        let suggested = [];

        if (sameCategoryBlogs.length >= 3) {
          // Enough posts in same category
          suggested = sameCategoryBlogs.slice(0, 3);
        } else {
          // Not enough in same category - add posts from other categories as fallback
          suggested = [...sameCategoryBlogs];

          const otherCategoryBlogs = otherBlogs
            .filter(b => (b.category?.toUpperCase() || '') !== currentCategory)
            .sort(() => 0.5 - Math.random());

          const needed = 3 - suggested.length;
          suggested = [...suggested, ...otherCategoryBlogs.slice(0, needed)];
        }

        setSuggestedBlogs(suggested);
      } catch (error) {
        console.error('Error fetching suggested blogs:', error);
        setSuggestedBlogs([]);
      }
    };

    fetchSuggestedBlogs();
  }, [blog]);

  const translateCategory = (category) => {
    if (!category) return '';

    const categoryTranslations = {
      'LEGAL': 'Право',
      'COMPLIANCE': 'Усогласеност',
      'CONTRACTS': 'Договори',
      'CORPORATE': 'Корпоративно право',
      'TRADEMARK': 'Жигови',
      'BUSINESS': 'Бизнис',
      'ENTREPRENEURSHIP': 'Претприемништво',
      'STARTUP': 'Стартапи',
      'MANAGEMENT': 'Менаџмент',
      'FINANCE': 'Финансии',
      'INVESTMENT': 'Инвестиции',
      'INVESTMENTS': 'Инвестиции',
      'TAX': 'Даноци',
      'ACCOUNTING': 'Сметководство',
      'HR': 'ЧР',
      'EMPLOYMENT': 'Вработување',
      'RECRUITMENT': 'Регрутација',
      'MARKETING': 'Маркетинг',
      'SALES': 'Продажба',
      'ADVERTISING': 'Реклама',
      'DIGITAL MARKETING': 'Дигитален маркетинг',
      'TECHNOLOGY': 'Технологија',
      'AUTOMATION': 'Автоматизација',
      'IT': 'ИТ',
      'SOFTWARE': 'Софтвер',
      'NEWS': 'Вести',
      'GENERAL': 'Општо',
      'RESIDENCE': 'Престој',
      'EDUCATION': 'Образование',
      'TIPS': 'Совети'
    };

    const upperCategory = category.toUpperCase();
    return categoryTranslations[upperCategory] || category;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = [
      'јануари', 'февруари', 'март', 'април', 'мај', 'јуни',
      'јули', 'август', 'септември', 'октомври', 'ноември', 'декември'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day} ${month}, ${year} во ${hours}:${minutes}`;
  };

  const formatBlogContent = (content) => {
    if (!content) return '';

    // Content is already formatted with <p> tags on the server
    // Just return it as-is to preserve the paragraph formatting
    return content;
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
        <main className={styles.main}>
          <div className={styles.blogContainer}>
            <button
              onClick={() => navigate('/terminal')}
              className={styles.backButton}
            >
              ← Назад на контролен панел
            </button>

            <article className={styles.blogArticle}>

              {/* Hero Section with Image and Overlaid Content */}
              {blog.featuredImage && (
                <div className={styles.heroSection}>
                  <img
                    src={getImageUrl(blog)}
                    alt={blog.title}
                    className={styles.heroImage}
                  />
                  <div className={styles.heroOverlay}></div>
                  <div className={styles.heroContent}>
                    <div className={styles.heroMeta}>
                      <span className={styles.heroCategory}>{translateCategory(blog.category)}</span>
                      <span className={styles.heroDivider}>•</span>
                      <span className={styles.heroDate}>{formatDate(blog.createdAt)}</span>
                    </div>
                    <h1 className={styles.heroTitle}>{blog.title}</h1>
                  </div>
                </div>
              )}

              {/* Content Section */}
              <div className={styles.blogContentWrapper}>

                {/* Excerpt Section */}
                {blog.excerpt && (
                  <div className={styles.excerptSection}>
                    {blog.excerpt.split('\n').filter(para => para.trim()).map((paragraph, index) => (
                      <p key={index} className={styles.excerpt}>{paragraph.trim()}</p>
                    ))}
                  </div>
                )}

                {/* Main Content */}
                <div className={styles.blogContent}>
                  <div
                    dangerouslySetInnerHTML={{ __html: formatBlogContent(blog.content) }}
                    className={styles.content}
                  />
                </div>

                {/* Suggested Blogs Section */}
                {suggestedBlogs.length > 0 && (
                  <div className={styles.suggestedSection}>
                    <h2 className={styles.suggestedTitle}>Слични теми</h2>
                    <div className={styles.suggestedGrid}>
                      {suggestedBlogs.map((suggestedBlog) => (
                        <SuggestedBlogCard
                          key={suggestedBlog._id}
                          blog={suggestedBlog}
                          navigate={navigate}
                          translateCategory={translateCategory}
                          formatDate={formatDate}
                          getImageUrl={getImageUrl}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </article>
          </div>
        </main>
        <RightSidebar />
      </div>
    </div>
  );
};

// Suggested Blog Card Component
const SuggestedBlogCard = ({ blog, navigate, translateCategory, formatDate, getImageUrl }) => {
  const handleClick = () => {
    navigate(`/terminal/blogs/${blog._id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.suggestedCard} onClick={handleClick}>
      {blog.featuredImage && (
        <div className={styles.suggestedImageWrapper}>
          <img
            src={getImageUrl(blog)}
            alt={blog.title}
            className={styles.suggestedImage}
          />
          <div className={styles.suggestedOverlay}></div>
        </div>
      )}
      <div className={styles.suggestedContent}>
        <div className={styles.suggestedMeta}>
          <span className={styles.suggestedCategory}>
            {translateCategory(blog.category)}
          </span>
        </div>
        <h3 className={styles.suggestedCardTitle}>{blog.title}</h3>
        {blog.excerpt && (
          <p className={styles.suggestedExcerpt}>
            {blog.excerpt.length > 100
              ? `${blog.excerpt.substring(0, 100)}...`
              : blog.excerpt}
          </p>
        )}
        <span className={styles.suggestedReadMore}>Прочитај повеќе →</span>
      </div>
    </div>
  );
};

export default BlogDetail; 