import React from 'react';
import styles from './CitationChips.module.css';

/**
 * Verified-citation chips under an AI answer: every „Член N" the server
 * confirmed against the retrieved law text, with a confidence band from the
 * retrieval score. Unverified numbers (marked ⚠ in the text) are counted here.
 */

const BAND = {
  high: { label: 'висока', cls: 'high' },
  medium: { label: 'средна', cls: 'medium' },
  low: { label: 'ниска', cls: 'low' },
};

export default function CitationChips({ citations = [], unverified = [] }) {
  if (!citations.length && !unverified.length) return null;
  return (
    <div className={styles.row} aria-label="Проверени членови">
      {citations.map((c) => {
        const band = BAND[c.confidence] || BAND.low;
        return (
          <span key={c.article} className={styles.chip}
            title={`${c.law || c.documentName} · совпаѓање ${Math.round((c.score || 0) * 100)}%`}>
            <span className={styles.check} aria-hidden>✓</span>
            <span className={styles.article}>Член {c.article}</span>
            {c.law && <span className={styles.law}>{c.law}</span>}
            <span className={`${styles.band} ${styles[band.cls]}`}>{band.label}</span>
          </span>
        );
      })}
      {unverified.length > 0 && (
        <span className={`${styles.chip} ${styles.unverified}`}
          title={'Овие членови не се најдени во законските текстови користени за одговорот — проверете ги во „Службен весник“.'}>
          <span aria-hidden>⚠</span>
          <span>Непроверени: {unverified.map((n) => `чл. ${n}`).join(', ')}</span>
        </span>
      )}
    </div>
  );
}
