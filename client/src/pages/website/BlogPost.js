import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import SimpleNavbar from '../../components/common/SimpleNavbar';
import PublicFooter from '../../components/common/PublicFooter';
import SEOHelmet from '../../components/seo/SEOHelmet';
import { ArticleSchema } from '../../components/seo/StructuredData';
import api from '../../services/api';
import { getPromotedToolById } from '../../config/promotedTools';
import styles from '../../styles/website/BlogPost.module.css';

export default function BlogPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [post, setPost] = useState(null);
  const [suggestedPosts, setSuggestedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPost();
    fetchSuggestedPosts();
  }, [id]);

  // Redirect to slug-based URL if we're on an ID-based URL
  useEffect(() => {
    if (post && post.slug && post.slug !== id) {
      // Preserve query params (like ?lang=mk)
      const queryString = location.search;
      navigate(`/blog/${post.slug}${queryString}`, { replace: true });
    }
  }, [post, id, navigate, location.search]);

  async function fetchPost() {
    try {
      const response = await api.get(`/blog/${id}`);
      setPost(response);
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Грешка при вчитување на блогот');
    } finally {
      setLoading(false);
    }
  }

  async function fetchSuggestedPosts() {
    try {
      const response = await api.get('/blog');
      const allPosts = Array.isArray(response) ? response : [];
      // Filter out current post (check both _id and slug)
      const filtered = allPosts.filter(p => p._id !== id && p.slug !== id);
      const shuffled = filtered.sort(() => 0.5 - Math.random());
      setSuggestedPosts(shuffled.slice(0, 3));
    } catch (error) {
      console.error('Error fetching suggested posts:', error);
    }
  }

  // Split content at ~70% for inline CTA
  const { contentBefore, contentAfter } = useMemo(() => {
    if (!post?.content) return { contentBefore: '', contentAfter: '' };

    const content = post.content;
    // Find paragraph breaks to split at roughly 70%
    const paragraphs = content.split(/<\/p>/i);
    const splitPoint = Math.floor(paragraphs.length * 0.7);

    if (paragraphs.length <= 2) {
      return { contentBefore: content, contentAfter: '' };
    }

    const before = paragraphs.slice(0, splitPoint).join('</p>') + '</p>';
    const after = paragraphs.slice(splitPoint).join('</p>');

    return { contentBefore: before, contentAfter: after };
  }, [post?.content]);

  // Get promoted tool data
  const promotedTool = useMemo(() => {
    if (!post?.promotedTool) return null;
    return getPromotedToolById(post.promotedTool);
  }, [post?.promotedTool]);

  function translateCategory(category) {
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
    return categoryTranslations[category.toUpperCase()] || category;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const months = [
      'јануари', 'февруари', 'март', 'април', 'мај', 'јуни',
      'јули', 'август', 'септември', 'октомври', 'ноември', 'декември'
    ];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  }

  function getTags(tagsObject) {
    if (!tagsObject) return [];
    return Object.values(tagsObject);
  }

  function extractTextFromHTML(html, maxLength = 160) {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';
    return text.length > maxLength ? text.substring(0, maxLength).trim() + '...' : text.trim();
  }

  if (loading) {
    return (
      <>
        <SimpleNavbar />
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Се вчитува блогот...</p>
        </div>
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <SimpleNavbar />
        <div className={styles.error}>
          <p className={styles.errorMessage}>{error || 'Блогот не е пронајден'}</p>
          <Link to="/blog" className={styles.errorLink}>← Назад кон блогот</Link>
        </div>
      </>
    );
  }

  const tags = getTags(post.tags);
  // Use SEO metadata from post if available, otherwise fallback to extracted content
  const metaDescription = post.metaDescription || extractTextFromHTML(post.excerpt || post.title, 155);
  const metaKeywords = [...tags, post.focusKeyword, 'правни совети', 'македонски бизниси', 'Nexa Terminal'].filter(Boolean).join(', ');
  const fullImageUrl = post.featuredImage
    ? (post.featuredImage.startsWith('http') ? post.featuredImage : `https://nexa.mk${post.featuredImage}`)
    : 'https://nexa.mk/nexa-logo-navbar.png';
  // Use slug for canonical URL (SEO-friendly)
  const canonicalSlug = post.slug || post._id;

  return (
    <>
      <SEOHelmet
        title={`${post.metaTitle || post.title} | Nexa Terminal`}
        description={metaDescription}
        keywords={metaKeywords}
        canonical={`/blog/${canonicalSlug}`}
        ogImage={fullImageUrl}
        type="article"
      />
      <ArticleSchema
        title={post.title}
        description={metaDescription}
        date={post.createdAt}
        image={fullImageUrl}
        author={post.author?.name || 'Nexa Terminal'}
      />

      <SimpleNavbar />

      {/* Hero Section - Full Width Image with Title Overlay */}
      <header className={styles.hero}>
        {post.featuredImage && (
          <img
            src={post.featuredImage}
            alt={post.title}
            className={styles.heroImage}
            loading="eager"
          />
        )}
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          {post.category && (
            <span className={styles.category}>{translateCategory(post.category)}</span>
          )}
          <h1 className={styles.title}>{post.title}</h1>
        </div>
      </header>

      {/* Article Content */}
      <article className={styles.article}>
        {/* First 70% of content */}
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: contentBefore }}
        />

        {/* Inline CTA Banner */}
        {promotedTool && promotedTool.id !== 'none' && promotedTool.link && (
          <div className={styles.ctaBanner}>
            <div className={`${styles.ctaInner} ${promotedTool.videoUrl ? styles.ctaWithVideo : ''}`}>
              <div className={styles.ctaText}>
                <p className={styles.ctaLabel}>Препорачано</p>
                <h3 className={styles.ctaTitle}>{promotedTool.name}</h3>
                <p className={styles.ctaDescription}>{promotedTool.description}</p>
                <Link to={promotedTool.link} className={styles.ctaButton}>
                  {promotedTool.ctaText}
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
              {promotedTool.videoUrl && (
                <div className={styles.ctaVideo}>
                  <iframe
                    src={`https://www.youtube.com/embed/${promotedTool.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/)?.[1]}?rel=0&modestbranding=1`}
                    title={promotedTool.name}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Remaining 30% of content */}
        {contentAfter && (
          <div
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: contentAfter }}
          />
        )}
      </article>

      {/* Back Link */}
      <div className={styles.backSection}>
        <Link to="/blog" className={styles.backLink}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M16 10H4M4 10L9 5M4 10L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Назад кон блогот
        </Link>
      </div>

      {/* Suggested Posts */}
      {suggestedPosts.length > 0 && (
        <section className={styles.suggestedSection}>
          <div className={styles.suggestedHeader}>
            <h2 className={styles.suggestedTitle}>Прочитајте исто така</h2>
          </div>
          <div className={styles.suggestedGrid}>
            {suggestedPosts.map((suggestedPost) => (
              <Link
                key={suggestedPost._id}
                to={`/blog/${suggestedPost.slug || suggestedPost._id}`}
                className={styles.suggestedCard}
              >
                {suggestedPost.featuredImage && (
                  <div className={styles.suggestedImage}>
                    <img src={suggestedPost.featuredImage} alt={suggestedPost.title} loading="lazy" />
                  </div>
                )}
                <div className={styles.suggestedContent}>
                  {suggestedPost.category && (
                    <span className={styles.suggestedCategory}>
                      {translateCategory(suggestedPost.category)}
                    </span>
                  )}
                  <h3 className={styles.suggestedCardTitle}>{suggestedPost.title}</h3>
                  <span className={styles.suggestedDate}>{formatDate(suggestedPost.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <PublicFooter />
    </>
  );
}
