import React, { useId } from 'react';

/**
 * Inline circular „Проверен работодавач" seal (React SVG) — mirrors the server's
 * badgeService.sealSVG. Rendered inline on Nexa's own pages so the seal ALWAYS
 * shows, independent of the badge image endpoint / cross-origin caching. The
 * backend SVG endpoint is still used for the portable embed snippet (external
 * sites). `useId` keeps the internal defs ids unique when several seals render.
 */

const C = {
  ink: '#0F2A6B', brand: '#1E4DB7', gold: '#C9A227', goldLight: '#E7C65A',
  green: '#16A34A', paper: '#FFFFFF', gray: '#6B7280',
};

export default function BadgeSeal({ tier = 'A', verified = false, size = 160 }) {
  const uid = useId().replace(/:/g, '');
  const arcTop = `arcTop-${uid}`;
  const arcBot = `arcBot-${uid}`;
  const ring = `ring-${uid}`;

  return (
    <svg viewBox="0 0 240 240" width={size} height={size} role="img"
         aria-label={`Nexa Проверен работодавач — рејтинг ${tier}`}>
      <defs>
        <path id={arcTop} d="M 44 120 A 76 76 0 0 1 196 120" />
        <path id={arcBot} d="M 40 120 A 80 80 0 0 0 200 120" />
        <linearGradient id={ring} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.goldLight} />
          <stop offset="1" stopColor={C.gold} />
        </linearGradient>
      </defs>

      <circle cx="120" cy="120" r="116" fill={C.paper} />
      <circle cx="120" cy="120" r="116" fill="none" stroke={`url(#${ring})`} strokeWidth="6" />
      <circle cx="120" cy="120" r="104" fill="none" stroke={C.brand} strokeWidth="2" />
      <circle cx="120" cy="120" r="88" fill={C.brand} />

      <text fontFamily="Arial, sans-serif" fontWeight="700" letterSpacing="3" fontSize="15" fill={C.ink}>
        <textPath href={`#${arcTop}`} startOffset="50%" textAnchor="middle">N E X A</textPath>
      </text>
      <text fontFamily="Arial, sans-serif" fontWeight="600" letterSpacing="1.5" fontSize="10.5" fill={C.gray}>
        <textPath href={`#${arcBot}`} startOffset="50%" textAnchor="middle">самопроценка · важи 1 година</textPath>
      </text>

      <path d="M120 58 l26 9 v20 c0 20 -13 33 -26 40 c-13 -7 -26 -20 -26 -40 v-20 z" fill={C.paper} opacity="0.14" />
      <path d="M108 96 l9 9 l17 -18" fill="none" stroke={C.goldLight} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

      <text x="120" y="150" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="15" fill={C.paper} letterSpacing="0.5">ПРОВЕРЕН</text>
      <text x="120" y="167" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="15" fill={C.paper} letterSpacing="0.5">РАБОТОДАВАЧ</text>

      <circle cx="120" cy="192" r="17" fill={C.gold} />
      <text x="120" y="198" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="15" fill={C.ink}>{tier}</text>
      {verified && (
        <>
          <circle cx="150" cy="192" r="7" fill={C.green} />
          <path d="M147 192 l2 2 l4 -5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}
