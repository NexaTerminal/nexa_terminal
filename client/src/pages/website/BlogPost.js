import { useState, useEffect } from 'react';
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

  useEffect(() => {
    // If user is already logged in, redirect to terminal blog view (full content)
    if (currentUser) {
      navigate(`/terminal/blogs/${id}`);
      return;
    }

    fetchPost();
    fetchSuggestedPosts();
  }, [id, currentUser, navigate]);

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

  // Format date to Macedonian format
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('mk-MK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
              {post.category}
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

        {/* Excerpt (Public Preview) */}
        <div className={styles.excerpt}>
          <div dangerouslySetInnerHTML={{ __html: post.excerpt }} />
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

        {/* Sidebar with Suggested Posts */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSticky}>
            <h3 className={styles.sidebarTitle}>Препорачани статии</h3>
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
                          {suggestedPost.category}
                        </span>
                      )}
                      <h4 className={styles.suggestedPostTitle}>
                        {suggestedPost.title}
                      </h4>
                      <p className={styles.suggestedPostExcerpt}>
                        {truncateText(suggestedPost.excerpt, 80)}
                      </p>
                      <span className={styles.suggestedPostDate}>
                        {formatDate(suggestedPost.createdAt)}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className={styles.noSuggestions}>Нема други статии засега</p>
              )}
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
