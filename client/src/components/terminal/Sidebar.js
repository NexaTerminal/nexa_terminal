import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/terminal/Sidebar.module.css';

const Sidebar = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const location = useLocation();

  const regularMenuItems = [
    { path: '/terminal', label: 'common.dashboard', icon: '📊' },
    { path: '/terminal/documents', label: 'dashboard.documentGenerator', icon: '📄' },
    { path: '/terminal/legal-screening', label: 'dashboard.legalScreening', icon: '⚖️' },
    { path: '/terminal/ai-chat', label: 'dashboard.nexaAI', icon: '🤖' },
    // { path: '/terminal/profile', label: 'Профил', icon: '👤', noTranslate: true },
    { path: '/terminal/find-lawyer', label: 'Најди адвокат', icon: '⚖️', noTranslate: true },
    { path: '/terminal/contact', label: 'Вмрежување', icon: '🤝', noTranslate: true, disabled: true, comingSoon: 'Наскоро' },
    { path: '/terminal/education', label: 'Обуки', icon: '🎓', noTranslate: true }
  ];

  const adminMenuItems = [
    { path: '/terminal/admin/blogs/add', label: 'Додади блог', icon: '✏️' },
    { path: '/terminal/admin/users', label: 'dashboard.manageUsers', icon: '👥' },
    { path: '/terminal/admin/service-providers', label: 'Провајдери на услуги', icon: '🏪' },
    { path: '/terminal/admin/offer-requests', label: 'Барања за понуди', icon: '📝' },
    { path: '/terminal/admin/chatbot', label: 'Управување со Chatbot', icon: '🤖' },
    { path: '/terminal/admin/newsletter/subscribers', label: 'Претплатници', icon: '📧' },
    { path: '/terminal/admin/newsletter/create', label: 'Креирај билтен', icon: '➕' },
    { path: '/terminal/admin/newsletter/analytics', label: 'Аналитика', icon: '📊' },
  ];

  return (
    <aside className={styles["dashboard-sidebar"]}>

        {/* <div className={styles["dashboard-welcome"]}>
          <h2>{t("dashboard.welcome")}, {currentUser?.fullName || t("common.user")}</h2>
        </div> */}

      <nav className={styles["dashboard-menu"]}>
        {/* Regular Menu Items */}
        {regularMenuItems.map(({ path, label, icon, noTranslate, disabled, comingSoon }) =>
          disabled ? (
            <div
              key={path}
              className={`${styles["menu-item"]} ${styles["menu-item-disabled"]}`}
              title={comingSoon || 'Coming Soon'}
            >
              <span className={styles["menu-icon"]}>{icon}</span>
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
              <span className={styles["menu-icon"]}>{icon}</span>
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
  );
};

export default Sidebar;
