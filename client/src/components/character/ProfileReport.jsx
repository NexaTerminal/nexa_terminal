import s from './ProfileReport.module.css';

/**
 * Big Five profile report — the "full visual graphic" the inviting owner sees.
 * Pure SVG (radar pentagon) + horizontal trait bars + per-dimension interpretation
 * cards. `report` is the array produced by server data/characterAssessmentQuestions
 * (score()): [{ dimension, label, blurb, score, band, bandLabel, interpretation }].
 */

const BAND_CLASS = { high: s.bandHigh, mid: s.bandMid, low: s.bandLow };
const SIZE = 260;
const CENTER = SIZE / 2;
const R = 96; // radius to the 100-score ring

// Regular pentagon vertex (i of 5), scaled by frac (0..1). Start at top (−90°).
function vertex(i, frac) {
  const ang = (-90 + i * 72) * (Math.PI / 180);
  return [CENTER + Math.cos(ang) * R * frac, CENTER + Math.sin(ang) * R * frac];
}
const toPoints = (fracs) => fracs.map((f, i) => vertex(i, f).join(',')).join(' ');

export default function ProfileReport({ candidateName, role, report = [], disclaimer, completedAt }) {
  const dims = report.filter((d) => d.score != null);
  const fracs = dims.map((d) => Math.max(0.04, d.score / 100));
  const rings = [0.25, 0.5, 0.75, 1];

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'long', day: 'numeric' }) : '');

  return (
    <div className={s.report}>
      <header className={s.head}>
        <div>
          <h2 className={s.name}>{candidateName}</h2>
          {role ? <p className={s.role}>{role}</p> : null}
        </div>
        {completedAt ? <span className={s.date}>Одговорено: {fmtDate(completedAt)}</span> : null}
      </header>

      <div className={s.grid}>
        {/* Radar pentagon */}
        <div className={s.radarWrap}>
          <svg className={s.radar} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Профил (радар)">
            {rings.map((r, i) => (
              <polygon key={i} className={s.ring} points={toPoints(dims.map(() => r))} />
            ))}
            {dims.map((_, i) => {
              const [x, y] = vertex(i, 1);
              return <line key={i} className={s.axis} x1={CENTER} y1={CENTER} x2={x} y2={y} />;
            })}
            <polygon className={s.area} points={toPoints(fracs)} />
            {dims.map((d, i) => {
              const [x, y] = vertex(i, 1.16);
              return (
                <text key={d.dimension} className={s.axisLabel} x={x} y={y}
                      textAnchor={x < CENTER - 4 ? 'end' : x > CENTER + 4 ? 'start' : 'middle'}
                      dominantBaseline="middle">
                  {d.label}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Score bars */}
        <div className={s.bars}>
          {dims.map((d) => (
            <div key={d.dimension} className={s.barRow}>
              <div className={s.barTop}>
                <span className={s.barLabel}>{d.label}</span>
                <span className={`${s.barBadge} ${BAND_CLASS[d.band]}`}>{d.bandLabel} · {d.score}</span>
              </div>
              <div className={s.barTrack}>
                <div className={`${s.barFill} ${BAND_CLASS[d.band]}`} style={{ width: `${d.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interpretation cards */}
      <div className={s.cards}>
        {dims.map((d) => (
          <div key={d.dimension} className={s.card}>
            <div className={s.cardHead}>
              <span className={s.cardTitle}>{d.label}</span>
              <span className={`${s.cardBadge} ${BAND_CLASS[d.band]}`}>{d.bandLabel}</span>
            </div>
            <p className={s.cardBlurb}>{d.blurb}</p>
            <p className={s.cardText}>{d.interpretation}</p>
          </div>
        ))}
      </div>

      {disclaimer ? <p className={s.disclaimer}>{disclaimer}</p> : null}
    </div>
  );
}
