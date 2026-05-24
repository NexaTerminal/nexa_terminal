import { useState } from 'react';
import styles from './FaqAccordion.module.css';

export default function FaqAccordion({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <div className={styles.list}>
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className={styles.item}>
            <button
              type="button"
              className={styles.q}
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span>{it.q}</span>
              <span className={styles.icon} aria-hidden>{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && <div className={styles.a}>{it.a}</div>}
          </div>
        );
      })}
    </div>
  );
}
