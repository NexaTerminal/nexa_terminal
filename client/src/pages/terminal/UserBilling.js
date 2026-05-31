import TerminalShell from '../../components/terminal/TerminalShell';
import styles from './UserAccount.module.css';

/**
 * Billing / invoicing surface. Phase 1 = a static guidance page since the
 * pro-forma invoice / payment flow is fully manual (bank transfer + email).
 * Future: list past invoices and their amounts.
 */
export default function UserBillingPage() {
  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Сметка</span>
          <h1 className={styles.title}>Сметководство</h1>
          <p className={styles.lead}>
            Профактури и потврди за уплата. По избор на план, добивате
            профактура на е-пошта; по уплата, потврдата се чува тука.
          </p>
        </header>

        <section className={styles.panel}>
          <div className={styles.panelHead}>Како функционира уплатата</div>
          <ol className={styles.steps}>
            <li><strong>Изберете план</strong> — преку „Сметка → Изберете план".</li>
            <li><strong>Профактура на е-пошта</strong> — испратена веднаш по нарачката.</li>
            <li><strong>Грејс од 3 дена</strong> — еднократно, додека уплатата пристигне.</li>
            <li><strong>Уплата преку банкарски трансфер</strong> со податоците од профактурата.</li>
            <li><strong>Активирање</strong> — веднашно по верификација на уплатата.</li>
          </ol>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>Архива на профактури</div>
          <div className={styles.emptyState}>
            Сè уште нема архивирани профактури. По првата уплата, документите
            ќе бидат достапни тука за преземање.
          </div>
        </section>
      </div>
    </TerminalShell>
  );
}
