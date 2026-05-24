import Header from '../common/Header';
import Sidebar from './Sidebar';
import styles from './TerminalShell.module.css';

/**
 * Standard shell for authenticated terminal pages.
 * Replicates the layout shape used by /terminal (Dashboard.js) so admin and
 * admin-user pages don't render the public navbar or overlap with the sidebar.
 *
 * Usage:
 *   <TerminalShell>
 *     <h1>...</h1>
 *     ...
 *   </TerminalShell>
 */
export default function TerminalShell({ children }) {
  return (
    <div className={styles.shell}>
      <Header isTerminal={true} />
      <div className={styles.body}>
        <Sidebar />
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
}
