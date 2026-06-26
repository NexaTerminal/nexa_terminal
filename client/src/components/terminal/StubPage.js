import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from './TerminalShell';
import TrialDisabledNotice from './TrialDisabledNotice';
import { previewMode } from '../../lib/tier';
import styles from './StubPage.module.css';

/**
 * Shared layout for Nexa 3.0 placeholder pages (Blogs, Leads, Topics Q&A,
 * Stance Preferences, admin Inquiries, admin Topics worklist).
 *
 * Renders: page header + optional sub-tab labels (visually inactive) +
 * the locked-feature notice for any user without active paid access +
 * a short explanatory paragraph.
 *
 * Real UX lands in prompts 03/04/05/06.
 */
export default function StubPage({ title, subtabs = [], blurb, showTrialNotice = true }) {
  const { currentUser } = useAuth();
  const locked = previewMode(currentUser);

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          {subtabs.length > 0 && (
            <div className={styles.tabs} role="tablist" aria-label={title}>
              {subtabs.map((tab, i) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={i === 0}
                  disabled
                  className={`${styles.tab} ${i === 0 ? styles.tabActive : ''}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </header>

        {showTrialNotice && locked && <TrialDisabledNotice />}

        <div className={styles.body}>
          <p className={styles.blurb}>
            {blurb || 'Овој дел е дел од Nexa 3.0. Корисничкиот интерфејс се гради; ставката во страничното мени постои за да видите каде ќе биде сместен.'}
          </p>
        </div>
      </div>
    </TerminalShell>
  );
}
