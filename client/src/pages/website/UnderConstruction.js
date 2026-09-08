import React from 'react';
import styles from './UnderConstruction.module.css';

/**
 * Simple "under construction" landing for nexa.mk. Shown when
 * config/construction.js → UNDER_CONSTRUCTION is true (main storefront only).
 * No login/signup or other links are rendered.
 */
export default function UnderConstruction() {
  return (
    <div className={styles.wrap}>
      <div className={styles.logo}>N E X A</div>
      <h1 className={styles.title}>Веб-страницата е во изградба</h1>
      <p className={styles.lead}>
        Работиме на нешто ново. Наскоро повторно достапно на nexa.mk.
        Ви благодариме на трпението.
      </p>
      <p className={styles.contact}>
        За прашања: <a href="mailto:contact@nexa.mk">contact@nexa.mk</a>
      </p>
    </div>
  );
}
