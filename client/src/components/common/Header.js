import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const Header = ({ isTerminal = false }) => {
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const handleLogout = async () => {
    await logout();
    // Preserve language query parameter on logout
    const lang = new URLSearchParams(location.search).get('lang');
    navigate(lang ? `/?lang=${lang}` : '/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside); // Add touch support

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Close dropdown on location change
  useEffect(() => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location]);

  const renderNavLinks = () => (
    isTerminal ? (
      <div className={styles['profile-section']} ref={dropdownRef}>
        <button 
          className={styles['profile-button']} 
          onClick={toggleProfileDropdown}
          aria-expanded={profileDropdownOpen}
        >
          <span className={styles['profile-icon']}>👤</span>
          <span className={styles['profile-name']}>
            {currentUser?.companyInfo?.companyName || currentUser?.username || currentUser?.email}
          </span>
          <span 
            className={`${styles['dropdown-arrow']} ${profileDropdownOpen ? styles['dropdown-arrow-open'] : ''}`}
          >
            ▼
          </span>
        </button>
        {/* Profile dropdown with conditional class for animation */}
          <div 
            className={`${styles['profile-dropdown']} ${profileDropdownOpen ? styles['profile-dropdown-open'] : ''}`}
          >
            {/* <Link 
              to="/terminal/profile" 
              className={styles['dropdown-item']}
              onClick={() => setProfileDropdownOpen(false)}
            >
              <span className={styles['dropdown-icon']}>⚙️</span>
              {t('dashboard.editProfile')}
            </Link> */}
            <Link 
              to="/terminal/verification" 
              className={styles['dropdown-item']}
              onClick={() => setProfileDropdownOpen(false)}
            >
              <span className={styles['dropdown-icon']}>🏢</span>
              Профил
            </Link>
            <Link 
              to="/terminal/user" 
              className={styles['dropdown-item']}
              onClick={() => setProfileDropdownOpen(false)}
            >
              <span className={styles['dropdown-icon']}>👤</span>
              Корисник
            </Link>
            <button 
              onClick={(e) => {
                e.preventDefault();
                setProfileDropdownOpen(false);
                handleLogout();
              }}
              className={styles['dropdown-item']}
            >
              <span className={styles['dropdown-icon']}>🚪</span>
              {t('common.logout')}
            </button>
          </div>
      </div>
    ) : (
      <>
        <Link 
          to="/" 
          className={`${styles['nav-link']} ${location.pathname === '/' ? styles.active : ''}`}
        >
          {t('common.home')}
        </Link>
        <Link 
          to="/about" 
          className={`${styles['nav-link']} ${location.pathname === '/about' ? styles.active : ''}`}
        >
          {t('common.about')}
        </Link>
        <Link 
          to="/login" 
          className={`${styles['nav-link']} ${styles.loginButton} ${location.pathname === '/login' ? styles.active : ''}`}
        >
          {t('common.login')}
        </Link>
      </>
    )
  );

  return (
    <header className={styles.header}>
      <div className={styles['header-container']}>
        {/* Left section with logo */}
        <div className={styles['left-section']}>
          <Link to={isTerminal ? '/terminal' : '/'} className={`${styles.logo} ${isTerminal ? styles.logoTerminal : ''}`}>
            Nexa
          </Link>
        </div>

        {/* Right section with navigation, profile and language */}
        <div className={styles['desktop-right']}>
          <nav className={styles['nav-links']}>
            {renderNavLinks()}
          </nav>
          <LanguageSwitcher />
        </div>

        {/* Mobile menu button */}
        <button 
          className={`${styles.mobileMenuButton} ${mobileMenuOpen ? styles.open : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <div className={styles.hamburgerIcon}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>

        {/* Mobile menu */}
        <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.open : ''}`}>
          <nav className={styles.mobileNav}>
            {renderNavLinks()}
            <div className={styles.mobileLangSwitcher}>
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
