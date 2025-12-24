import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import styles from '../../styles/common/SimpleNavbar.module.css';

export default function SimpleNavbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Check if we're on login or homepage
  const isLoginOrHome = location.pathname === '/login' || location.pathname === '/';

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
    </nav>
  );
}
