import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SimpleNavbar from '../../components/common/SimpleNavbar';
import PublicFooter from '../../components/common/PublicFooter';
import SEOHelmet from '../../components/seo/SEOHelmet';
import { ArticleSchema } from '../../components/seo/StructuredData';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import LoginModal from '../../components/common/LoginModal';
import styles from '../../styles/website/BlogPost.module.css';

export default function BlogPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [post, setPost] = useState(null);
  const [suggestedPosts, setSuggestedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const videoSliderRef = useRef(null);

  // Video slider navigation
  const scrollVideos = (direction) => {
    if (videoSliderRef.current) {
      const scrollAmount = 140; // Width of one video card + gap
      const currentScroll = videoSliderRef.current.scrollLeft;
      videoSliderRef.current.scrollTo({
        left: direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // If user is already logged in, redirect to terminal blog view (full content)
    if (currentUser) {
      navigate(`/terminal/blogs/${id}`);
      return;
    }

    fetchPost();
    fetchSuggestedPosts();
  }, [id, currentUser, navigate]);

  // Load Mailjet newsletter script with robust reinitialization
  useEffect(() => {
    const loadMailjetScript = () => {
      const scriptId = 'mailjet-widget-script';
      // Remove existing script to force fresh load
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://app.mailjet.com/pas-nc-embedded-v1.js';
      script.type = 'text/javascript';
      script.onload = () => {
        // After script loads, find iframe and ensure it has proper height
        setTimeout(() => {
          const iframe = document.querySelector('iframe[data-w-type="embedded"]');
          if (iframe && (iframe.style.height === '0px' || iframe.style.height === '0')) {
            iframe.style.height = '520px';
          }
        }, 500);
      };
      document.body.appendChild(script);
    };

    // Delay to ensure iframe is in DOM first
    const timer = setTimeout(loadMailjetScript, 300);
    return () => clearTimeout(timer);
  }, [post]);

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
      // Get all posts and filter out current post, then take 3 random posts
      const allPosts = Array.isArray(response) ? response : [];
      const filtered = allPosts.filter(p => p._id !== id);
      const shuffled = filtered.sort(() => 0.5 - Math.random());
      setSuggestedPosts(shuffled.slice(0, 3));
    } catch (error) {
      console.error('Error fetching suggested posts:', error);
    }
  }

  // Translate category to Macedonian (case-insensitive)
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

    const upperCategory = category.toUpperCase();
    return categoryTranslations[upperCategory] || category;
  }

  // Format date to Macedonian format
  function formatDate(dateString) {
    const date = new Date(dateString);
    const months = [
      'јануари', 'февруари', 'март', 'април', 'мај', 'јуни',
      'јули', 'август', 'септември', 'октомври', 'ноември', 'декември'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month}, ${year}`;
  }

  // Extract tags as array
  function getTags(tagsObject) {
    if (!tagsObject) return [];
    return Object.values(tagsObject);
  }

  // Extract clean text from HTML for SEO
  function extractTextFromHTML(html, maxLength = 160) {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';
    return text.length > maxLength ? text.substring(0, maxLength).trim() + '...' : text.trim();
  }

  // Truncate text for suggested posts
  function truncateText(html, maxLength = 100) {
    return extractTextFromHTML(html, maxLength);
  }

  // Extract last ~25 words from content for fade effect
  function getLastWords(content, wordCount = 25) {
    if (!content) return '';
    const div = document.createElement('div');
    div.innerHTML = content;
    const text = div.textContent || div.innerText || '';
    const words = text.trim().split(/\s+/);

    // Get last 25 words (or available words if less)
    const lastWords = words.slice(-Math.min(wordCount, words.length));
    return lastWords.join(' ');
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
          <div className={styles.errorIcon}>⚠️</div>
          <p className={styles.errorMessage}>
            {error || 'Блогот не е пронајден'}
          </p>
          <Link to="/blog" className={styles.errorLink}>
            ← Назад кон блогот
          </Link>
        </div>
      </>
    );
  }

  const tags = getTags(post.tags);

  const metaDescription = extractTextFromHTML(post.excerpt || post.title, 155);
  const metaKeywords = [...tags, 'правни совети', 'македонски бизниси', 'Nexa Terminal'].join(', ');

  // Ensure absolute URLs for Open Graph images
  const fullImageUrl = post.featuredImage
    ? (post.featuredImage.startsWith('http') ? post.featuredImage : `https://nexa.mk${post.featuredImage}`)
    : 'https://nexa.mk/nexa-logo-navbar.png';

  return (
    <>
      <SEOHelmet
        title={`${post.title} | Nexa Terminal`}
        description={metaDescription}
        keywords={metaKeywords}
        canonical={`/blog/${post._id}`}
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

      <div className={styles.pageWrapper}>
        <article className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          {post.category && (
            <span className={styles.category}>
              {translateCategory(post.category)}
            </span>
          )}
          <h1 className={styles.title}>{post.title}</h1>
        </header>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className={styles.featuredImageWrapper}>
            <img
              src={post.featuredImage}
              alt={`${post.title} - ${post.category || 'Nexa Terminal Блог'}`}
              title={post.title}
              className={styles.featuredImage}
              loading="eager"
              width="1200"
              height="630"
            />
          </div>
        )}

        {/* Excerpt (Public Preview) with Fade Effect */}
        <div className={styles.excerptWrapper}>
          <div className={styles.excerpt}>
            <div dangerouslySetInnerHTML={{ __html: post.excerpt }} />
          </div>
          <div className={styles.excerptFade}></div>
        </div>

        {/* Login Gate - Inside Article */}
        <div className={styles.loginGateInline}>
          <div className={styles.loginGateContent}>
            <h2>Најави се за да дочиташ - целосно бесплатно.</h2>
            <p>
              Оваа содржина е достапна за регистрирани корисници на Nexa Terminal. Отварањето на профил нуди бројни алатки за Вашиот бизнис и е целосно бесплатно и анонимно
            </p>
            <div className={styles.loginGateActions}>
              <button
                onClick={() => setShowLoginModal(true)}
                className={styles.loginButton}
              >
                Најави се
              </button>
              <span className={styles.or}>или</span>
              <button
                onClick={() => setShowLoginModal(true)}
                className={styles.signupButton}
              >
                Регистрирај се бесплатно
              </button>
            </div>
          </div>
        </div>

        {/* Back to Blog */}
        <footer className={styles.footer}>
          <Link to="/blog" className={styles.backLink}>
            <span className={styles.backArrow}>←</span>
            <span>Назад кон блогот</span>
          </Link>
        </footer>
      </article>

        {/* Sidebar with Suggested Posts and About */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSticky}>
            {/* About Nexa Promo Box - Light Design */}
            <div className={styles.aboutBox}>
              <div className={styles.aboutHeader}>
                <div className={styles.aboutLogo}>
                  <span className={styles.logoN}>N</span>
                </div>
                <div>
                  <h3 className={styles.aboutTitle}>Nexa Terminal</h3>
                  <span className={styles.aboutBadge}>Бесплатно</span>
                </div>
              </div>
              <p className={styles.aboutText}>
                Платформа за македонски бизниси. Генерирај документи, следи обврски, автоматизирај процеси.
              </p>
              <ul className={styles.aboutFeatures}>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Бесплатно засекогаш
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  100% приватност
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Без чекање
                </li>
              </ul>
              <button
                onClick={() => setShowLoginModal(true)}
                className={styles.aboutCta}
              >
                Започни бесплатно
              </button>
            </div>

            {/* Feature Videos Slider */}
            <div className={styles.videosSection}>
              <div className={styles.videosTitleRow}>
                <h4 className={styles.videosTitle}>Видео водичи</h4>
                <div className={styles.videoArrows}>
                  <button
                    className={styles.videoArrow}
                    onClick={() => scrollVideos('left')}
                    aria-label="Previous video"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                  </button>
                  <button
                    className={styles.videoArrow}
                    onClick={() => scrollVideos('right')}
                    aria-label="Next video"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className={styles.videosSlider} ref={videoSliderRef}>
                <div className={styles.videosTrack}>
                  {[
                    { id: 'WG9Z0NadFJg', title: 'Документација' },
                    { id: '98R2bDGKbgc', title: 'Комплајанс' },
                    { id: 'IbTsGXAXHdY', title: 'AI Асистент' },
                    { id: 'LJXQtz--Sm8', title: 'Едукација' },
                    { id: '1Z9nMueisuk', title: 'Експерти' },
                  ].map((video) => (
                    <a
                      key={video.id}
                      href={`https://www.youtube.com/watch?v=${video.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.videoCard}
                    >
                      <div className={styles.videoThumb}>
                        <img
                          src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                          alt={video.title}
                          loading="lazy"
                        />
                        <div className={styles.playIcon}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                          </svg>
                        </div>
                      </div>
                      <span className={styles.videoLabel}>{video.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Suggested Posts */}
            <div className={styles.suggestedSection}>
              <h3 className={styles.sidebarTitle}>Препорачани</h3>
              <div className={styles.suggestedPosts}>
                {suggestedPosts.length > 0 ? (
                  suggestedPosts.map((suggestedPost) => (
                    <Link
                      key={suggestedPost._id}
                      to={`/blog/${suggestedPost._id}`}
                      className={styles.suggestedPostCard}
                    >
                      {suggestedPost.featuredImage && (
                        <div className={styles.suggestedPostImage}>
                          <img
                            src={suggestedPost.featuredImage}
                            alt={`${suggestedPost.title} - Nexa Terminal`}
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className={styles.suggestedPostContent}>
                        {suggestedPost.category && (
                          <span className={styles.suggestedPostCategory}>
                            {translateCategory(suggestedPost.category)}
                          </span>
                        )}
                        <h4 className={styles.suggestedPostTitle}>
                          {suggestedPost.title}
                        </h4>
                        <span className={styles.suggestedPostDate}>
                          {formatDate(suggestedPost.createdAt)}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className={styles.noSuggestions}>Нема други статии</p>
                )}
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className={styles.newsletterSection}>
              <iframe
                data-w-type="embedded"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                src="https://118h2.mjt.lu/wgt/118h2/0t2x/form?c=9eb33de5"
                width="100%"
                title="Newsletter signup"
                className={styles.newsletterIframe}
                style={{ minHeight: '520px', height: '520px' }}
                onLoad={(e) => {
                  // Force height if script sets it to 0
                  if (e.target.style.height === '0px' || e.target.style.height === '0') {
                    e.target.style.height = '520px';
                  }
                }}
              />
            </div>
          </div>
        </aside>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        redirectPath={`/terminal/blogs/${id}`}
      />

      <PublicFooter />
    </>
  );
}
