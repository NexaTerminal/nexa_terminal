import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import BoothFormModal from '../../components/terminal/BoothFormModal';
import { canPostBooth, openSubscriptionGate } from '../../lib/tier';
import styles from './Fair.module.css';

// A single market stall: posts, counter, goods and a scalloped awning.
const Stall = ({ x, color }) => (
  <g transform={`translate(${x},0)`}>
    <rect x="5" y="112" width="5" height="76" rx="2" fill="#c2cedb" />
    <rect x="78" y="112" width="5" height="76" rx="2" fill="#c2cedb" />
    <rect x="0" y="150" width="88" height="38" rx="4" fill="#ffffff" stroke="#cdd8e3" />
    <rect x="0" y="150" width="88" height="13" rx="4" fill="#eaf0f6" />
    <rect x="14" y="134" width="18" height="16" rx="2" fill={color} opacity="0.85" />
    <rect x="56" y="138" width="16" height="12" rx="2" fill="#0a3d62" opacity="0.6" />
    <rect x="-4" y="96" width="96" height="18" rx="5" fill={color} />
    <path d="M-4 114 a12 12 0 0 0 24 0 a12 12 0 0 0 24 0 a12 12 0 0 0 24 0 a12 12 0 0 0 24 0" fill={color} />
  </g>
);

// Decorative illustration for the closed-state hero (no asset files needed).
const FairArt = () => (
  <svg viewBox="0 0 320 240" role="img" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="308" height="228" rx="18" fill="#f3f6f9" />
    {/* bunting */}
    <path d="M26 30 q134 34 268 0" stroke="#cdd8e3" strokeWidth="2" fill="none" />
    <path d="M40 33 l8 14 8-15 z" fill="#0a3d62" />
    <path d="M96 41 l8 14 8-15 z" fill="#e8852b" />
    <path d="M152 43 l8 14 8-15 z" fill="#0a3d62" />
    <path d="M208 41 l8 14 8-15 z" fill="#e8852b" />
    <path d="M264 33 l8 14 8-15 z" fill="#0a3d62" />
    {/* floating offer tags */}
    <g>
      <rect x="44" y="64" width="66" height="24" rx="12" fill="#ffffff" stroke="#dfe6ee" />
      <circle cx="58" cy="76" r="5" fill="#2e7d32" />
      <rect x="70" y="71" width="30" height="3.5" rx="1.75" fill="#cdd8e3" />
      <rect x="70" y="79" width="20" height="3.5" rx="1.75" fill="#e3e9ef" />
    </g>
    <g>
      <rect x="208" y="72" width="66" height="24" rx="12" fill="#ffffff" stroke="#dfe6ee" />
      <circle cx="222" cy="84" r="5" fill="#e8852b" />
      <rect x="234" y="79" width="30" height="3.5" rx="1.75" fill="#cdd8e3" />
      <rect x="234" y="87" width="20" height="3.5" rx="1.75" fill="#e3e9ef" />
    </g>
    {/* ground */}
    <rect x="22" y="186" width="276" height="8" rx="4" fill="#dfe6ee" />
    {/* stalls */}
    <Stall x={26} color="#0a3d62" />
    <Stall x={116} color="#e8852b" />
    <Stall x={206} color="#0a3d62" />
  </svg>
);

// Line-style feature icons (no emojis).
const fSvg = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const IconBooth = () => (<svg {...fSvg}><path d="M3 9l2-5h14l2 5" /><path d="M5 9v10h14V9" /><path d="M9 19v-5h6v5" /></svg>);
const IconSearch = () => (<svg {...fSvg}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>);
const IconContact = () => (<svg {...fSvg}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>);
const IconCalendar = () => (<svg {...fSvg}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18" /><path d="M8 2v4" /><path d="M16 2v4" /></svg>);

export default function FairPage() {
  const { token, currentUser } = useAuth();
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');      // '', 'service', 'product'
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [fair, setFair] = useState({ open: true, opensAt: null, closesAt: null });

  const loadBooths = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (query) params.set('search', query);
    return axios.get(`/api/fair?${params.toString()}`, auth)
      .then(r => {
        setItems(r.data?.items || []);
        setFair({ open: r.data?.open !== false, opensAt: r.data?.opensAt || null, closesAt: r.data?.closesAt || null });
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBooths(); }, [type, query]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSearchSubmit = (e) => { e.preventDefault(); setQuery(search.trim()); };

  const openMyBooth = () => {
    const check = canPostBooth(currentUser);
    if (!check.allowed) { openSubscriptionGate({ source: 'fair', reason: check.reason }); return; }
    setModalOpen(true);
  };

  const onSaved = () => { setModalOpen(false); loadBooths(); };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('mk-MK', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const daysUntil = (d) => {
    if (!d) return null;
    const ms = new Date(d).getTime() - Date.now();
    return ms > 0 ? Math.ceil(ms / 86400000) : 0;
  };

  // Closed state: hide the grid/toolbar, show countdown + prepare-booth CTA.
  if (!loading && !fair.open) {
    const days = daysUntil(fair.opensAt);
    return (
      <TerminalShell>
        <div className={styles.page}>
          <section className={styles.fairHero}>
            <div className={styles.fairHeroText}>
              <span className={styles.closedBadge}>Затворено</span>
              <h1 className={styles.fairHeroTitle}>Виртуелен саем</h1>
              <p className={styles.fairHeroLead}>
                Дигиталната изложба на Nexa заедницата. Претставете ја вашата компанија,
                производи и услуги пред стотици деловни членови — на едно место, видливи за сите.
              </p>

              <div className={styles.fairOpening}>
                <div>
                  <div className={styles.fairOpeningLabel}>Следно отворање</div>
                  <div className={styles.fairOpeningDate}>
                    {fair.opensAt ? fmtDate(fair.opensAt) : 'Допрва ќе биде објавено'}
                  </div>
                </div>
                {days != null && (
                  <div className={styles.fairCountdownPill}>{days} {days === 1 ? 'ден' : 'дена'}</div>
                )}
              </div>

              <button className={styles.btnPrimary} onClick={openMyBooth}>Подгответе го вашиот штанд</button>
              <p className={styles.fairHeroNote}>
                Подгответе го штандот сега — ќе биде објавен автоматски штом саемот ќе се отвори.
              </p>
            </div>

            <div className={styles.fairHeroArt} aria-hidden="true"><FairArt /></div>
          </section>

          <section className={styles.fairFeatures}>
            <h2 className={styles.fairFeaturesTitle}>Како функционира</h2>
            <div className={styles.fairFeatureGrid}>
              {[
                [<IconBooth />, 'Вашиот штанд', 'Поставете штанд со логото, градот и до 3 производи или услуги што сакате да ги истакнете.'],
                [<IconSearch />, 'Бидете откриени', 'Сите членови на Nexa го разгледуваат саемот и ги наоѓаат вашите понуди по категорија.'],
                [<IconContact />, 'Директен контакт', 'Заинтересираните Ве контактираат директно преку вашата веб-страница или е-пошта — без посредници.'],
                [<IconCalendar />, 'Повремени изданија', 'Саемот се отвора во определени периоди. Подгответе се однапред за следното отворање.'],
              ].map(([icon, title, text]) => (
                <div key={title} className={styles.fairFeature}>
                  <div className={styles.fairFeatureIcon} aria-hidden>{icon}</div>
                  <h3 className={styles.fairFeatureTitle}>{title}</h3>
                  <p className={styles.fairFeatureText}>{text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
        <BoothFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={onSaved} />
      </TerminalShell>
    );
  }

  return (
    <TerminalShell>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Виртуелен саем</h1>
            <p className={styles.subtitle}>
              Разгледајте понуди од компании. Поставете свој штанд со до 3 производи или услуги.
            </p>
          </div>
          <button className={styles.btnPrimary} onClick={openMyBooth}>Мој штанд</button>
        </div>

        {fair.closesAt && (
          <div className={styles.openBanner}>Саемот е отворен до {fmtDate(fair.closesAt)}.</div>
        )}

        <form className={styles.toolbar} onSubmit={onSearchSubmit}>
          <input
            className={styles.search}
            placeholder="Пребарувај компании, понуди…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className={styles.selectInline} value={type} onChange={e => setType(e.target.value)}>
            <option value="">Сите</option>
            <option value="service">Услуги</option>
            <option value="product">Производи</option>
          </select>
        </form>

        {loading ? (
          <div className={styles.loading}>Се вчитува…</div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            <p style={{ marginBottom: 14 }}>Сè уште нема штандови. Бидете први — претставете ја вашата компанија.</p>
            <button className={styles.btnPrimary} onClick={openMyBooth}>Постави штанд</button>
          </div>
        ) : (
          <div className={styles.grid}>
            {items.map(b => {
              const first = (b.offers || [])[0];
              return (
                <Link key={b._id} to={`/terminal/fair/${b._id}`} className={styles.card}>
                  {b.imageUrl && <img className={styles.cardCover} src={b.imageUrl} alt={b.companyName} />}
                  <div className={styles.cardTop}>
                    {b.logoUrl
                      ? <img className={styles.logo} src={b.logoUrl} alt={b.companyName} />
                      : <div className={`${styles.logo} ${styles.logoFallback}`}>{(b.companyName || '?').charAt(0)}</div>}
                    <div>
                      <div className={styles.company}>{b.companyName}</div>
                      {b.city && <div className={styles.city}>{b.city}</div>}
                    </div>
                  </div>
                  <p className={styles.tagline}>{first ? first.text : ''}</p>
                  <div className={styles.cardFoot}>
                    <span className={styles.offerCount}>{(b.offers || []).length} понуди</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <BoothFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={onSaved} />
    </TerminalShell>
  );
}
