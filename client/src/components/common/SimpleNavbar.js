import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoginModal from './LoginModal';
import styles from '../../styles/common/SimpleNavbar.module.css';

// Main blog categories for quick navigation (values match English DB groups)
const BLOG_CATEGORIES = [
  { label: 'Сите', value: 'ALL' },
  { label: 'Усогласеност', value: 'LEGAL' },
  { label: 'Претприемништво', value: 'BUSINESS' },
  { label: 'Маркетинг', value: 'MARKETING' },
  { label: 'Инвестиции', value: 'INVESTMENT' },
];

export default function SimpleNavbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we're on login or homepage
  const isLoginOrHome = location.pathname === '/login' || location.pathname === '/';

  // Check if we're on individual blog post pages (not the listing)
  const isBlogPostPage = location.pathname.startsWith('/blog/') && location.pathname !== '/blog/';

  // Handle category click - navigate to blog with category
  const handleCategoryClick = (category) => {
    if (category === 'ALL') {
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
        </div>

        {/* Login button - hidden on login/homepage */}
        {!isLoginOrHome && (
          <button
            className={styles.loginButton}
            onClick={() => setShowLoginModal(true)}
          >
            Најава
          </button>
        )}
      </div>

      {/* Category bar - shown on individual blog post pages only */}
      {isBlogPostPage && !isLoginOrHome && (
        <div className={styles.categoryBar}>
          <div className={styles.categoryBarContent}>
            {BLOG_CATEGORIES.map((cat) => {
              // Get current category from URL
              const urlParams = new URLSearchParams(location.search);
              const currentCategory = urlParams.get('category') || 'ALL';
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
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        redirectPath="/terminal"
      />
    </nav>
  );
}
