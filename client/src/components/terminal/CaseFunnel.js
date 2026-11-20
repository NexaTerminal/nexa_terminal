import React, { useEffect, useRef, useState } from 'react';
import styles from '../../styles/terminal/CaseFunnel.module.css';

/**
 * „Случаи" hero: network sites on the left → animated flow lines → one case
 * base on the right, with the area filter chips underneath.
 * Paths are generated from the source count and the measured width (1 SVG
 * unit = 1px), so envelopes travel along them without being stretched and
 * adding/removing a site needs no SVG edits.
 */

const ROW = 32;      // 28px source height + 4px gap
const DUR = 3.6;     // seconds per envelope trip

// Small envelope glyph centred on (0,0) so animateMotion moves its middle.
const Envelope = () => (
  <g className={styles.envelope}>
    <rect x="-7" y="-5" width="14" height="10" rx="2" />
    <path d="M-6 -3.5 0 1 6 -3.5" />
  </g>
);

const ExtIcon = () => (
  <svg className={styles.ext} width="14" height="14" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

const CaseFunnel = ({ sources, categories, active, onSelect, labelOf }) => {
  const wrapRef = useRef(null);
  const [W, setW] = useState(200);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([e]) => setW(Math.max(80, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = sources.length;
  const height = ROW * n - 4;
  const hubY = height / 2;
  const paths = sources.map((_, i) => {
    const y = 14 + ROW * i;
    return y === hubY
      ? `M0 ${y} L${W} ${hubY}`
      : `M0 ${y} C${W * 0.55} ${y} ${W * 0.45} ${hubY} ${W} ${hubY}`;
  });

  return (
    <section className={styles.cf} aria-labelledby="cf-title">
      <p className={styles.eyebrow}>Случаи</p>
      <h2 className={styles.title} id="cf-title">Едно место за прашањата од целата мрежа</h2>
      <p className={styles.sub}>
        Посетителите поставуваат прашања на нашите специјализирани страници. Сите пристигнуваат тука, подредени по правна област.
      </p>

      <div className={styles.flow}>
        <ul className={styles.sources} aria-label="Страници од мрежата">
          {sources.map((host) => (
            <li key={host}>
              <a className={styles.src} href={`https://${host}`} target="_blank" rel="noopener noreferrer">
                <span className={styles.dot} aria-hidden="true" />
                {host}
                <ExtIcon />
              </a>
            </li>
          ))}
        </ul>

        <div className={styles.linesWrap} ref={wrapRef} aria-hidden="true">
          <svg className={styles.lines} viewBox={`0 0 ${W} ${height}`} aria-hidden="true">
            <g>{paths.map((d, i) => <path key={i} className={styles.base} d={d} />)}</g>
            <g className={styles.mail}>
              {paths.map((d, i) => {
                const begin = `${-((i * 1.45) % DUR).toFixed(2)}s`;
                return (
                  <g key={i} opacity="0">
                    <Envelope />
                    <animateMotion dur={`${DUR}s`} begin={begin} repeatCount="indefinite" path={d} />
                    <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.82;1"
                             dur={`${DUR}s`} begin={begin} repeatCount="indefinite" />
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <div className={styles.hub}>
          <div className={styles.hubIcon} aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-6l-2 3h-4l-2-3H2" />
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
          </div>
          <h3>База на случаи</h3>
          <p>Секое прашање станува случај, подреден по правна област.</p>
        </div>
      </div>

      {categories.length > 0 && (
        <div className={styles.cats}>
          <p className={styles.catsLabel} id="cf-cats-label">Разгледајте ги случаите по област</p>
          <div className={styles.chips} role="tablist" aria-labelledby="cf-cats-label">
            <button type="button" role="tab" aria-selected={active === ''}
                    className={`${styles.chip} ${active === '' ? styles.isActive : ''}`}
                    onClick={() => onSelect('')}>
              Сите
            </button>
            {categories.map(({ key, count }) => (
              <button key={key} type="button" role="tab" aria-selected={active === key}
                      className={`${styles.chip} ${active === key ? styles.isActive : ''}`}
                      onClick={() => onSelect(key)}>
                {labelOf(key)}
                {count > 0 && <span className={styles.count}>{count}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default CaseFunnel;
