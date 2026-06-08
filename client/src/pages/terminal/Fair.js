import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import BoothFormModal from '../../components/terminal/BoothFormModal';
import { canPostBooth, openSubscriptionGate } from '../../lib/tier';
import styles from './Fair.module.css';

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
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Виртуелен саем</h1>
              <p className={styles.subtitle}>Саемот се одржува последната недела од секој квартал.</p>
            </div>
          </div>
          <div className={styles.closed}>
            <div className={styles.closedBadge}>Затворено</div>
            <h2 className={styles.closedTitle}>Следно отворање: {fmtDate(fair.opensAt)}</h2>
            {days != null && <div className={styles.countdown}>{days} {days === 1 ? 'ден' : 'дена'} до отворање</div>}
            <p className={styles.closedText}>
              Подгответе го вашиот штанд однапред — ќе биде објавен автоматски кога саемот ќе се отвори.
            </p>
            <button className={styles.btnPrimary} onClick={openMyBooth}>Подгответе го вашиот штанд</button>
          </div>
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
