import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { useAuth } from '../../contexts/AuthContext';
import { useCredit } from '../../contexts/CreditContext';
import { useTranslation } from 'react-i18next';
// import LanguageSwitcher from './LanguageSwitcher'; // DISABLED FOR NOW

const Header = ({ isTerminal = false }) => {
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const { credits, loading: creditsLoading } = useCredit();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);
  const creditModalRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Invitation form state
  const [inviteEmails, setInviteEmails] = useState({ email1: '', email2: '', email3: '' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState(null); // { type: 'success' | 'error', text: string }

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const toggleCreditModal = () => {
    setCreditModalOpen(!creditModalOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = async () => {
    await logout();
    // Preserve language query parameter on logout
    const lang = new URLSearchParams(location.search).get('lang');
    navigate(lang ? `/?lang=${lang}` : '/');
  };

  const handleInviteEmailChange = (field, value) => {
    setInviteEmails(prev => ({ ...prev, [field]: value }));
    // Clear message when user starts typing
    if (inviteMessage) setInviteMessage(null);
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    console.log('🎯 [Header] Invitation form submitted');
    setInviteLoading(true);
    setInviteMessage(null);

    try {
      // Collect non-empty emails
      const emails = [inviteEmails.email1, inviteEmails.email2, inviteEmails.email3]
        .map(email => email.trim())
        .filter(email => email.length > 0);

      console.log('📧 [Header] Collected emails:', emails);

      if (emails.length === 0) {
        console.warn('⚠️ [Header] No emails provided');
        setInviteMessage({
          type: 'error',
          text: 'Ве молиме внесете барем еден email.'
        });
        setInviteLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emails.filter(email => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        console.warn('⚠️ [Header] Invalid email format:', invalidEmails);
        setInviteMessage({
          type: 'error',
          text: `Невалиден email формат: ${invalidEmails.join(', ')}`
        });
        setInviteLoading(false);
        return;
      }

      console.log('✅ [Header] All emails valid, sending to API...');
      const token = localStorage.getItem('token');
      console.log('🔑 [Header] Token exists:', !!token);

      const response = await fetch('/api/referrals/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ emails })
      });

      console.log('📡 [Header] API Response status:', response.status);
      const data = await response.json();
      console.log('📦 [Header] API Response data:', data);

      if (response.ok) {
        console.log('✅ [Header] Invitations sent successfully');
        setInviteMessage({
          type: 'success',
          text: `✅ ${data.message || `Успешно испратени ${data.results?.sent?.length || emails.length} покани!`}`
        });
        // Clear inputs after success
        setInviteEmails({ email1: '', email2: '', email3: '' });
      } else {
        console.error('❌ [Header] API returned error:', data);
        setInviteMessage({
          type: 'error',
          text: data.message || data.error || 'Грешка при испраќање на поканите.'
        });
      }
    } catch (error) {
      console.error('❌ [Header] Error sending invitations:', error);
      setInviteMessage({
        type: 'error',
        text: 'Грешка при испраќање на поканите. Ве молиме обидете се повторно.'
      });
    } finally {
      console.log('🏁 [Header] Invitation process complete');
      setInviteLoading(false);
    }
  };

  // Close dropdown, modal, and mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (creditModalRef.current && !creditModalRef.current.contains(event.target)) {
        setCreditModalOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside); // Add touch support

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Close dropdown, modal, and mobile menu on location change
  useEffect(() => {
    setProfileDropdownOpen(false);
    setCreditModalOpen(false);
    setMobileMenuOpen(false);
  }, [location]);


  // Sidebar navigation items (for mobile menu)
  const regularMenuItems = [
    { path: '/terminal', label: 'common.dashboard', icon: '📊' },
    { path: '/terminal/documents', label: 'dashboard.documentGenerator', icon: '📄' },
    { path: '/terminal/legal-screening', label: 'dashboard.legalScreening', icon: '⚖️' },
    { path: '/terminal/ai-chat', label: 'dashboard.nexaAI', icon: '🤖' },
    { path: '/terminal/find-lawyer', label: 'Најди адвокат', icon: '⚖️', noTranslate: true },
    { path: '/terminal/contact', label: 'Вмрежување', icon: '🤝', noTranslate: true, disabled: true, comingSoon: 'Наскоро' },
    { path: '/terminal/education', label: 'Обуки', icon: '🎓', noTranslate: true }
  ];

  const adminMenuItems = [
    { path: '/terminal/admin/blogs/add', label: 'Додади блог', icon: '✏️', noTranslate: true },
    { path: '/terminal/admin/users', label: 'dashboard.manageUsers', icon: '👥' },
    { path: '/terminal/admin/service-providers', label: 'Провајдери на услуги', icon: '🏪', noTranslate: true },
    { path: '/terminal/admin/offer-requests', label: 'Барања за понуди', icon: '📝', noTranslate: true },
    { path: '/terminal/admin/chatbot', label: 'Управување со Chatbot', icon: '🤖', noTranslate: true },
  ];

  const renderNavLinks = () => {
    return isTerminal ? (
      <div className={styles['profile-section']}>
        {/* Credit Badge - Always visible credit counter */}
        {!creditsLoading && credits && (
          <button
            onClick={toggleCreditModal}
            className={styles['credit-badge']}
            data-low={credits.balance <= 3 && credits.balance > 0}
            data-depleted={credits.balance === 0}
            title={`${credits.balance} од ${credits.weeklyAllocation} кредити преостануваат`}
          >
            {credits.balance}/{credits.weeklyAllocation}
          </button>
        )}

        <div ref={dropdownRef}>
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

        {/* Credit Modal */}
        {creditModalOpen && (
          <div className={styles['modal-overlay']} onClick={() => setCreditModalOpen(false)}>
            <div
              ref={creditModalRef}
              className={styles['credit-modal']}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles['modal-header']}>
                <h3>Кредити</h3>
                <button
                  className={styles['modal-close']}
                  onClick={() => setCreditModalOpen(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className={styles['modal-body']}>
                <div className={styles['credit-explanation']}>
                  <p>
                    Секој понеделник добивате 14 кредити за користење на платформата.
                    Секоја акција троши 1 кредит. Покани пријатели и заработи дополнителни
                    кредити за побрза работа и повеќе можности.
                  </p>
                </div>

                <div className={styles['credit-info-section']}>
                  <div className={styles['credit-stat']}>
                    <span className={styles['stat-label']}>Тековен баланс</span>
                    <span className={styles['stat-value']}>{credits?.balance || 0}</span>
                  </div>
                  <div className={styles['credit-stat']}>
                    <span className={styles['stat-label']}>Неделна алокација</span>
                    <span className={styles['stat-value']}>{credits?.weeklyAllocation || 14}</span>
                  </div>
                  <div className={styles['credit-stat']}>
                    <span className={styles['stat-label']}>Следно обновување</span>
                    <span className={styles['stat-value']}>
                      {credits?.nextResetDate
                        ? new Date(credits.nextResetDate).toLocaleDateString('mk-MK', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className={styles['invite-section']}>
                  <h4>Покани пријатели</h4>
                  <p className={styles['invite-description']}>
                    За секој пријател кој се регистрира, добиваш 2 дополнителни кредити.
                  </p>

                  {inviteMessage && (
                    <div className={styles[`invite-message-${inviteMessage.type}`]}>
                      {inviteMessage.text}
                    </div>
                  )}

                  <form className={styles['invite-form']} onSubmit={handleInviteSubmit}>
                    <div className={styles['input-group']}>
                      <label htmlFor="email1">Email 1</label>
                      <input
                        type="email"
                        id="email1"
                        value={inviteEmails.email1}
                        onChange={(e) => handleInviteEmailChange('email1', e.target.value)}
                        placeholder="prv.prijatel@example.com"
                        className={styles['email-input']}
                        disabled={inviteLoading}
                      />
                    </div>
                    <div className={styles['input-group']}>
                      <label htmlFor="email2">Email 2 (опционално)</label>
                      <input
                        type="email"
                        id="email2"
                        value={inviteEmails.email2}
                        onChange={(e) => handleInviteEmailChange('email2', e.target.value)}
                        placeholder="vtor.prijatel@example.com"
                        className={styles['email-input']}
                        disabled={inviteLoading}
                      />
                    </div>
                    <div className={styles['input-group']}>
                      <label htmlFor="email3">Email 3 (опционално)</label>
                      <input
                        type="email"
                        id="email3"
                        value={inviteEmails.email3}
                        onChange={(e) => handleInviteEmailChange('email3', e.target.value)}
                        placeholder="tret.prijatel@example.com"
                        className={styles['email-input']}
                        disabled={inviteLoading}
                      />
                    </div>
                    <button
                      type="submit"
                      className={styles['invite-button']}
                      disabled={inviteLoading}
                    >
                      {inviteLoading ? 'Се испраќа...' : 'Испрати покани'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
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
    );
  };

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

        {/* Mobile hamburger button (terminal only) */}
        {isTerminal && (
          <button
            className={styles['mobile-menu-button']}
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <span className={`${styles['hamburger-icon']} ${mobileMenuOpen ? styles['hamburger-open'] : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        )}
      </div>

      {/* Mobile Menu Drawer (terminal only) */}
      {isTerminal && (
        <div
          ref={mobileMenuRef}
          className={`${styles['mobile-menu']} ${mobileMenuOpen ? styles['mobile-menu-open'] : ''}`}
        >
          <div className={styles['mobile-menu-header']}>
            <div className={styles['mobile-user-info']}>
              <span className={styles['mobile-user-icon']}>👤</span>
              <span className={styles['mobile-user-name']}>
                {currentUser?.companyInfo?.companyName || currentUser?.username || currentUser?.email}
              </span>
            </div>
            {!creditsLoading && credits && (
              <div className={styles['mobile-credit-badge']}>
                {credits.balance}/{credits.weeklyAllocation}
              </div>
            )}
          </div>

          <nav className={styles['mobile-menu-nav']}>
            {/* Regular Menu Items */}
            {regularMenuItems.map(({ path, label, icon, noTranslate, disabled, comingSoon }) =>
              disabled ? (
                <div
                  key={path}
                  className={`${styles['mobile-menu-item']} ${styles['mobile-menu-item-disabled']}`}
                >
                  <span className={styles['mobile-menu-icon']}>{icon}</span>
                  <span>{noTranslate ? label : t(label)}</span>
                  {comingSoon && <span className={styles['mobile-coming-soon']}>{comingSoon}</span>}
                </div>
              ) : (
                <Link
                  key={path}
                  to={path}
                  className={`${styles['mobile-menu-item']} ${
                    location.pathname === path ? styles['mobile-menu-item-active'] : ''
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className={styles['mobile-menu-icon']}>{icon}</span>
                  <span>{noTranslate ? label : t(label)}</span>
                </Link>
              )
            )}

            {/* Admin Menu Items */}
            {currentUser?.role === 'admin' && (
              <>
                <div className={styles['mobile-menu-divider']}>
                  {t('dashboard.adminSection')}
                </div>
                {adminMenuItems.map(({ path, label, icon, noTranslate }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`${styles['mobile-menu-item']} ${
                      location.pathname === path ? styles['mobile-menu-item-active'] : ''
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className={styles['mobile-menu-icon']}>{icon}</span>
                    <span>{noTranslate ? label : t(label)}</span>
                  </Link>
                ))}
              </>
            )}

            {/* User Actions Divider */}
            <div className={styles['mobile-menu-divider']}>
              Корисник
            </div>

            {/* User Profile Links */}
            <Link
              to="/terminal/verification"
              className={styles['mobile-menu-item']}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className={styles['mobile-menu-icon']}>🏢</span>
              <span>Профил</span>
            </Link>
            <Link
              to="/terminal/user"
              className={styles['mobile-menu-item']}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className={styles['mobile-menu-icon']}>👤</span>
              <span>Корисник</span>
            </Link>
            <button
              className={styles['mobile-menu-item']}
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
            >
              <span className={styles['mobile-menu-icon']}>🚪</span>
              <span>{t('common.logout')}</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
