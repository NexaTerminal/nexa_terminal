import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import SubscriptionStatusBanner from '../../components/terminal/SubscriptionStatusBanner';
import ExpressInterestModal from '../../components/terminal/ExpressInterestModal';
import FeatureTermsModal from '../../components/terminal/FeatureTermsModal';
import useTermsGate from '../../hooks/useTermsGate';
import { canExpressInterest, openSubscriptionGate } from '../../lib/tier';
import styles from './ProHome.module.css';

/**
 * Product B (leads.nexa.mk / Pro) dashboard home.
 *
 * Light, simple, aligned with the rest of the terminal. Keeps the lawyer on the
 * three things that matter: CASES (the hero — real inquiries from /api/inquiries,
 * the same board as /terminal/leads), plus TOPICS and BLOG to build visibility.
 * Documents / AI / Contracts are demoted to a quiet "Алатки" row.
 *
 * Rendered full-width (no SMB right sidebar). Counts come from existing
 * endpoints; every fetch is best-effort so one failure never blanks the page.
 */

const CATEGORY_LABEL = {
  legal: 'Правен', accounting: 'Сметководство', tax: 'Даноци', insurance: 'Осигурување',
  real_estate: 'Недвижности', hr: 'HR', marketing: 'Маркетинг', translation: 'Превод', other: 'Друго'
};

const fmt = (d) => d
  ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' })
  : '';

const TOOLS = [
  { to: '/terminal/documents',         label: 'Документи' },
  { to: '/terminal/ai-chat',           label: 'Правен AI' },
  { to: '/terminal/contract-analysis', label: 'Анализа на договор' }
];

export default function ProHome() {
  const { currentUser, token } = useAuth();
  const [cases, setCases] = useState(null);      // array or null (loading)

  // Case detail modal + express-interest flow (mirrors /terminal/leads, so a
  // click on a ticker card opens the case in place instead of navigating away).
  const [detail, setDetail] = useState(null);        // inquiry shown in the modal
  const [interestFor, setInterestFor] = useState(null); // inquiry being submitted
  const [flash, setFlash] = useState('');
  const { requireTerms, termsModal } = useTermsGate();

  const company = currentUser?.companyInfo?.companyName
    || currentUser?.fullName || currentUser?.username || '';

  const onExpress = (inq) => {
    if (!canExpressInterest(currentUser).allowed) {
      openSubscriptionGate({ source: 'pro-home' });
      return;
    }
    requireTerms('case', () => { setDetail(null); setInterestFor(inq); });
  };

  const submitInterest = async (payload) => {
    const auth = { headers: { Authorization: `Bearer ${token}` } };
    const res = await axios.post(`/api/inquiries/${interestFor._id}/interest`, payload, auth);
    setInterestFor(null);
    setFlash('Интересот е примен. Уредничкиот тим ќе одлучи.');
    setTimeout(() => setFlash(''), 4000);
    return res.data;
  };

  useEffect(() => {
    if (!token) return;
    const auth = { headers: { Authorization: `Bearer ${token}` } };
    let alive = true;
    axios.get('/api/inquiries', auth)
      .then((r) => { if (alive) setCases(r.data?.items || []); })
      .catch(() => { if (alive) setCases([]); });
    return () => { alive = false; };
  }, [token]);

  const openCases = (cases || []).filter((c) => !c.status || c.status === 'open');
  const list = openCases.slice(0, 10);
  // Animate as a marquee once there are enough cards to loop cleanly; below that
  // a static row reads better. Duplicate the set so the scroll is seamless.
  const animate = list.length >= 3;
  const marquee = animate ? [...list, ...list] : list;

  return (
    <div className={styles.page}>
      {/* Slim status line flush under the header. */}
      <SubscriptionStatusBanner flush />

      <div className={styles.inner}>
        <header className={styles.head}>
          <h1 className={styles.title}>Добредојдовте{company ? `, ${company}` : ''}</h1>
          <p className={styles.lead}>Вашите случаи, прашања и објави на едно место.</p>
        </header>

        {/* ── CASES (primary, the money shot) ─────────────────── */}
        <section className={styles.hero}>
          <span className={styles.heroGlow} aria-hidden />
          <div className={styles.heroHead}>
            <div className={styles.heroText}>
              <span className={styles.heroEyebrow}>Реални случаи, реални проблеми кои чекаат решение.</span>
              <h2 className={styles.heroHeadline}>Преземи го случајот — пред некој друг.</h2>
            </div>
            <Link to="/terminal/leads" className={styles.heroBtn}>
              Прегледај ги случаите
              <span className={styles.heroBtnArrow} aria-hidden>→</span>
            </Link>
          </div>

          {cases == null ? (
            <div className={styles.empty}>Се вчитува…</div>
          ) : list.length === 0 ? (
            <div className={styles.empty}>Нема отворени случаи во моментов.</div>
          ) : (
            <div className={styles.ticker}>
              <div
                className={`${styles.tickerTrack} ${animate ? styles.tickerAnimate : ''}`}
                style={animate ? { animationDuration: `${list.length * 6.25}s` } : undefined}
              >
                {marquee.map((c, i) => (
                  <button
                    key={`${c._id}-${i}`}
                    type="button"
                    className={styles.tickerCard}
                    onClick={() => setDetail(c)}
                  >
                    <div className={styles.tickerCardTop}>
                      <span className={styles.liveDot} aria-hidden />
                      <span className={styles.tickerTitle}>{c.topic || '(без наслов)'}</span>
                    </div>
                    {c.summary && <span className={styles.tickerSummary}>{c.summary}</span>}
                    <div className={styles.tickerMeta}>
                      <span className={styles.tickerTags}>
                        {(c.categories || []).slice(0, 2).map((cat) => (
                          <span key={cat} className={styles.tag}>{CATEGORY_LABEL[cat] || cat}</span>
                        ))}
                        {c.postedAt && <span className={styles.tickerDate}>{fmt(c.postedAt)}</span>}
                      </span>
                      <span className={styles.tickerClaim}>Отвори →</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Branding tools (Topics + Blog) ──────────────────── */}
        <div className={styles.brandHead}>Изградете го Вашето име</div>
        <div className={styles.cards}>
          <Link to="/terminal/topics-qa" className={styles.brandCard}>
            <span className={styles.brandIcon} aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3.5-7.1"/><path d="M10 9a2 2 0 1 1 3 1.7c-1 .6-1 1.3-1 2.3"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></svg>
            </span>
            <span className={styles.brandTag}>topics.nexa.mk · SEO</span>
            <span className={styles.brandTitle}>Одговарајте на прашања</span>
            <span className={styles.brandDesc}>
              Секој одговор се објавува под Ваше име и Ве наоѓаат клиенти кои токму сега бараат правник на Google.
            </span>
            <span className={styles.brandCta}>Одговори →</span>
          </Link>

          <Link to="/terminal/marketing-hub?tab=blog" className={styles.brandCard}>
            <span className={styles.brandIcon} aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M14 6l4 4"/></svg>
            </span>
            <span className={styles.brandTag}>Блог · Билтен</span>
            <span className={styles.brandTitle}>Пишувајте стручни статии</span>
            <span className={styles.brandDesc}>
              Објавете под Ваше име — ние ги споделуваме до илјадници претплатници за да изградите авторитет.
            </span>
            <span className={styles.brandCta}>Напиши статија →</span>
          </Link>
        </div>

        {/* See it live — public pages where the published work appears. */}
        <div className={styles.brandLinks}>
          <span className={styles.brandLinksLabel}>Погледнете каде се појавува Вашето име:</span>
          <a href="https://topics.nexa.mk" target="_blank" rel="noopener noreferrer" className={styles.brandLink}>
            topics.nexa.mk <span aria-hidden>↗</span>
          </a>
          <a href="https://nexa.mk/blog" target="_blank" rel="noopener noreferrer" className={styles.brandLink}>
            nexa.mk/blog <span aria-hidden>↗</span>
          </a>
        </div>

        {/* ── Tools (out of focus) ────────────────────────────── */}
        <div className={styles.tools}>
          <span className={styles.toolsLabel}>Алатки:</span>
          {TOOLS.map((t, i) => (
            <span key={t.to}>
              {i > 0 && <span className={styles.toolsDot} aria-hidden>·</span>}
              <Link to={t.to} className={styles.toolsLink}>{t.label}</Link>
            </span>
          ))}
        </div>
      </div>

      {flash && <div className={styles.flash} role="status">{flash}</div>}

      {/* Case detail — opens in place from a ticker card. */}
      {detail && (
        <CaseModal
          inquiry={detail}
          onExpress={() => onExpress(detail)}
          onClose={() => setDetail(null)}
        />
      )}

      {/* Real express-interest flow (same endpoint/component as /terminal/leads). */}
      {interestFor && (
        <ExpressInterestModal
          inquiry={interestFor}
          onSubmit={submitInterest}
          onClose={() => setInterestFor(null)}
        />
      )}

      {termsModal && <FeatureTermsModal {...termsModal} />}
    </div>
  );
}

// Lightweight, self-contained case detail modal (light-themed to match the
// dashboard). Shows the anonymized inquiry; the primary action expresses
// interest, which the editorial team then qualifies.
function CaseModal({ inquiry, onExpress, onClose }) {
  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Затвори">×</button>

        <div className={styles.modalTags}>
          {inquiry.urgency === 'urgent' && <span className={styles.modalUrgent}>Итно</span>}
          {(inquiry.categories || []).map((c) => (
            <span key={c} className={styles.tag}>{CATEGORY_LABEL[c] || c}</span>
          ))}
        </div>

        <h2 className={styles.modalTitle}>{inquiry.topic || '(без наслов)'}</h2>

        <div className={styles.modalMeta}>
          {inquiry.language && <span>🗣 {inquiry.language.toUpperCase()}</span>}
          {inquiry.postedAt && <span>📅 {fmt(inquiry.postedAt)}</span>}
        </div>

        {inquiry.summary && <p className={styles.modalSummary}>{inquiry.summary}</p>}

        <div className={styles.modalNote}>
          Контактот на клиентот се открива откако уредничкиот тим ќе го одобри Вашиот интерес.
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.modalSecondary} onClick={onClose}>Затвори</button>
          <button type="button" className={styles.modalPrimary} onClick={onExpress}>
            Изразувам интерес
          </button>
        </div>
      </div>
    </div>
  );
}
