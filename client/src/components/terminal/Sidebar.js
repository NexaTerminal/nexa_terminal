import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/terminal/Sidebar.module.css';

const Sidebar = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const regularMenuItems = [
    { path: '/terminal', label: 'common.dashboard', icon: '📊' },
    { path: '/terminal/documents', label: 'dashboard.documentGenerator', icon: '📄' },
    { path: '/terminal/legal-screening', label: 'dashboard.legalScreening', icon: '⚖️' },
    { path: '/terminal/ai-chat', label: 'dashboard.nexaAI', icon: '🤖' },
    // { path: '/terminal/profile', label: 'Профил', icon: '👤', noTranslate: true },
    { path: '/terminal/contact', label: 'dashboard.contactUs', icon: '✉️' },
    { path: '/terminal/education', label: 'Обуки', icon: '🎓', noTranslate: true }
  ];

  const adminMenuItems = [
    { path: '/terminal/admin/blogs/add', label: 'Додади блог', icon: '✏️' },
    { path: '/terminal/admin/investments/add', label: 'dashboard.addInvestment', icon: '➕' },
    { path: '/terminal/admin/users', label: 'dashboard.manageUsers', icon: '👥' },
    { path: '/terminal/admin/verification', label: 'Verification Management', icon: '✅' },
    { path: '/terminal/admin/marketing', label: 'Маркетинг', icon: '📢' }
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Remove the mobile menu button to eliminate the floating circle */}
      {/* <button 
        className={styles["mobile-menu-button"]} 
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <span className={styles["hamburger-icon"]}></span>
      </button> */}

      <aside className={`${styles["dashboard-sidebar"]} ${isOpen ? styles["open"] : ""}`}>
        {/* <div className={styles["dashboard-welcome"]}>
          <h2>{t("dashboard.welcome")}, {currentUser?.fullName || t("common.user")}</h2>
        </div> */}

        <nav className={styles["dashboard-menu"]}>
          {/* Regular Menu Items */}
          {regularMenuItems.map(({ path, label, icon, noTranslate }) => (
            <Link
              key={path}
              to={path}
              className={`${styles["menu-item"]} ${
                location.pathname === path ? styles.active : ""
              }`}
            >
              <span className={styles["menu-icon"]}>{icon}</span>
              <h3>{noTranslate ? label : t(label)}</h3>
            </Link>
          ))}

          {/* Admin Menu Items */}
          {currentUser?.role === 'admin' && (
            <div className={styles["admin-section"]}>
              <div className={styles["section-divider"]}>
                {t('dashboard.adminSection')}
              </div>
              {adminMenuItems.map(({ path, label, icon, external }) => (
                external ? (
                  <a
                    key={path}
                    href={path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles["menu-item"]}
                  >
                    <span className={styles["menu-icon"]}>{icon}</span>
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
                    <span className={styles["menu-icon"]}>{icon}</span>
                    <h3>{t(label)}</h3>
                  </Link>
                )
              ))}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
