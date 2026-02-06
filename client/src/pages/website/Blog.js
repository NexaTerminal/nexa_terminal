import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import SimpleNavbar from '../../components/common/SimpleNavbar';
import PublicFooter from '../../components/common/PublicFooter';
import SEOHelmet from '../../components/seo/SEOHelmet';
import { OrganizationSchema } from '../../components/seo/StructuredData';
import api from '../../services/api';
import styles from '../../styles/website/Blog.module.css';

// Category translation mapping (English -> Macedonian)
const CATEGORY_MAP = {
  // Legal & Compliance
  'LEGAL': 'Право',
  'COMPLIANCE': 'Усогласеност',
  'CONTRACTS': 'Договори',
  'CORPORATE': 'Корпоративно право',
  'TRADEMARK': 'Жигови',

  // Business & Management
  'BUSINESS': 'Бизнис',
  'ENTREPRENEURSHIP': 'Претприемништво',
  'STARTUP': 'Стартапи',
  'MANAGEMENT': 'Менаџмент',

  // Finance & Investment
  'FINANCE': 'Финансии',
  'INVESTMENT': 'Инвестиции',
  'INVESTMENTS': 'Инвестиции',
  'TAX': 'Даноци',
  'ACCOUNTING': 'Сметководство',

  // HR & Employment
  'HR': 'ЧР',
  'EMPLOYMENT': 'Вработување',
  'RECRUITMENT': 'Регрутација',

  // Marketing & Sales
  'MARKETING': 'Маркетинг',
  'SALES': 'Продажба',
  'ADVERTISING': 'Реклама',
  'DIGITAL MARKETING': 'Дигитален маркетинг',

  // Technology
  'TECHNOLOGY': 'Технологија',
  'AUTOMATION': 'Автоматизација',
  'IT': 'ИТ',
  'SOFTWARE': 'Софтвер',

  // Other
  'NEWS': 'Вести',
  'GENERAL': 'Општо',
  'RESIDENCE': 'Престој',
  'EDUCATION': 'Образование',
  'TIPS': 'Совети'
};

// Category group mapping: broad group -> list of DB category values
const CATEGORY_GROUPS = {
  'LEGAL': ['LEGAL', 'COMPLIANCE', 'CONTRACTS', 'CORPORATE', 'TRADEMARK'],
  'BUSINESS': ['BUSINESS', 'ENTREPRENEURSHIP', 'STARTUP', 'MANAGEMENT'],
  'MARKETING': ['MARKETING', 'SALES', 'ADVERTISING', 'DIGITAL MARKETING'],
  'INVESTMENT': ['FINANCE', 'INVESTMENT', 'INVESTMENTS', 'TAX', 'ACCOUNTING'],
};

// Category tabs for filtering
const CATEGORY_TABS = [
  { label: 'Сите', value: 'ALL' },
  { label: 'Право', value: 'LEGAL' },
  { label: 'Претприемништво', value: 'BUSINESS' },
  { label: 'Маркетинг', value: 'MARKETING' },
  { label: 'Инвестиции', value: 'INVESTMENT' },
];

// Get Macedonian category name
function getCategoryInMacedonian(englishCategory) {
  if (!englishCategory) return '';
  const upperCategory = englishCategory.toUpperCase();
  return CATEGORY_MAP[upperCategory] || englishCategory;
}

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [brokenImages, setBrokenImages] = useState(new Set());
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeCategory = searchParams.get('category') || 'ALL';

  // Handle category tab click
  const handleCategoryClick = (category) => {
    if (category === 'ALL') {
      navigate('/blog');
    } else {
      navigate(`/blog?category=${encodeURIComponent(category)}`);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const response = await api.get('/blog');
      const postsData = Array.isArray(response) ? response : [];
      // Sort by latest first
      postsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Грешка при вчитување');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  // Helper to extract plain text from HTML and truncate
  function truncateText(html, maxLength = 200) {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
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

  // Handle image load error
  function handleImageError(postId) {
    setBrokenImages(prev => new Set([...prev, postId]));
  }

  // Filter posts by active category
  const filteredPosts = activeCategory === 'ALL'
    ? posts
    : posts.filter(post => {
        const postCat = (post.category || '').toUpperCase();
        const group = CATEGORY_GROUPS[activeCategory];
        return group ? group.includes(postCat) : false;
      });

  // Separate featured (first) post from rest
  const featuredPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);

  return (
    <>
      <SEOHelmet
        title="Инсајти - Бизнис совети и правни насоки за претприемачи"
        description="Експертски совети за правни прашања, бизнис стратегии, маркетинг и инвестиции. Информирајте се за успешно водење на вашиот бизнис во Македонија."
        keywords="бизнис совети, правни насоки, претприемништво, маркетинг стратегии, инвестиции македонија"
        canonical="/blog"
      />
      <OrganizationSchema />

      <SimpleNavbar />

      <div className={styles.page}>
        {/* Hero Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <span className={styles.headerLabel}>Инсајти</span>
            <h1 className={styles.headerTitle}>Консумирај квалитетна содржина</h1>
            <p className={styles.headerSubtitle}>
              Експертски анализи, практични совети и најнови трендови за претприемачи и бизнис лидери
            </p>
          </div>

          {/* Category Tabs */}
          <nav className={styles.categoryTabs}>
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.value}
                className={`${styles.categoryTab} ${activeCategory === tab.value ? styles.categoryTabActive : ''}`}
                onClick={() => handleCategoryClick(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        <main className={styles.main}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Се вчитува...</p>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className={styles.empty}>
              <p>Нема објави во оваа категорија.</p>
            </div>
          ) : (
            <>
              {/* Featured Article */}
              {featuredPost && (
                <section className={styles.featured}>
                  <Link to={`/blog/${featuredPost.slug || featuredPost._id}`} className={styles.featuredLink}>
                    {featuredPost.featuredImage && !brokenImages.has(featuredPost._id) ? (
                      <img
                        src={featuredPost.featuredImage}
                        alt={featuredPost.title}
                        className={styles.featuredImage}
                        onError={() => handleImageError(featuredPost._id)}
                      />
                    ) : (
                      <div className={styles.featuredPlaceholder}>
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </div>
                    )}
                    <div className={styles.featuredOverlay} />
                    <div className={styles.featuredContent}>
                      <div className={styles.featuredMeta}>
                        {featuredPost.category && (
                          <span className={styles.featuredCategory}>
                            {getCategoryInMacedonian(featuredPost.category)}
                          </span>
                        )}
                        <span className={styles.featuredDate}>{formatDate(featuredPost.createdAt)}</span>
                      </div>
                      <h2 className={styles.featuredTitle}>{featuredPost.title}</h2>
                      <p className={styles.featuredExcerpt}>
                        {truncateText(featuredPost.excerpt, 200)}
                      </p>
                      <span className={styles.featuredReadMore}>Прочитај ја статијата</span>
                    </div>
                  </Link>
                </section>
              )}

              {/* Articles Grid */}
              {remainingPosts.length > 0 && (
                <section className={styles.articles}>
                  <h3 className={styles.sectionTitle}>Последни објави</h3>
                  <div className={styles.grid}>
                    {remainingPosts.map(post => (
                      <article key={post._id} className={styles.card}>
                        <Link to={`/blog/${post.slug || post._id}`} className={styles.cardLink}>
                          {post.featuredImage && !brokenImages.has(post._id) && (
                            <div className={styles.cardImageWrapper}>
                              <img
                                src={post.featuredImage}
                                alt={post.title}
                                loading="lazy"
                                className={styles.cardImage}
                                onError={() => handleImageError(post._id)}
                              />
                            </div>
                          )}
                          <div className={styles.cardContent}>
                            <div className={styles.cardMeta}>
                              {post.category && (
                                <span className={styles.cardCategory}>
                                  {getCategoryInMacedonian(post.category)}
                                </span>
                              )}
                              <span className={styles.cardDate}>{formatDate(post.createdAt)}</span>
                            </div>
                            <h2 className={styles.cardTitle}>{post.title}</h2>
                            <p className={styles.cardExcerpt}>
                              {truncateText(post.excerpt, 120)}
                            </p>
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>

        <PublicFooter />
      </div>
    </>
  );
}
