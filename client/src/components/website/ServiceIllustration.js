import styles from './ServiceIllustration.module.css';

/**
 * Topic illustrations for the „Услуги" pages — inline SVG line art in the
 * site palette (no external images, crisp at any size, theme-consistent).
 * Each scene sits on the same soft circle so the set reads as one family.
 */

const Frame = ({ children, label }) => (
  <svg className={styles.svg} viewBox="0 0 360 240" role="img" aria-label={label}>
    <circle className={styles.halo} cx="180" cy="120" r="108" />
    <circle className={styles.ring} cx="180" cy="120" r="116" />
    {children}
  </svg>
);

// Building + magnifier over a document: property check.
const DueDiligence = ({ label }) => (
  <Frame label={label}>
    <rect className={styles.card} x="96" y="60" width="104" height="132" rx="8" />
    <path className={styles.line} d="M112 82h52M112 96h72M112 110h60M112 124h70" />
    <path className={styles.soft} d="M112 146h40M112 160h56M112 174h34" />
    <g className={styles.float}>
      <rect className={styles.card} x="188" y="74" width="72" height="84" rx="6" />
      <path className={styles.line} d="M200 158V96l24-14 24 14v62" />
      <path className={styles.line} d="M212 112h8M228 112h8M212 128h8M228 128h8M218 158v-14h12v14" />
    </g>
    <circle className={styles.lens} cx="224" cy="162" r="26" />
    <path className={styles.lineBold} d="M243 181l20 20" />
    <path className={styles.accentLine} d="M212 162l8 8 16-16" />
  </Frame>
);

// Two blocks converging into one: merger / acquisition.
const MergersAcquisitions = ({ label }) => (
  <Frame label={label}>
    <rect className={styles.card} x="84" y="78" width="70" height="84" rx="8" />
    <rect className={styles.cardAlt} x="206" y="78" width="70" height="84" rx="8" />
    <path className={styles.line} d="M98 100h42M98 114h30M98 128h38" />
    <path className={styles.lineLight} d="M220 100h42M220 114h30M220 128h38" />
    <path className={styles.dash} d="M158 120h44" />
    <path className={styles.line} d="M170 110l-10 10 10 10M190 110l10 10-10 10" />
    <circle className={styles.accentDot} cx="180" cy="120" r="7" />
    <g className={styles.float}>
      <rect className={styles.card} x="146" y="168" width="68" height="34" rx="17" />
      <path className={styles.accentLine} d="M166 185l8 8 16-16" />
    </g>
    <path className={styles.soft} d="M119 166v10a10 10 0 0 0 10 10h17M241 166v10a10 10 0 0 1-10 10h-17" />
  </Frame>
);

// Rocket lifting off a growth curve: startup.
const Startup = ({ label }) => (
  <Frame label={label}>
    <path className={styles.soft} d="M86 190h188" />
    <path className={styles.line} d="M96 182c34-6 56-22 78-46s44-40 84-50" />
    <circle className={styles.accentDot} cx="258" cy="86" r="6" />
    <g className={styles.float}>
      <path className={styles.card} d="M180 58c18 12 26 34 22 60l-22 16-22-16c-4-26 4-48 22-60z" />
      <circle className={styles.lens} cx="180" cy="92" r="9" />
      <path className={styles.line} d="M158 118l-14 14 18 2M202 118l14 14-18 2" />
      <path className={styles.accentLine} d="M172 140l8 18 8-18" />
    </g>
    <path className={styles.lineLight} d="M110 150v32M138 136v46M222 112v70M250 100v82" />
  </Frame>
);

// Org chart: organisational development.
const OrgDevelopment = ({ label }) => (
  <Frame label={label}>
    <path className={styles.line} d="M180 92v18M120 110h120M120 110v18M180 110v18M240 110v18M120 152v14M100 166h40M100 166v10M140 166v10" />
    <g className={styles.float}>
      <rect className={styles.cardAccent} x="152" y="60" width="56" height="32" rx="8" />
      <circle className={styles.dotLight} cx="170" cy="76" r="5" />
      <path className={styles.lineWhite} d="M180 76h16" />
    </g>
    <rect className={styles.card} x="96" y="128" width="48" height="26" rx="7" />
    <rect className={styles.card} x="156" y="128" width="48" height="26" rx="7" />
    <rect className={styles.card} x="216" y="128" width="48" height="26" rx="7" />
    <circle className={styles.accentDot} cx="100" cy="182" r="7" />
    <circle className={styles.accentDot} cx="140" cy="182" r="7" />
    <path className={styles.lineLight} d="M168 141h24M228 141h24M108 141h24" />
    <path className={styles.soft} d="M196 184h68M196 198h48" />
  </Frame>
);

// Globe with a route landing on a pin: market entry.
const MarketEntry = ({ label }) => (
  <Frame label={label}>
    <circle className={styles.card} cx="164" cy="128" r="58" />
    <ellipse className={styles.lineLight} cx="164" cy="128" rx="24" ry="58" />
    <path className={styles.lineLight} d="M106 128h116M114 100h100M114 156h100" />
    <path className={styles.dash} d="M92 82c40-36 120-40 156 20" />
    <g className={styles.float}>
      <path className={styles.cardAccent} d="M252 84c-14 0-24 10-24 24 0 18 24 40 24 40s24-22 24-40c0-14-10-24-24-24z" />
      <circle className={styles.dotLight} cx="252" cy="108" r="8" />
    </g>
    <path className={styles.line} d="M86 186h56M218 186h56" />
    <circle className={styles.accentDot} cx="92" cy="82" r="5" />
  </Frame>
);

// Hub: briefcase with a checklist — services overall.
const Hub = ({ label }) => (
  <Frame label={label}>
    <rect className={styles.card} x="108" y="88" width="144" height="100" rx="12" />
    <path className={styles.line} d="M156 88V76a8 8 0 0 1 8-8h32a8 8 0 0 1 8 8v12M108 124h144" />
    <rect className={styles.cardAccent} x="168" y="116" width="24" height="16" rx="4" />
    <g className={styles.float}>
      <rect className={styles.card} x="218" y="52" width="74" height="70" rx="8" />
      <path className={styles.accentLine} d="M230 70l5 5 9-9M230 88l5 5 9-9M230 106l5 5 9-9" />
      <path className={styles.lineLight} d="M252 72h28M252 90h28M252 108h20" />
    </g>
    <path className={styles.soft} d="M124 150h40M124 164h60M196 150h40" />
  </Frame>
);

const SCENES = {
  'due-diligence-nedviznosti': DueDiligence,
  'm-and-a': MergersAcquisitions,
  'startap-sovetuvanje': Startup,
  'organizaciski-razvoj': OrgDevelopment,
  'vlez-na-pazar': MarketEntry,
  hub: Hub,
};

export default function ServiceIllustration({ slug, label = '', size = 'lg' }) {
  const Scene = SCENES[slug] || Hub;
  return (
    <div className={`${styles.wrap} ${size === 'sm' ? styles.sm : ''}`}>
      <Scene label={label} />
    </div>
  );
}
