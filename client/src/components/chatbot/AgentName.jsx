import React from 'react';
import PropTypes from 'prop-types';
import styles from './AgentName.module.css';

/**
 * AgentName — an AI Team member's name as a heading/label, with a small muted
 * "·AI" tag so the human-sounding name (Лекс, Вера, …) still reads as an AI.
 * Use only where the name stands alone; inline prose keeps the plain name.
 */
export default function AgentName({ name }) {
  return (
    <>
      {name}
      <span className={styles.aiTag} aria-label="AI асистент">·AI</span>
    </>
  );
}

AgentName.propTypes = {
  name: PropTypes.string.isRequired,
};
