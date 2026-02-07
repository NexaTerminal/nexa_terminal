import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import SimpleNavbar from '../../components/common/SimpleNavbar';
import LoginModal from '../../components/common/LoginModal';
import PublicFooter from '../../components/common/PublicFooter';
import SEOHelmet from '../../components/seo/SEOHelmet';
import { ArticleSchema } from '../../components/seo/StructuredData';
import { sanitizeHTML } from '../../utils/sanitizer';
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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showScrollModal, setShowScrollModal] = useState(false);
  const [hasTriggeredModal, setHasTriggeredModal] = useState(false);

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

  // Scroll-triggered and exit-intent signup modal
  useEffect(() => {
    // Check if already dismissed today
    const dismissed = localStorage.getItem('blogModalDismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        setHasTriggeredModal(true); // Don't show again within 24 hours
        return;
      }
    }

    const handleScroll = () => {
      if (hasTriggeredModal) return;

      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = (window.scrollY / scrollHeight) * 100;

      // Trigger at 65% scroll
      if (scrollProgress >= 65) {
        setShowScrollModal(true);
        setHasTriggeredModal(true);
      }
    };

    // Exit intent detection - triggers when mouse leaves viewport at top
    const handleMouseLeave = (e) => {
      if (hasTriggeredModal) return;

      // Check if mouse is leaving from the top of the viewport
      if (e.clientY <= 5 && e.relatedTarget === null) {
        setShowScrollModal(true);
        setHasTriggeredModal(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasTriggeredModal]);

  const handleDismissModal = () => {
    setShowScrollModal(false);
    localStorage.setItem('blogModalDismissed', Date.now().toString());
  };

  const handleModalSignup = () => {
    setShowScrollModal(false);
    setShowLoginModal(true);
  };

  // Reading time estimate
  const readingTime = useMemo(() => {
    if (!post?.content) return 0;
    const text = post.content.replace(/<[^>]*>/g, '').trim();
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }, [post?.content]);

  // Helper to decode HTML entities
  const decodeHtmlEntities = (text) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Extract headings and inject IDs for ToC links
  const { headings, contentWithIds } = useMemo(() => {
    if (!post?.content) return { headings: [], contentWithIds: '' };

    const extracted = [];
    let counter = 0;
    const modified = post.content.replace(
      /<(h[23])([^>]*)>(.*?)<\/\1>/gi,
      (match, tag, attrs, text) => {
        const id = `heading-${counter}`;
        const cleanText = decodeHtmlEntities(text.replace(/<[^>]*>/g, ''));
        extracted.push({ id, tag: tag.toLowerCase(), text: cleanText });
        counter++;
        return `<${tag}${attrs} id="${id}">${text}</${tag}>`;
      }
    );

    return { headings: extracted, contentWithIds: modified };
  }, [post?.content]);

  const showToc = headings.length >= 3;
  const [tocCollapsed, setTocCollapsed] = useState(false);

  // Split content at ~70% for inline CTA
  const { contentBefore, contentAfter } = useMemo(() => {
    if (!post?.content) return { contentBefore: '', contentAfter: '' };

    const content = contentWithIds;
    // Find paragraph breaks to split at roughly 70%
    const paragraphs = content.split(/<\/p>/i);
    const splitPoint = Math.floor(paragraphs.length * 0.7);

    if (paragraphs.length <= 2) {
      return { contentBefore: content, contentAfter: '' };
    }

    const before = paragraphs.slice(0, splitPoint).join('</p>') + '</p>';
    const after = paragraphs.slice(splitPoint).join('</p>');

    return { contentBefore: before, contentAfter: after };
  }, [post?.content, contentWithIds]);

  // Get promoted tool data
  const promotedTool = useMemo(() => {
    if (!post?.promotedTool) return null;
    return getPromotedToolById(post.promotedTool);
  }, [post?.promotedTool]);

  function translateCategory(category) {
    if (!category) return '';
    const categoryTranslations = {
      'LEGAL': 'Усогласеност',
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
          <div className={styles.heroMeta}>
            <span className={styles.heroDate}>{formatDate(post.createdAt)}</span>
            <span className={styles.heroDivider}>·</span>
            <span className={styles.heroReadingTime}>{readingTime} мин читање</span>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <article className={styles.article}>
        {/* Table of Contents */}
        {showToc && (
          <nav className={styles.toc}>
            <button
              className={styles.tocToggle}
              onClick={() => setTocCollapsed(prev => !prev)}
              aria-expanded={!tocCollapsed}
            >
              <span className={styles.tocTitle}>Содржина</span>
              <span className={tocCollapsed ? styles.tocChevronCollapsed : styles.tocChevron}>▾</span>
            </button>
            {!tocCollapsed && (
              <ol className={styles.tocList}>
                {headings.map((h) => (
                  <li key={h.id} className={h.tag === 'h3' ? styles.tocItemSub : styles.tocItem}>
                    <a href={`#${h.id}`} className={styles.tocLink}>{h.text}</a>
                  </li>
                ))}
              </ol>
            )}
          </nav>
        )}

        {/* First 70% of content */}
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(contentBefore) }}
        />

        {/* Inline CTA Banner */}
        {promotedTool && promotedTool.id !== 'none' && (
          <div className={styles.ctaBanner}>
            <div className={`${styles.ctaInner} ${promotedTool.videoUrl ? styles.ctaWithVideo : ''}`}>
              <div className={styles.ctaText}>
                <p className={styles.ctaLabel}>Бесплатна алатка за сите бизниси</p>
                <h3 className={styles.ctaTitle}>{promotedTool.name}</h3>
                <p className={styles.ctaDescription}>{promotedTool.description}</p>
                <button onClick={() => setShowLoginModal(true)} className={styles.ctaButton}>
                  {promotedTool.ctaText}
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
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
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(contentAfter) }}
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

      {/* Newsletter Signup (Mailjet Embedded Form) */}
      <section className={styles.newsletter}>
        <h3 className={styles.newsletterTitle}>Останете информирани</h3>
        <p className={styles.newsletterSubtitle}>
          Добивајте правни совети и бизнис новости директно на вашиот email.
        </p>
        <div className={styles.newsletterEmbed}>
          <iframe
            data-w-type="embedded"
            frameBorder="0"
            scrolling="auto"
            src="https://118h2.mjt.lu/wgt/118h2/0t2x/form?c=9eb33de5"
            width="100%"
            style={{ minHeight: '280px', width: '100%', border: 'none' }}
            title="Newsletter signup"
          />
        </div>
      </section>

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

      {/* Scroll-triggered Signup Modal */}
      {showScrollModal && promotedTool && (
        <div className={styles.scrollModalOverlay} onClick={handleDismissModal}>
          <div className={styles.scrollModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.scrollModalClose} onClick={handleDismissModal}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <div className={styles.scrollModalContent}>
              <p className={styles.scrollModalLabel}>NEXA TERMINAL</p>
              <h2 className={styles.scrollModalTitle}>
                Подигнете го вашиот бизнис на следно ниво
              </h2>
              <p className={styles.scrollModalSubtitle}>
                Пристапете до професионални алатки за автоматизација и усогласеност
              </p>

              <div className={styles.scrollModalFeatures}>
                <div className={styles.scrollModalFeature}>
                  <svg className={styles.featureIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M9 2H4C2.89543 2 2 2.89543 2 4V16C2 17.1046 2.89543 18 4 18H16C17.1046 18 18 17.1046 18 16V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M7 13L17 3M17 3H12M17 3V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Автоматско генерирање документи</span>
                </div>
                <div className={styles.scrollModalFeature}>
                  <svg className={styles.featureIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M6.5 10L9 12.5L14 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  <span>Проверка на усогласеност</span>
                </div>
                <div className={styles.scrollModalFeature}>
                  <svg className={styles.featureIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2C5.58172 2 2 5.58172 2 10C2 11.8487 2.62704 13.551 3.68033 14.9297L2.5 17.5L5.41421 16.5858C6.67728 17.4826 8.27549 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 9H13M7 12H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span>AI правен асистент</span>
                </div>
              </div>

              <button onClick={handleModalSignup} className={styles.scrollModalButton}>
                Започнете бесплатно
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3.75 9H14.25M14.25 9L9.75 4.5M14.25 9L9.75 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <p className={styles.scrollModalNote}>
                Бесплатен пристап · Без кредитна картичка
              </p>
            </div>
          </div>
        </div>
      )}

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        redirectPath="/terminal"
      />

      <PublicFooter />
    </>
  );
}
