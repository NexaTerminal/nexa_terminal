import { useSearchParams } from 'react-router-dom';
import TerminalShell from '../../components/terminal/TerminalShell';
import { BlogsSection } from './Blogs';
import NewsletterAdBooking from './NewsletterAdBooking';
import styles from './BlogSubmissions.module.css';

/**
 * „Маркетинг" hub — the member-facing marketing tools, one sidebar entry for
 * every subscriber (Basic + Pro):
 *   ?tab=blog   → Блог статии (expert articles, editorial queue)
 *   ?tab=banner → Банер во билтенот (newsletter ad-slot booking)
 * Legacy /terminal/blogs redirects here (App.js).
 */
const TABS = [
  { key: 'blog',   label: 'Блог статии' },
  { key: 'banner', label: 'Банер во билтенот' }
];

export default function MarketingHub() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some(t => t.key === params.get('tab')) ? params.get('tab') : 'blog';

  return (
    <TerminalShell>
      <div className={styles.page}>
        <span className={styles.eyebrow}>Маркетинг</span>
        <p className={styles.lead} style={{ marginBottom: 14 }}>
          Промовирајте го Вашиот бизнис преку Nexa — објавете стручна статија под
          Ваше име или резервирајте банер во месечниот билтен до 1000+ претплатници.
        </p>
        <div className={styles.tabs} role="tablist">
          {TABS.map(t => (
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
        {tab === 'banner' ? <NewsletterAdBooking /> : <BlogsSection />}
      </div>
    </TerminalShell>
  );
}
