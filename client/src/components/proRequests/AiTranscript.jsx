import React from 'react';
import styles from './ProRequestThread.module.css';

/**
 * Renders the original AI conversation (question + AI answer) that preceded the
 * human handoff, so the whole history is visible and recorded in the thread. Parses
 * the stored transcript excerpt ("Speaker: text" turns joined by blank lines); falls
 * back to the question + AI summary when no transcript is available.
 */
function parseTranscript(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .split(/\n\s*\n/)
    .map((chunk) => {
      const m = chunk.match(/^\s*([^\n:]{1,40}):\s*([\s\S]*)$/);
      if (m) return { speaker: m[1].trim(), text: m[2].trim() };
      return { speaker: '', text: chunk.trim() };
    })
    .filter((t) => t.text);
}

export default function AiTranscript({ text, summary, question }) {
  const turns = parseTranscript(text);
  const fallback = !turns.length;
  if (fallback && !summary && !question) return null;

  return (
    <div className={styles.aiHistory}>
      <div className={styles.aiHistoryLabel}>📜 Разговор со AI</div>
      {!fallback
        ? turns.map((t, i) => {
            const isUser = t.speaker === 'Јас' || t.speaker === 'Јас ';
            return (
              <div key={i} className={`${styles.aiTurn} ${isUser ? styles.aiTurnUser : styles.aiTurnBot}`}>
                {t.speaker && <span className={styles.aiTurnSpeaker}>{isUser ? 'Корисник' : t.speaker}</span>}
                <div className={styles.aiTurnText}>{t.text}</div>
              </div>
            );
          })
        : (
          <>
            {question && (
              <div className={`${styles.aiTurn} ${styles.aiTurnUser}`}>
                <span className={styles.aiTurnSpeaker}>Корисник</span>
                <div className={styles.aiTurnText}>{question}</div>
              </div>
            )}
            {summary && (
              <div className={`${styles.aiTurn} ${styles.aiTurnBot}`}>
                <span className={styles.aiTurnSpeaker}>AI (резиме)</span>
                <div className={styles.aiTurnText}>{summary}</div>
              </div>
            )}
          </>
        )}
    </div>
  );
}
