import React from 'react';
import { Link } from 'react-router-dom';
import styles from './GlobalDisclaimerBar.module.css';

/**
 * Always-on, minimal disclaimer strip shown across the whole terminal.
 * Nexa is a tool/channel — it does not give legal advice and is not liable for
 * content, advice or outcomes. Kept clear of the bottom-right AI chat dock.
 */
const GlobalDisclaimerBar = () => (
  <div className={styles.bar} role="note">
    <span className={styles.text}>
      ℹ️ Nexa е алатка — не дава правен совет и NEXA AMD не одговара за содржината или исходот.
    </span>
    <Link to="/terminal/disclaimer" className={styles.link}>Услови за користење</Link>
  </div>
);

export default GlobalDisclaimerBar;
