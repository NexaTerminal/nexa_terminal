import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from '../../styles/common/SimpleNavbar.module.css';

// Main blog categories for quick navigation
const BLOG_CATEGORIES = [
  { label: 'Сите', value: 'СИ' },
  { label: 'Право', value: 'Право' },
  { label: 'Претприемништво', value: 'Претприемништво' },
  { label: 'Маркетинг', value: 'Маркетинг' },
  { label: 'Инвестиции', value: 'Инвестиции' },
];

export default function SimpleNavbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we're on login or homepage
  const isLoginOrHome = location.pathname === '/login' || location.pathname === '/';

  // Check if we're on blog pages
  const isBlogPage = location.pathname === '/blog' || location.pathname.startsWith('/blog/');

  // Handle category click - navigate to blog with category
  const handleCategoryClick = (category) => {
    if (category === 'СИ') {
      navigate('/blog');
    } else {
      navigate(`/blog?category=${encodeURIComponent(category)}`);
    }
  };

  return (
    <nav className={`${styles.navbar} ${isLoginOrHome ? styles.transparent : styles.styled}`}>
      <div className={styles.navbarContent}>
        {/* Logo - hidden on login/homepage */}
        {!isLoginOrHome && (
          <a href="/login" className={styles.logo}>
            <img
              src="/nexa-logo-navbar.png"
              alt="Nexa"
              className={styles.logoImage}
            />
          </a>
        )}

        {/* Mobile menu button */}
        <button
          className={styles.mobileMenuButton}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={styles.hamburger}></span>
          <span className={styles.hamburger}></span>
          <span className={styles.hamburger}></span>
        </button>

        {/* Navigation links - All temporarily hidden, moved to footer */}
        <div className={`${styles.navLinks} ${mobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
          {/* Moved to footer - Блог link
          <a href="/blog" className={styles.navLink}>
            Блог
          </a>
          */}

          {/* Temporarily hidden - Теми link
          <a href="/topics" className={styles.navLink}>
            Теми
          </a>
          */}

          {/* Temporarily hidden - Области dropdown
          <div
            className={styles.dropdown}
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <span className={styles.dropdownTrigger}>
              Области ▾
            </span>

            {dropdownOpen && (
              <>
                <div className={styles.dropdownBridge} />

                <div className={styles.dropdownMenu}>
                  <a href="/residence" className={styles.dropdownItem}>
                    Престој
                  </a>
                  <a href="/employment" className={styles.dropdownItem}>
                    Работни односи
                  </a>
                  <a href="/trademark" className={styles.dropdownItem}>
                    Трговска марка
                  </a>
                  <a href="/corporate" className={styles.dropdownItem}>
                    Корпоративно право
                  </a>
                </div>
              </>
            )}
          </div>
          */}
        </div>
      </div>

      {/* Category bar - shown on blog pages */}
      {isBlogPage && !isLoginOrHome && (
        <div className={styles.categoryBar}>
          <div className={styles.categoryBarContent}>
            {BLOG_CATEGORIES.map((cat) => {
              // Get current category from URL
              const urlParams = new URLSearchParams(location.search);
              const currentCategory = urlParams.get('category') || 'СИ';
              const isActive = currentCategory === cat.value;

              return (
                <button
                  key={cat.value}
                  className={`${styles.categoryChip} ${isActive ? styles.categoryChipActive : ''}`}
                  onClick={() => handleCategoryClick(cat.value)}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
