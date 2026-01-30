import React, { useRef, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/terminal/Sidebar.module.css';

const Sidebar = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const location = useLocation();
  const screeningRef = useRef(null);
  const aiRef = useRef(null);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [isAISubmenuOpen, setIsAISubmenuOpen] = useState(false);

  // Close submenus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (screeningRef.current && !screeningRef.current.contains(event.target)) {
        setIsSubmenuOpen(false);
      }
      if (aiRef.current && !aiRef.current.contains(event.target)) {
        setIsAISubmenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleScreeningClick = () => {
    setIsSubmenuOpen(!isSubmenuOpen);
  };

  const handleAIClick = () => {
    setIsAISubmenuOpen(!isAISubmenuOpen);
  };

  // Screening submenu items
  const screeningSubItems = [
    { path: '/terminal/legal-screening', label: 'Правен' },
    { path: '/terminal/marketing-screening', label: 'Маркетинг' },
    { path: '/terminal/cyber-screening', label: 'Сајбер безбедност' }
  ];

  // AI submenu items
  const aiSubItems = [
    { path: '/terminal/ai-chat', label: 'Правен AI' },
    { path: '/terminal/marketing-ai', label: 'Маркетинг AI' }
  ];

  const regularMenuItems = [
    { path: '/terminal', label: 'common.dashboard' },
    { path: '/terminal/documents', label: 'dashboard.documentGenerator' },
    { path: '/terminal/find-lawyer', label: 'Најди адвокат', noTranslate: true },
    { path: '/terminal/contact', label: 'Вмрежување', noTranslate: true, disabled: true, comingSoon: 'Наскоро' },
    { path: '/terminal/education', label: 'Обуки', noTranslate: true }
  ];

  // Check if any screening route is active
  const isScreeningActive = screeningSubItems.some(item => location.pathname === item.path);

  // Check if any AI route is active
  const isAIActive = aiSubItems.some(item => location.pathname === item.path);

  const adminMenuItems = [
    { path: '/terminal/admin/blogs/add', label: 'Додади блог' },
    { path: '/terminal/admin/users', label: 'dashboard.manageUsers' },
    { path: '/terminal/admin/service-providers', label: 'Провајдери на услуги' },
    { path: '/terminal/admin/offer-requests', label: 'Барања за понуди' },
    { path: '/terminal/admin/chatbot', label: 'Управување со Chatbot' },
    { path: '/terminal/admin/newsletter/subscribers', label: 'Претплатници' },
    { path: '/terminal/admin/newsletter/create', label: 'Креирај билтен' },
    { path: '/terminal/admin/newsletter/analytics', label: 'Аналитика' },
  ];

  return (
    <aside className={styles["dashboard-sidebar"]}>

        {/* <div className={styles["dashboard-welcome"]}>
          <h2>{t("dashboard.welcome")}, {currentUser?.fullName || t("common.user")}</h2>
        </div> */}

      <nav className={styles["dashboard-menu"]}>
        {/* Dashboard and Documents */}
        {regularMenuItems.slice(0, 2).map(({ path, label, noTranslate }) => (
          <Link
            key={path}
            to={path}
            className={`${styles["menu-item"]} ${
              location.pathname === path ? styles.active : ""
            }`}
          >
            <h3>{noTranslate ? label : t(label)}</h3>
          </Link>
        ))}

        {/* Screening Menu with Submenu */}
        <div ref={screeningRef} className={styles["menu-item-with-submenu"]}>
          <div
            className={`${styles["menu-item"]} ${isScreeningActive ? styles.active : ""}`}
            onClick={handleScreeningClick}
            style={{ cursor: 'pointer' }}
          >
            <h3>Скрининг</h3>
            <span className={styles["submenu-arrow"]}>{isSubmenuOpen ? '▼' : '▶'}</span>
          </div>
          {isSubmenuOpen && (
            <div className={styles["submenu-inline"]}>
              {screeningSubItems.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`${styles["submenu-item-inline"]} ${
                    location.pathname === path ? styles.active : ""
                  }`}
                  onClick={() => setIsSubmenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Nexa AI Menu with Submenu */}
        <div ref={aiRef} className={styles["menu-item-with-submenu"]}>
          <div
            className={`${styles["menu-item"]} ${isAIActive ? styles.active : ""}`}
            onClick={handleAIClick}
            style={{ cursor: 'pointer' }}
          >
            <h3>Nexa AI</h3>
            <span className={styles["submenu-arrow"]}>{isAISubmenuOpen ? '▼' : '▶'}</span>
          </div>
          {isAISubmenuOpen && (
            <div className={styles["submenu-inline"]}>
              {aiSubItems.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`${styles["submenu-item-inline"]} ${
                    location.pathname === path ? styles.active : ""
                  }`}
                  onClick={() => setIsAISubmenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Remaining Menu Items */}
        {regularMenuItems.slice(2).map(({ path, label, noTranslate, disabled, comingSoon }) =>
          disabled ? (
            <div
              key={path}
              className={`${styles["menu-item"]} ${styles["menu-item-disabled"]}`}
              title={comingSoon || 'Coming Soon'}
            >
              <h3>{noTranslate ? label : t(label)}</h3>
              {comingSoon && <span className={styles["coming-soon-badge"]}>{comingSoon}</span>}
            </div>
          ) : (
            <Link
              key={path}
              to={path}
              className={`${styles["menu-item"]} ${
                location.pathname === path ? styles.active : ""
              }`}
            >
              <h3>{noTranslate ? label : t(label)}</h3>
            </Link>
          )
        )}

        {/* Admin Menu Items */}
        {currentUser?.role === 'admin' && (
          <div className={styles["admin-section"]}>
            <div className={styles["section-divider"]}>
              {t('dashboard.adminSection')}
            </div>
            {adminMenuItems.map(({ path, label, external }) => (
              external ? (
                <a
                  key={path}
                  href={path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles["menu-item"]}
                >
                  <h3>{t(label)}</h3>
                </a>
              ) : (
                <Link
                  key={path}
                  to={path}
                  className={`${styles["menu-item"]} ${
                    location.pathname === path ? styles.active : ""
                  }`}
                >
                  <h3>{t(label)}</h3>
                </Link>
              )
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
