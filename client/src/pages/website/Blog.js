import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SimpleNavbar from '../../components/common/SimpleNavbar';
import PublicFooter from '../../components/common/PublicFooter';
import SEOHelmet from '../../components/seo/SEOHelmet';
import { OrganizationSchema } from '../../components/seo/StructuredData';
import api from '../../services/api';
import styles from '../../styles/website/Blog.module.css';

// Category translation mapping (English -> Macedonian)
const CATEGORY_MAP = {
  'MARKETING': 'Маркетинг',
  'LEGAL': 'Право',
  'BUSINESS': 'Бизнис',
  'TRADEMARK': 'Жигови',
  'EMPLOYMENT': 'Вработување',
  'CORPORATE': 'Корпоративно право',
  'RESIDENCE': 'Престој',
  'AUTOMATION': 'Автоматизација',
  'COMPLIANCE': 'Усогласеност',
  'STARTUP': 'Стартапи',
  'TAX': 'Даноци',
  'CONTRACTS': 'Договори',
  'ENTREPRENEURSHIP': 'Претприемништво'
};

// Get Macedonian category name
function getCategoryInMacedonian(englishCategory) {
  if (!englishCategory) return '';
  const upperCategory = englishCategory.toUpperCase();
  return CATEGORY_MAP[upperCategory] || englishCategory;
}

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('СИ');
  const [sortOrder, setSortOrder] = useState('latest');
  const [brokenImages, setBrokenImages] = useState(new Set());

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    filterAndSortPosts();
  }, [posts, selectedCategory, sortOrder]);

  async function fetchPosts() {
    try {
      const response = await api.get('/blog');
      setPosts(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Грешка при вчитување на блоговите');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  function filterAndSortPosts() {
    let filtered = [...posts];

    // Filter by category
    if (selectedCategory !== 'СИ') {
      filtered = filtered.filter(post =>
        getCategoryInMacedonian(post.category) === selectedCategory
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredPosts(filtered);
  }

  // Get unique categories from posts
  function getAvailableCategories() {
    const categories = new Set();
    posts.forEach(post => {
      if (post.category) {
        const macedonianCategory = getCategoryInMacedonian(post.category);
        categories.add(macedonianCategory);
      }
    });
    return ['СИ', ...Array.from(categories).sort()];
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
    return date.toLocaleDateString('mk-MK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Handle image load error
  function handleImageError(postId) {
    setBrokenImages(prev => new Set([...prev, postId]));
  }

  return (
    <>
      <SEOHelmet
        title="Блог - Правни совети за македонски бизниси"
        description="Практични совети за правни прашања, регистрација на фирми, жигови, договори, маркетинг и повеќе. Блог од Nexa Terminal."
        keywords="правни совети, македонски бизниси, блог, legal advice macedonia, бизнис совети, маркетинг"
        canonical="/blog"
      />
      <OrganizationSchema />

      <SimpleNavbar />

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <main className={styles.container}>
          {/* Minimal Filter Bar */}
          {!loading && posts.length > 0 && (
            <div className={styles.filterBar}>
              <div className={styles.categories}>
                {getAvailableCategories().map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`${styles.categoryChip} ${selectedCategory === category ? styles.active : ''}`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className={styles.sortOptions}>
                <button
                  onClick={() => setSortOrder('latest')}
                  className={`${styles.sortChip} ${sortOrder === 'latest' ? styles.active : ''}`}
                  title="Најнови"
                >
                  ↓
                </button>
                <button
                  onClick={() => setSortOrder('oldest')}
                  className={`${styles.sortChip} ${sortOrder === 'oldest' ? styles.active : ''}`}
                  title="Најстари"
                >
                  ↑
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Се вчитуваат блоговите...</p>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className={styles.empty}>
              <p>
                {selectedCategory !== 'СИ'
                  ? `Нема блогови во категоријата "${selectedCategory}".`
                  : 'Нема објавени блогови засега.'
                }
              </p>
            </div>
          ) : (
            <div className={styles.grid}>
              {filteredPosts.map(post => (
                <article key={post._id} className={styles.card}>
                  {post.featuredImage && !brokenImages.has(post._id) && (
                    <div className={styles.imageWrapper}>
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        loading="lazy"
                        className={styles.featuredImage}
                        onError={() => handleImageError(post._id)}
                      />
                    </div>
                  )}

                  <div className={styles.content}>
                    {post.category && (
                      <span className={styles.category}>
                        {getCategoryInMacedonian(post.category)}
                      </span>
                    )}

                    <h2 className={styles.title}>
                      <Link to={`/blog/${post._id}`}>
                        {post.title}
                      </Link>
                    </h2>

                    <p className={styles.excerpt}>
                      {truncateText(post.excerpt, 150)}
                    </p>

                    <Link to={`/blog/${post._id}`} className={styles.readMore}>
                      Прочитај повеќе →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>

        <PublicFooter />
      </div>
    </>
  );
}
