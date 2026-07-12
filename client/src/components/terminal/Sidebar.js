import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { visibleTier, showsMarketing, showsLeads, showsTopicsQA, showsSubUsers, showsFair, showsSourcing } from '../../lib/tier';
import styles from '../../styles/terminal/Sidebar.module.css';

/**
 * Nexa 3.0 sidebar — three semantic sections (РАБОТА / МРЕЖА / РЕСУРСИ),
 * each group is either a leaf link or a collapsible submenu with a
 * right-side hover flyout when collapsed.
 */

// Lightweight inline SVG icons (stroke-only, currentColor) — no library.
const Icon = ({ name }) => {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home':       return (<svg {...common}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/></svg>);
    case 'doc':        return (<svg {...common}><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/></svg>);
    case 'check':      return (<svg {...common}><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>);
    case 'ai':         return (<svg {...common}><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M5.5 18.5l2-2M16.5 7.5l2-2"/></svg>);
    case 'book':       return (<svg {...common}><path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z"/><path d="M9 7h6M9 11h6"/></svg>);
    case 'pencil':     return (<svg {...common}><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M14 6l4 4"/></svg>);
    case 'inbox':      return (<svg {...common}><path d="M3 13h5l1 3h6l1-3h5"/><path d="M3 13V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7"/><path d="M3 13v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/></svg>);
    case 'qa':         return (<svg {...common}><path d="M21 12a9 9 0 1 1-3.5-7.1"/><path d="M10 9a2 2 0 1 1 3 1.7c-1 .6-1 1.3-1 2.3"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></svg>);
    case 'store':      return (<svg {...common}><path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M9 20v-5h6v5"/></svg>);
    case 'rfq':        return (<svg {...common}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h4"/><circle cx="14.5" cy="15.5" r="2.2"/><path d="M16.2 17.2L18 19"/></svg>);
    case 'people':     return (<svg {...common}><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.5c2.6.4 4.5 2.7 4.5 5.5"/></svg>);
    default: return null;
  }
};

const Sidebar = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({});
  const toggleGroup = (key) => setOpenGroups((s) => ({ ...s, [key]: !s[key] }));

  // ── Sections — task-based grouping for the SMB owner ────────────────────
  // I. Администрација (handle obligations) · II. Набавки (buy) ·
  // III. Маркетинг и раст (sell/promote) · IV. Едукација (learn).
  // AI tools are distributed by job, not kept in an "AI" bucket.
  const userSections = [
    {
      key: 'top',
      label: null, // dashboard sits above the groups
      items: [
        { key: 'dashboard', icon: 'home', label: 'Контролна табла', path: '/terminal' }
      ]
    },
    {
      key: 'administration',
      label: 'Администрација',
      items: [
        {
          key: 'documents', icon: 'doc', label: 'Документи',
          children: [
            { path: '/terminal/documents',    label: 'Автоматизирани документи' },
            { path: '/terminal/my-templates', label: 'Мои шаблони' }
          ]
        },
        { key: 'employees', icon: 'people', label: 'Вработени', path: '/terminal/employees' },
        {
          key: 'contracts', icon: 'inbox', label: 'Договори',
          children: [
            { path: '/terminal/contracts',         label: 'Мои договори' },
            { path: '/terminal/contract-analysis', label: 'Анализа на договор' }
          ]
        },
        { key: 'legal-ai', icon: 'ai', label: 'Правен AI', path: '/terminal/ai-chat' },
        {
          key: 'screening', icon: 'check', label: 'Проверки',
          children: [
            { path: '/terminal/legal-screening', label: 'Правна' },
            { path: '/terminal/hr-screening',    label: 'HR и Оперативна' },
            { path: '/terminal/cyber-screening', label: 'Сајбер безбедност' }
          ]
        }
      ]
    },
    {
      key: 'procurement',
      label: 'Набавки',
      items: [
        { key: 'sourcing', icon: 'rfq', label: 'Барање за понуди', path: '/terminal/sourcing', visible: showsSourcing }
      ]
    },
    {
      key: 'growth',
      label: 'Маркетинг и раст',
      items: [
        { key: 'marketing-hub', icon: 'pencil', label: 'Маркетинг', path: '/terminal/marketing-hub', visible: showsMarketing },
        { key: 'marketing-ai', icon: 'ai', label: 'Маркетинг AI', path: '/terminal/marketing-ai' },
        { key: 'marketing-screening', icon: 'check', label: 'Маркетинг проверка', path: '/terminal/marketing-screening' },
        { key: 'fair',  icon: 'store', label: 'Виртуелен саем', path: '/terminal/fair', visible: showsFair },
        { key: 'leads', icon: 'inbox', label: 'Случаи', path: '/terminal/leads', visible: showsLeads },
        {
          key: 'topicsqa', icon: 'qa', label: 'Topics Q&A', visible: showsTopicsQA,
          children: [
            { path: '/terminal/topics-qa',               label: 'Отворени прашања' },
            { path: '/terminal/topics-qa?tab=mine',      label: 'Мои одговори' },
            { path: '/terminal/topics-qa?tab=published', label: 'Објавени' }
          ]
        }
      ]
    },
    {
      key: 'education-sec',
      label: 'Едукација',
      items: [
        { key: 'education', icon: 'book', label: 'Курсеви', path: '/terminal/education' }
      ]
    }
    // Account, Billing, Password, Под-сметки and AI преференци live in the
    // Header profile dropdown — see client/src/components/common/Header.js
  ];

  // ── Admin section (Martin) — kept flat, simple, no icons (utility role) ─
  const adminMenuItems = [
    {
      key: 'blogs-admin', label: 'Блогови',
      children: [
        { path: '/terminal/admin/blogs',          label: 'Управувај блогови' },
        { path: '/terminal/admin/blogs/add',      label: 'Додади блог' },
        { path: '/terminal/admin/blogs/pending',  label: 'Чекаат уреднички преглед' },
        { path: '/terminal/admin/newsletter-ads', label: 'Банери во билтен' }
      ]
    },
    {
      key: 'updates-admin', label: 'Известувања',
      children: [
        { path: '/terminal/admin/updates', label: 'Управувај известувања' }
      ]
    },
    {
      key: 'users-admin', label: 'Корисници',
      children: [
        { path: '/terminal/admin/all-users',               label: 'Сите корисници' },
        { path: '/terminal/admin/subscriptions',           label: 'Претплати' },
        { path: '/terminal/admin/subscriptions?tab=codes', label: 'Промо кодови' },
        { path: '/terminal/admin/invited-prospects',       label: 'Поканети потенцијални корисници' },
        { path: '/terminal/admin/proverka-funnel',         label: 'Проверка — функел' },
        { path: '/terminal/admin/pro-invoices',            label: 'Профактури' }
      ]
    },
    {
      key: 'marketplace-admin', label: 'Маркетплејс',
      children: [
        { path: '/terminal/admin/leads',             label: 'Клиенти' },
        { path: '/terminal/admin/service-providers', label: 'Провајдери на услуги' },
        { path: '/terminal/admin/offer-requests',    label: 'Барања за понуди' },
        { path: '/terminal/admin/fair',              label: 'Виртуелен саем' }
      ]
    },
    {
      key: 'inquiries-admin', label: 'Управување со барања',
      children: [
        { path: '/terminal/admin/inquiries',     label: 'Преглед на сите' },
        { path: '/terminal/admin/inquiries/new', label: 'Внеси ново барање' }
      ]
    },
    {
      key: 'topics-admin', label: 'Topics — работна листа',
      children: [
        { path: '/terminal/admin/topics/worklist',     label: 'Работна листа' },
        { path: '/terminal/admin/topics/worklist/new', label: 'Нова тема' },
        { path: '/terminal/admin/topics/submissions',  label: 'Поднесени Q&A' }
      ]
    },
    { key: 'chatbot-admin', path: '/terminal/admin/chatbot', label: 'Управување со Chatbot' }
  ];

  // ── Render helpers ──────────────────────────────────────────────────────
  const isPathActive = (path) => {
    if (!path) return false;
    const cleanPath = path.split('?')[0];
    return location.pathname === cleanPath;
  };

  const renderGroup = (item) => {
    if (item.visible && !item.visible(currentUser)) return null;

    // Leaf link.
    if (item.path) {
      return (
        <Link
          key={item.key || item.path}
          to={item.path}
          data-tour={item.key}
          className={`${styles['menu-item']} ${isPathActive(item.path) ? styles.active : ''}`}
        >
          {item.icon && <span className={styles['menu-icon']}><Icon name={item.icon} /></span>}
          <span className={styles['menu-label']}>{item.label}</span>
        </Link>
      );
    }

    // Collapsible group — closed by default, opens inline on click, child
    // active auto-expands; hover reveals right-side flyout when collapsed.
    const childActive = item.children.some((c) => isPathActive(c.path));
    const open = openGroups[item.key] !== undefined ? openGroups[item.key] : childActive;

    return (
      <div key={item.key} className={styles['menu-item-with-submenu']}>
        <button
          type="button"
          data-tour={item.key}
          className={`${styles['menu-item']} ${childActive ? styles.active : ''}`}
          onClick={() => toggleGroup(item.key)}
        >
          {item.icon && <span className={styles['menu-icon']}><Icon name={item.icon} /></span>}
          <span className={styles['menu-label']}>{item.label}</span>
          <span className={`${styles['submenu-chevron']} ${open ? styles['submenu-chevron-open'] : ''}`} aria-hidden>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
          </span>
        </button>

        {open && (
          <div className={styles['submenu-inline']}>
            {item.children.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`${styles['submenu-item-inline']} ${isPathActive(path) ? styles.active : ''}`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        {!open && (
          <div className={styles['submenu-flyout']}>
            <div className={styles['submenu-flyout-header']}>{item.label}</div>
            {item.children.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`${styles['submenu-flyout-item']} ${isPathActive(path) ? styles.active : ''}`}
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
        {userSections.map((section) => {
          // Hide entire section if every item is filtered out by visible()
          const anyVisible = section.items.some(
            (i) => !i.visible || i.visible(currentUser)
          );
          if (!anyVisible) return null;
          return (
            <div key={section.key} className={styles['nav-section']}>
              {section.label && <div className={styles['nav-section-label']}>{section.label}</div>}
              {section.items.map(renderGroup)}
            </div>
          );
        })}

        {currentUser?.role === 'admin' && (
          <div className={styles['admin-section']}>
            <div className={styles['nav-section-label']}>{t('dashboard.adminSection')}</div>
            {adminMenuItems.map(renderGroup)}
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
