import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
// import LanguageSwitcher from './LanguageSwitcher'; // DISABLED FOR NOW

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

  // Navigation links for regular menu items
  const regularMenuItems = [
    { path: '/terminal', label: 'common.dashboard', icon: '📊' },
    { path: '/terminal/documents', label: 'dashboard.documentGenerator', icon: '📄' },
    { path: '/terminal/legal-screening', label: 'dashboard.legalScreening', icon: '⚖️' },
    { path: '/terminal/ai-chat', label: 'dashboard.nexaAI', icon: '🤖' },
    { path: '/terminal/find-lawyer', label: 'Најди адвокат', icon: '⚖️', noTranslate: true },
    { path: '/terminal/contact', label: 'Побарај понуда', icon: '💼', noTranslate: true },
    { path: '/terminal/education', label: 'Обуки', icon: '🎓', noTranslate: true }
  ];

  const adminMenuItems = [
    { path: '/terminal/admin/blogs/add', label: 'Додади блог', icon: '✏️', noTranslate: true },
    { path: '/terminal/admin/users', label: 'dashboard.manageUsers', icon: '👥' },
    { path: '/terminal/admin/service-providers', label: 'Провајдери на услуги', icon: '🏪', noTranslate: true },
    { path: '/terminal/admin/offer-requests', label: 'Барања за понуди', icon: '📝', noTranslate: true },
  ];

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

  // Mobile menu content with navigation links and logout
  const renderMobileMenu = () => (
    isTerminal ? (
      <>
        <div className={styles['mobileUserInfo']}>
          <span className={styles['mobileUserIcon']}>👤</span>
          <span className={styles['mobileUserName']}>
            {currentUser?.companyInfo?.companyName || currentUser?.username || currentUser?.email}
          </span>
        </div>

        <div className={styles['mobileMenuLinks']}>
          {regularMenuItems.map(({ path, label, icon, noTranslate }) => (
            <Link
              key={path}
              to={path}
              className={`${styles['mobileMenuItem']} ${location.pathname === path ? styles.active : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className={styles['mobileMenuIcon']}>{icon}</span>
              <span>{noTranslate ? label : t(label)}</span>
            </Link>
          ))}

          {currentUser?.role === 'admin' && (
            <>
              <div className={styles['mobileDivider']}>
                <span>{t('dashboard.adminSection')}</span>
              </div>
              {adminMenuItems.map(({ path, label, icon, noTranslate }) => (
                <Link
                  key={path}
                  to={path}
                  className={`${styles['mobileMenuItem']} ${location.pathname === path ? styles.active : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className={styles['mobileMenuIcon']}>{icon}</span>
                  <span>{noTranslate ? label : t(label)}</span>
                </Link>
              ))}
            </>
          )}
        </div>

        <div className={styles['mobileMenuFooter']}>
          <Link
            to="/terminal/verification"
            className={styles['mobileMenuItem']}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className={styles['mobileMenuIcon']}>🏢</span>
            <span>Профил</span>
          </Link>
          <Link
            to="/terminal/user"
            className={styles['mobileMenuItem']}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className={styles['mobileMenuIcon']}>👤</span>
            <span>Корисник</span>
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className={`${styles['mobileMenuItem']} ${styles['logoutButton']}`}
          >
            <span className={styles['mobileMenuIcon']}>🚪</span>
            <span>{t('common.logout')}</span>
          </button>
        </div>
      </>
    ) : (
      <>
        <Link
          to="/"
          className={`${styles['mobileMenuItem']} ${location.pathname === '/' ? styles.active : ''}`}
          onClick={() => setMobileMenuOpen(false)}
        >
          {t('common.home')}
        </Link>
        <Link
          to="/about"
          className={`${styles['mobileMenuItem']} ${location.pathname === '/about' ? styles.active : ''}`}
          onClick={() => setMobileMenuOpen(false)}
        >
          {t('common.about')}
        </Link>
        <Link
          to="/login"
          className={`${styles['mobileMenuItem']} ${location.pathname === '/login' ? styles.active : ''}`}
          onClick={() => setMobileMenuOpen(false)}
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
            <img 
              src="/nexa-logo-navbar.png" 
              alt="Nexa Terminal" 
              className={styles['logo-image']}
            />
          </Link>
        </div>

        {/* Right section with navigation, profile and language */}
        <div className={styles['desktop-right']}>
          <nav className={styles['nav-links']}>
            {renderNavLinks()}
          </nav>
          {/* <LanguageSwitcher /> DISABLED FOR NOW */}
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
            {renderMobileMenu()}
            <div className={styles.mobileLangSwitcher}>
              {/* <LanguageSwitcher /> DISABLED FOR NOW */}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
