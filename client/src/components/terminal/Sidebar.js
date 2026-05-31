import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { visibleTier, showsBlogs, showsLeads, showsTopicsQA, showsSubUsers } from '../../lib/tier';
import styles from '../../styles/terminal/Sidebar.module.css';

/**
 * Nexa 3.0 sidebar — declarative config drives every group.
 * Each group has either `path` (leaf link) or `children` (collapsible submenu).
 * Visibility per group is controlled by the `visible(user)` predicate.
 */

const Sidebar = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({});
  const toggleGroup = (key) => setOpenGroups((s) => ({ ...s, [key]: !s[key] }));

  // ── User-facing groups (Type A/B/C/sub-seat) ────────────────────────────
  const userGroups = [
    {
      key: 'dashboard',
      label: 'Dashboard', path: '/terminal',
      labelMk: 'Контролна табла'
    },
    {
      key: 'documents',
      label: 'Документи',
      defaultOpen: true,
      children: [
        { path: '/terminal/documents',     label: 'Автоматизирани документи' },
        { path: '/terminal/my-templates',  label: 'Мои шаблони' }
      ]
    },
    {
      key: 'screening',
      label: 'Проверки',
      defaultOpen: true,
      children: [
        { path: '/terminal/legal-screening',     label: 'Правен' },
        { path: '/terminal/marketing-screening', label: 'Маркетинг' },
        { path: '/terminal/hr-screening',        label: 'HR и Оперативен' },
        { path: '/terminal/cyber-screening',     label: 'Сајбер безбедност' }
      ]
    },
    {
      key: 'education',
      label: 'Едукација', path: '/terminal/education',
      defaultOpen: true
    },
    {
      key: 'nexaai',
      label: 'Nexa AI',
      defaultOpen: true,
      children: [
        { path: '/terminal/ai-chat',           label: 'Правен AI' },
        { path: '/terminal/marketing-ai',      label: 'Маркетинг AI' },
        { path: '/terminal/contract-analysis', label: 'Анализа на договор' },
        { path: '/terminal/ai/stance',         label: 'Лични преференци' }
      ]
    },
    // ── B/C surfaces ──────────────────────────────────────────────────────
    {
      key: 'blogs',
      label: 'Блогови',
      visible: showsBlogs,
      children: [
        { path: '/terminal/blogs/submit',          label: 'Поднеси прилог' },
        { path: '/terminal/blogs/my-submissions',  label: 'Мои поднесувања' },
        { path: '/terminal/blogs/published',       label: 'Објавени' }
      ]
    },
    {
      key: 'leads',
      label: 'Барања',
      visible: showsLeads,
      children: [
        { path: '/terminal/leads',                   label: 'Интерна табла' },
        { path: '/terminal/leads?tab=claims',        label: 'Мои изразени интереси' },
        { path: '/terminal/leads?tab=engagements',   label: 'Мои ангажмани' }
      ]
    },
    {
      key: 'topicsqa',
      label: 'Topics Q&A',
      visible: showsTopicsQA,
      children: [
        { path: '/terminal/topics-qa',                 label: 'Отворени прашања' },
        { path: '/terminal/topics-qa?tab=mine',        label: 'Мои одговори' },
        { path: '/terminal/topics-qa?tab=published',   label: 'Објавени' }
      ]
    },
    {
      key: 'subusers',
      label: 'Под-сметки',
      visible: showsSubUsers,
      children: [
        { path: '/terminal/team',                  label: 'Активни сметки' },
        { path: '/terminal/team?tab=invitations',  label: 'Покани' },
        { path: '/terminal/team?tab=revoked',      label: 'Поништени' }
      ]
    },
    // Account/Profile/Billing live in the Header profile dropdown (top-right),
    // not in the sidebar. See client/src/components/common/Header.js.
  ];

  // ── Admin (Martin) groups — kept as-is from the existing sidebar plus
  // two new placeholders for Inquiries and Topics worklist (per prompt 02).
  const adminMenuItems = [
    {
      key: 'blogs-admin',
      label: 'Блогови',
      children: [
        { path: '/terminal/admin/blogs',         label: 'Управувај блогови' },
        { path: '/terminal/admin/blogs/add',     label: 'Додади блог' },
        { path: '/terminal/admin/blogs/pending', label: 'Чекаат уреднички преглед' }
      ]
    },
    {
      key: 'users-admin',
      label: 'Корисници',
      children: [
        { path: '/terminal/admin/all-users',     label: 'Сите корисници' },
        { path: '/terminal/admin/subscriptions', label: 'Претплати' }
      ]
    },
    {
      key: 'marketplace-admin',
      label: 'Маркетплејс',
      children: [
        { path: '/terminal/admin/leads',             label: 'Клиенти' },
        { path: '/terminal/admin/service-providers', label: 'Провајдери на услуги' },
        { path: '/terminal/admin/offer-requests',    label: 'Барања за понуди' }
      ]
    },
    {
      key: 'inquiries-admin',
      label: 'Управување со барања',
      children: [
        { path: '/terminal/admin/inquiries',     label: 'Преглед на сите' },
        { path: '/terminal/admin/inquiries/new', label: 'Внеси ново барање' }
      ]
    },
    {
      key: 'topics-admin',
      label: 'Topics — работна листа',
      children: [
        { path: '/terminal/admin/topics/worklist',     label: 'Работна листа' },
        { path: '/terminal/admin/topics/worklist/new', label: 'Нова тема' },
        { path: '/terminal/admin/topics/submissions',  label: 'Поднесени Q&A' }
      ]
    },
    { path: '/terminal/admin/chatbot',         label: 'Управување со Chatbot' }
  ];

  // ── Render helpers ──────────────────────────────────────────────────────
  const isPathActive = (path) => {
    if (!path) return false;
    // Strip query string when comparing against location.pathname.
    const cleanPath = path.split('?')[0];
    return location.pathname === cleanPath;
  };

  const renderGroup = (item) => {
    // Visibility predicate (skip if hidden).
    if (item.visible && !item.visible(currentUser)) return null;

    // Leaf link.
    if (item.path) {
      return (
        <Link
          key={item.key || item.path}
          to={item.path}
          className={`${styles['menu-item']} ${isPathActive(item.path) ? styles.active : ''}`}
        >
          <h3>{item.label}</h3>
        </Link>
      );
    }

    // Collapsible group. Default = collapsed (children visible only on hover
    // as a right-side flyout). Clicking the group toggles inline expansion.
    // A child being active auto-expands the parent so the active route is
    // always visible.
    const childActive = item.children.some((c) => isPathActive(c.path));
    const open = openGroups[item.key] !== undefined
      ? openGroups[item.key]
      : childActive;   // no more `defaultOpen` — fully collapsed on first load

    return (
      <div key={item.key} className={styles['menu-item-with-submenu']}>
        <div
          className={`${styles['menu-item']} ${childActive ? styles.active : ''}`}
          onClick={() => toggleGroup(item.key)}
          style={{ cursor: 'pointer' }}
        >
          <h3>{item.label}</h3>
          <span className={styles['submenu-arrow']}>{open ? '▼' : '▶'}</span>
        </div>
        {/* Inline children (always rendered when open — click-expanded) */}
        {open && (
          <div className={styles['submenu-inline']}>
            {item.children.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`${styles['submenu-item-inline']} ${
                  isPathActive(path) ? styles.active : ''
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
        {/* Hover flyout — rendered always but visible only on parent :hover
            when the group is NOT inline-expanded. Pure CSS, no JS state. */}
        {!open && (
          <div className={styles['submenu-flyout']}>
            <div className={styles['submenu-flyout-header']}>{item.label}</div>
            {item.children.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`${styles['submenu-flyout-item']} ${
                  isPathActive(path) ? styles.active : ''
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={styles['dashboard-sidebar']}>
      <nav className={styles['dashboard-menu']}>
        {userGroups.map(renderGroup)}

        {currentUser?.role === 'admin' && (
          <div className={styles['admin-section']}>
            <div className={styles['section-divider']}>
              {t('dashboard.adminSection')}
            </div>
            {adminMenuItems.map(renderGroup)}
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
