import s from './ProfileReport.module.css';

/**
 * Big Five profile report — the "full visual graphic" the inviting owner sees.
 * Compact radar + trait bars for the at-a-glance, then a ranked, second-person
 * "how it shows up" list (CliftonStrengths-style) strongest → weakest.
 * `report`/`ranked`/`overall` come from server data/characterAssessmentQuestions.score().
 */

const BAND_CLASS = { high: s.bandHigh, mid: s.bandMid, low: s.bandLow };
const SIZE = 260;
const CENTER = SIZE / 2;
const R = 96; // radius to the 100-score ring
// Horizontal breathing room so the side labels (esp. long ones like
// „Емоционална стабилност") sit inside the SVG box instead of spilling into the
// bars column. The pentagon stays centered; only the viewBox widens.
const PAD_X = 46;

function vertex(i, frac) {
  const ang = (-90 + i * 72) * (Math.PI / 180);
  return [CENTER + Math.cos(ang) * R * frac, CENTER + Math.sin(ang) * R * frac];
}
const toPoints = (fracs) => fracs.map((f, i) => vertex(i, f).join(',')).join(' ');

export default function ProfileReport({ candidateName, role, report = [], ranked, overall, disclaimer, completedAt }) {
  const dims = report.filter((d) => d.score != null);
  const fracs = dims.map((d) => Math.max(0.04, d.score / 100));
  const rings = [0.25, 0.5, 0.75, 1];
  const rankedList = (ranked && ranked.length ? ranked : [...dims].sort((a, b) => b.score - a.score));

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

      {overall && overall.text ? (
        <p className={s.overall}><strong>Кратко:</strong> {overall.text}</p>
      ) : null}

      <div className={s.grid}>
        {/* Radar pentagon */}
        <div className={s.radarWrap}>
          <svg className={s.radar} viewBox={`${-PAD_X} 0 ${SIZE + PAD_X * 2} ${SIZE}`} role="img" aria-label="Профил (радар)">
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
              const anchor = x < CENTER - 4 ? 'end' : x > CENTER + 4 ? 'start' : 'middle';
              // Wrap multi-word labels (e.g. „Емоционална стабилност") onto two
              // lines so they don't run wide and clip / overlap the bars.
              const words = d.label.split(' ');
              return (
                <text key={d.dimension} className={s.axisLabel} x={x} y={y}
                      textAnchor={anchor} dominantBaseline="middle">
                  {words.length > 1
                    ? words.map((w, wi) => (
                        <tspan key={wi} x={x} dy={wi === 0 ? `${-(words.length - 1) * 0.6}em` : '1.2em'}>{w}</tspan>
                      ))
                    : d.label}
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
                <div className={s.barFill} style={{ width: `${d.score}%`, background: d.color?.accent }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ranked, second-person "how it shows up" list */}
      <h3 className={s.rankedTitle}>Еве како овие особини се пројавуваат:</h3>
      <ol className={s.ranked}>
        {rankedList.map((d, i) => (
          <li key={d.dimension} className={s.rankRow}>
            <span className={s.rankNum}>{i + 1}</span>
            <span className={s.rankRule} style={{ background: d.color?.accent }} aria-hidden="true" />
            <div className={s.rankBody}>
              <div className={s.rankHead}>
                <span className={s.rankLabel} style={{ background: d.color?.bg, color: d.color?.text }}>{d.label}</span>
                <span className={s.rankScore} style={{ color: d.color?.accent }}>{d.bandLabel} · {d.score}</span>
              </div>
              <p className={s.rankText}>{d.narrative || d.interpretation}</p>
            </div>
          </li>
        ))}
      </ol>

      {disclaimer ? <p className={s.disclaimer}>{disclaimer}</p> : null}
    </div>
  );
}
