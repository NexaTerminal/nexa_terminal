import React, { useId } from 'react';

/**
 * „Проверен работодавач" — modern GOLD award-medal seal (React SVG). The rating
 * (A / A+ / A++) is the hero in the centre. Rendered inline on Nexa pages;
 * mirrored on the server (badgeService.sealSVG) for the embeddable image + PDF.
 * `useId` keeps gradient/arc ids unique across instances.
 */

export default function BadgeSeal({ tier = 'A', verified = false, size = 190 }) {
  const uid = useId().replace(/:/g, '');
  const id = (n) => `${n}-${uid}`;
  const cx = 120;
  const cy = 112;

  // Fluted medal edge — a ring of small gold beads.
  const beads = Array.from({ length: 40 }, (_, i) => {
    const a = (i / 40) * 2 * Math.PI;
    return { x: cx + 104 * Math.cos(a), y: cy + 104 * Math.sin(a) };
  });

  const navy = '#1E3A6E';
  return (
    <svg viewBox="0 0 240 272" width={size} height={(size * 272) / 240} role="img"
         aria-label={`Nexa Проверен работодавач — рејтинг ${tier}`}>
      <defs>
        <radialGradient id={id('face')} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#FCEFB4" />
          <stop offset="0.55" stopColor="#E8C24A" />
          <stop offset="1" stopColor="#B67E12" />
        </radialGradient>
        <linearGradient id={id('rim')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7E39A" />
          <stop offset="1" stopColor="#C8971F" />
        </linearGradient>
        <radialGradient id={id('ivory')} cx="50%" cy="40%" r="70%">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F3E9CC" />
        </radialGradient>
        <linearGradient id={id('ribbon')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A4C93" />
          <stop offset="1" stopColor="#16295C" />
        </linearGradient>
        <path id={id('arcTop')} d="M 34 112 A 86 86 0 0 1 206 112" />
        <path id={id('arcBot')} d="M 36 112 A 84 84 0 0 0 204 112" />
      </defs>

      {/* Ribbon tails (behind the medal) */}
      <polygon points="88,150 122,150 108,268 92,254 74,264" fill={`url(#${id('ribbon')})`} stroke="#C8971F" strokeWidth="1.5" />
      <polygon points="152,150 118,150 132,268 148,254 166,264" fill={`url(#${id('ribbon')})`} stroke="#C8971F" strokeWidth="1.5" />

      {/* Fluted gold edge */}
      {beads.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r="4" fill={`url(#${id('rim')})`} />)}

      {/* Medal body */}
      <circle cx={cx} cy={cy} r="100" fill={`url(#${id('face')})`} stroke="#A56E0E" strokeWidth="1" />
      <circle cx={cx} cy={cy} r="88" fill="none" stroke="#A56E0E" strokeWidth="1" opacity="0.5" />
      <circle cx={cx} cy={cy} r="80" fill={`url(#${id('ivory')})`} stroke={`url(#${id('rim')})`} strokeWidth="3" />

      {/* Engraved ring text on the gold band */}
      <text fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700" letterSpacing="2.5" fontSize="13" fill={navy}>
        <textPath href={`#${id('arcTop')}`} startOffset="50%" textAnchor="middle">ПРОВЕРЕН РАБОТОДАВАЧ</textPath>
      </text>
      <text fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700" letterSpacing="4" fontSize="12" fill={navy}>
        <textPath href={`#${id('arcBot')}`} startOffset="50%" textAnchor="middle">N E X A</textPath>
      </text>

      {/* Star above the hero rating */}
      <path d="M120 58 l4.7 9.5 10.5 1.5 -7.6 7.4 1.8 10.4 -9.4 -4.9 -9.4 4.9 1.8 -10.4 -7.6 -7.4 10.5 -1.5 z"
            fill={`url(#${id('rim')})`} stroke="#A56E0E" strokeWidth="0.6" />

      {/* HERO rating */}
      <text x={cx} y="146" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="800"
            fontSize="58" fill={`url(#${id('rim')})`} stroke="#8A5A0A" strokeWidth="0.8">{tier}</text>

      {/* Honest note (small) */}
      <text x={cx} y="172" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8" letterSpacing="0.5" fill="#8A6D2F">самопроценка · важи 1 година</text>

      {verified && (
        <>
          <circle cx="182" cy="60" r="13" fill="#16A34A" stroke="#fff" strokeWidth="2" />
          <path d="M176 60 l4 4 8 -9" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}
