import { useSearchParams } from 'react-router-dom';
import TerminalShell from '../../components/terminal/TerminalShell';
import { useAuth } from '../../contexts/AuthContext';
import { visibleTier } from '../../lib/tier';
import { BlogsSection } from './Blogs';
import NewsletterAdBooking from './NewsletterAdBooking';
import styles from './BlogSubmissions.module.css';

/**
 * „Маркетинг" hub — the member-facing marketing tools:
 *   ?tab=blog   → Блог статии (expert articles, editorial queue)  [Pro/admin]
 *   ?tab=banner → Банер во билтенот (newsletter ad-slot booking)  [Basic + Pro]
 * Blog is a Pro/provider surface: Basic (tier A) sees only the banner tab and
 * lands there directly via the „Банер во билтенот" sidebar item. Pro reaches
 * this hub through „Блог" (defaults to the blog tab).
 * Legacy /terminal/blogs redirects here (App.js).
 */
const ALL_TABS = [
  { key: 'blog',   label: 'Блог статии' },
  { key: 'banner', label: 'Банер во билтенот' }
];

export default function MarketingHub() {
  const { currentUser } = useAuth();
  const [params, setParams] = useSearchParams();
  // Blog is Pro/admin only; Basic gets the banner tab alone.
  const showsBlog = ['B', 'ADMIN'].includes(visibleTier(currentUser));
  const tabs = showsBlog ? ALL_TABS : ALL_TABS.filter(t => t.key === 'banner');
  const defaultTab = showsBlog ? 'blog' : 'banner';
  const tab = tabs.some(t => t.key === params.get('tab')) ? params.get('tab') : defaultTab;

  return (
    <TerminalShell>
      <div className={styles.page}>
        <span className={styles.eyebrow}>Маркетинг</span>
        <p className={styles.lead} style={{ marginBottom: 14 }}>
          {showsBlog
            ? 'Промовирајте го Вашиот бизнис преку Nexa — објавете стручна статија под Ваше име или резервирајте банер во месечниот билтен до 1000+ претплатници.'
            : 'Промовирајте го Вашиот бизнис преку Nexa — резервирајте банер во месечниот билтен до 1000+ претплатници.'}
        </p>
        {tabs.length > 1 && (
        <div className={styles.tabs} role="tablist">
          {tabs.map(t => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
              onClick={() => setParams({ tab: t.key }, { replace: true })}
            >
              {t.label}
            </button>
          ))}
        </div>
        )}
        {tab === 'banner' ? <NewsletterAdBooking /> : <BlogsSection />}
      </div>
    </TerminalShell>
  );
}
