import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/website/PublicNavbar.module.css';

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.3)',
        padding: '1rem 0'
      }}
    >
      <div className={styles.container}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <img src="/nexa-logo-navbar.png" alt="Nexa Terminal" />
        </Link>

        {/* Desktop Navigation - START WITH BLOG ONLY (incremental) */}
        <div className={styles.desktopNav}>
          <Link to="/blog" className={styles.navLink}>Блог</Link>

          {/* Login Button - goes to landing page which has login */}
          <Link to="/" className={styles.loginButton}>
            Најави се
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className={styles.hamburger}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/blog" onClick={() => setMobileOpen(false)}>Блог</Link>
          <Link to="/" className={styles.mobileLogin} onClick={() => setMobileOpen(false)}>
            Најави се
          </Link>
        </div>
      )}
    </nav>
  );
}
