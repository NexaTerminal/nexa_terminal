import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from './LeadsInbox.module.css';

const STATUSES = ['available', 'assigned', 'contacted', 'won', 'lost'];
const STATUS_LABEL = {
  available: 'Достапни',
  new:       'Нови',
  assigned:  'Нови',
  contacted: 'Контактирани',
  won:       'Добиени',
  lost:      'Изгубени',
  expired:   'Истечени'
};
const AREA_LABEL = {
  'consumer-legal': 'Потрошувачко', 'immigration': 'Имиграција', 'citizenship': 'Државјанство',
  'company-registration': 'Регистрација', 'ip-law': 'Инт. сопственост', 'tax-accounting': 'Данок/сметк.',
  'labor-law': 'Работно', 'general-legal': 'Општо'
};
const areaLabel = (a) => AREA_LABEL[a] || a || '—';
const leadTime = (l) => new Date(l.assignedAt || l.receivedAt || 0).getTime();
const fmtDateTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date) ? '—' : date.toLocaleString('mk-MK', { dateStyle: 'medium', timeStyle: 'short' });
};

export default function LeadsInbox() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  // Default to 'available' so the SU sees pool leads first when they log in.
  const initialTab = new URLSearchParams(window.location.search).get('tab') === 'available' ? 'available' : 'available';
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [detail, setDetail] = useState(null);
  // Sorting + filtering (client-side over the fetched tab).
  const [search, setSearch] = useState('');
  const [areaF, setAreaF] = useState('');
  const [cityF, setCityF] = useState('');
  const [sourceF, setSourceF] = useState('');
  const [sort, setSort] = useState('newest'); // 'newest' | 'oldest'

  // Filter option lists derived from the current tab's leads.
  const areaOptions   = useMemo(() => [...new Set(items.map(l => l.practiceArea).filter(Boolean))], [items]);
  const cityOptions   = useMemo(() => [...new Set(items.map(l => l.city).filter(Boolean))], [items]);
  const sourceOptions = useMemo(() => [...new Set(items.map(l => l.sourceSite).filter(Boolean))], [items]);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = items.filter(l => {
      if (areaF && l.practiceArea !== areaF) return false;
      if (cityF && l.city !== cityF) return false;
      if (sourceF && l.sourceSite !== sourceF) return false;
      if (q) {
        const hay = `${l.payload?.name || ''} ${l.payload?.email || ''} ${l.payload?.message || ''} ${l.city || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    out.sort((a, b) => sort === 'newest' ? leadTime(b) - leadTime(a) : leadTime(a) - leadTime(b));
    return out;
  }, [items, search, areaF, cityF, sourceF, sort]);

  const clearFilters = () => { setSearch(''); setAreaF(''); setCityF(''); setSourceF(''); };
  const hasFilters = search || areaF || cityF || sourceF;

  const fetchItems = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const url = tab === 'available'
        ? '/api/admin-user/leads/available'
        : `/api/admin-user/leads?status=${tab}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(res.data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setLoading(false); }
  }, [tab, token]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const showFlash = (m) => { setFlash(m); setTimeout(() => setFlash(''), 3000); };

  const update = async (id, patch) => {
    try {
      const res = await axios.patch(`/api/admin-user/leads/${id}`, patch,
        { headers: { Authorization: `Bearer ${token}` } });
      setDetail(res.data.lead);
      showFlash('✓ Зачувано');
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const claim = async (lead) => {
    try {
      const res = await axios.post(`/api/admin-user/leads/${lead._id}/claim`, {},
        { headers: { Authorization: `Bearer ${token}` } });
      showFlash('✓ Земено — лидот сега е ваш');
      setDetail(res.data.lead);
      setTab('assigned');
    } catch (err) {
      if (err.response?.status === 409) {
        showFlash('Друг член го зеде лидот пред вас.');
        fetchItems();
      } else {
        setError(err.response?.data?.message || err.message);
      }
    }
  };

  return (
    <TerminalShell>
      <div className={styles.page}>
          <div className={styles.header}>
            <h1>Лиди</h1>
            <p>Прашања пренасочени до вашата фирма од Nexa екосистемот.</p>
          </div>

          <nav className={styles.tabs}>
            {STATUSES.map(s => (
              <button key={s}
                className={`${styles.tab} ${tab === s ? styles.tabActive : ''}`}
                onClick={() => setTab(s)}>
                {STATUS_LABEL[s]}
              </button>
            ))}
          </nav>

          {flash && <div className={styles.flash}>{flash}</div>}
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.toolbar}>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Пребарај по име, е-пошта, порака…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className={styles.select} value={areaF} onChange={e => setAreaF(e.target.value)} aria-label="Област">
              <option value="">Сите области</option>
              {areaOptions.map(a => <option key={a} value={a}>{areaLabel(a)}</option>)}
            </select>
            <select className={styles.select} value={cityF} onChange={e => setCityF(e.target.value)} aria-label="Град">
              <option value="">Сите градови</option>
              {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className={styles.select} value={sourceF} onChange={e => setSourceF(e.target.value)} aria-label="Извор">
              <option value="">Сите извори</option>
              {sourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className={styles.select} value={sort} onChange={e => setSort(e.target.value)} aria-label="Подредување">
              <option value="newest">Најнови прво</option>
              <option value="oldest">Најстари прво</option>
            </select>
            {hasFilters && (
              <button type="button" className={styles.clearBtn} onClick={clearFilters}>Исчисти</button>
            )}
            <span className={styles.count}>{visibleItems.length} лиди</span>
          </div>

          <div className={styles.layoutTwo}>
            <div className={styles.list}>
              {loading ? <div className={styles.loading}>Се вчитува…</div> :
               visibleItems.length === 0 ? <div className={styles.empty}>{hasFilters ? 'Нема лиди за овие филтри.' : 'Нема лиди во оваа состојба.'}</div> :
               visibleItems.map(l => (
                <button
                  key={l._id}
                  className={`${styles.row} ${detail?._id === l._id ? styles.rowActive : ''}`}
                  onClick={() => setDetail(l)}
                >
                  <div className={styles.rowTop}>
                    <span className={styles.rowName}>{l.payload?.name || '—'}</span>
                    <span className={styles.rowDate}>{fmtDateTime(l.assignedAt || l.receivedAt)}</span>
                  </div>
                  <div className={styles.rowMeta}>
                    <span className={styles.tag}>{areaLabel(l.practiceArea)}</span>
                    {l.city && <span className={styles.dim}> · {l.city}</span>}
                    <span className={styles.dim}> · од {l.sourceSite}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className={styles.detail}>
              {detail ? (
                <Detail
                  lead={detail}
                  canClaim={tab === 'available'}
                  onClaim={() => claim(detail)}
                  onUpdate={(patch) => update(detail._id, patch)}
                />
              ) : (
                <div className={styles.placeholder}>
                  {tab === 'available'
                    ? 'Изберете лид и кликнете „Земи“ за да го преземете. Прв што ќе земе го добива.'
                    : 'Изберете лид за да ги видите деталите.'}
                </div>
              )}
            </div>
          </div>
      </div>
    </TerminalShell>
  );
}

function Detail({ lead, onUpdate, canClaim, onClaim }) {
  const [note, setNote] = useState('');
  const [status, setStatus] = useState(lead.status);

  useEffect(() => { setStatus(lead.status); setNote(''); }, [lead._id, lead.status]);

  const payload = lead.payload || {};
  return (
    <div className={styles.detailInner}>
      <h2>{payload.name || 'Лид'}</h2>

      {canClaim && (
        <div style={{
          background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10,
          padding: '14px 16px', marginBottom: 16, fontSize: 14, color: '#92400E'
        }}>
          <strong>Лидот е во базенот за земање.</strong>
          <div style={{ marginTop: 4, marginBottom: 12, fontSize: 13 }}>
            Контакт податоците ќе се откријат откако ќе го преземете. Прв што ќе земе го добива.
          </div>
          <button
            type="button"
            onClick={onClaim}
            style={{
              background: '#FFFBEB', color: '#B45309', border: '1px solid #FCD34D', borderRadius: 6,
              padding: '9px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
            }}
          >
            Преземи го лидот
          </button>
        </div>
      )}

      {!canClaim && (
        <div className={styles.contactBlock}>
          {payload.email && (
            <div><strong>Е-пошта:</strong> <a href={`mailto:${payload.email}`}>{payload.email}</a></div>
          )}
          {payload.phone && (
            <div><strong>Телефон:</strong> <a href={`tel:${payload.phone}`}>{payload.phone}</a></div>
          )}
        </div>
      )}

      <div className={styles.kv}>
        <span>Извор</span><strong>{lead.sourceSite}</strong>
        <span>Област</span><strong>{lead.practiceArea}</strong>
        <span>Град</span><strong>{lead.city || '—'}</strong>
        <span>Јазик</span><strong>{lead.language}</strong>
        <span>Примено</span><strong>{new Date(lead.receivedAt).toLocaleString('mk-MK')}</strong>
        <span>Доделено</span><strong>{lead.assignedAt ? new Date(lead.assignedAt).toLocaleString('mk-MK') : '—'}</strong>
      </div>

      {payload.message && !canClaim && (
        <>
          <h3 className={styles.subhead}>Порака</h3>
          <div className={styles.message}>{payload.message}</div>
        </>
      )}
      {payload.message && canClaim && (
        <>
          <h3 className={styles.subhead}>Преглед</h3>
          <div className={styles.message}>{payload.message.slice(0, 200)}{payload.message.length > 200 ? '…' : ''}</div>
        </>
      )}

      {!canClaim && (<>
        <h3 className={styles.subhead}>Статус</h3>
        <div className={styles.statusRow}>
          {['assigned', 'contacted', 'won', 'lost'].map(s => (
            <button
              key={s}
              className={`${styles.statusBtn} ${status === s ? styles.statusBtnActive : ''}`}
              onClick={() => { setStatus(s); onUpdate({ status: s }); }}
            >{STATUS_LABEL[s]}</button>
          ))}
        </div>

        <h3 className={styles.subhead}>Додај белешка</h3>
        <textarea
          rows={3}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Внатрешна белешка (видлива само за вашата фирма)…"
        />
        <button
          className={styles.btnPrimary}
          disabled={!note.trim()}
          onClick={() => { onUpdate({ note }); setNote(''); }}
        >Додај белешка</button>

        {lead.notes?.length > 0 && (
          <>
            <h3 className={styles.subhead}>Белешки ({lead.notes.length})</h3>
            <ul className={styles.notes}>
              {lead.notes.slice().reverse().map((n, i) => (
                <li key={i}>
                  <span>{new Date(n.at).toLocaleString('mk-MK')}</span>
                  {n.text}
                </li>
              ))}
            </ul>
          </>
        )}
      </>)}
    </div>
  );
}
