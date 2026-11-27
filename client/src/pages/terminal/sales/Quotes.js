import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import { STATUS, money, fmtDay, daysSince } from '../../../lib/quotes';
import styles from './Quotes.module.css';

/** „Понуди" — every quote with what the client did with it. */
export default function Quotes() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    axios.get('/api/sales/quotes', auth)
      .then((r) => setRows(r.data.data))
      .catch((e) => { setRows([]); setError(e.response?.data?.message || 'Грешка при вчитување.'); });
  }, [auth]);

  const createNew = async () => {
    setCreating(true);
    try {
      const r = await axios.post('/api/sales/quotes', {}, auth);
      navigate(`/terminal/ponudi/${r.data.data._id}`);
    } catch (e) {
      setError(e.response?.data?.message || 'Грешка при креирање.');
      setCreating(false);
    }
  };

  const open = (rows || []).filter((q) => q.statusNow === 'sent' || q.statusNow === 'viewed');
  const accepted = (rows || []).filter((q) => q.statusNow === 'accepted');
  const sum = (list) => list.reduce((a, q) => a + (q.currency === 'EUR' ? q.net * 61.5 : q.net), 0);

  return (
    <TerminalShell>
      <div className={styles.page}>
        <div className={styles.headRow}>
          <div>
            <h1 className={styles.title}>Понуди</h1>
            <p className={styles.subtitle}>
              Направете понуда за една минута, пратете ја како линк и следете што прави клиентот:
              кога ја отвора, дали ја прифаќа или има прашање.
            </p>
          </div>
          <button type="button" className={styles.primaryBtnInline} onClick={createNew} disabled={creating}>
            {creating ? 'Се креира…' : '+ Нова понуда'}
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {rows === null ? (
          <div className={styles.loading}>Се вчитува…</div>
        ) : rows.length === 0 ? (
          <div className={styles.empty}>
            <h2>Првата понуда е за една минута</h2>
            <ol>
              <li>Внесете ги ставките и цените — ДДВ и вкупниот износ се пресметуваат сами.</li>
              <li>Внесете го Вашиот трошок (само Вие го гледате) и видете ја маржата. Борис може да ја провери цената.</li>
              <li>Пратете го линкот преку WhatsApp, Viber или е-пошта — клиентот ја прифаќа со едно копче.</li>
            </ol>
            <p className={styles.hint}>Понудата може да ја направите и директно од зделка во <Link to="/terminal/sales">Клиенти</Link>.</p>
            <button type="button" className={styles.primaryBtnInline} onClick={createNew} disabled={creating}>+ Нова понуда</button>
          </div>
        ) : (
          <>
            <div className={styles.kpiRow}>
              <div className={styles.kpi}><strong>{open.length}</strong><span>Чекаат одговор{open.length ? ` · ${money(sum(open), 'MKD')} без ДДВ` : ''}</span></div>
              <div className={styles.kpi}><strong>{accepted.length}</strong><span>Прифатени{accepted.length ? ` · ${money(sum(accepted), 'MKD')} без ДДВ` : ''}</span></div>
              <div className={styles.kpi}><strong>{open.filter((q) => q.viewCount > 0).length}/{open.length}</strong><span>Отворени од клиентот</span></div>
            </div>
            <div className={styles.table}>
              {rows.map((q) => {
                const st = STATUS[q.statusNow] || STATUS.draft;
                const quiet = (q.statusNow === 'sent' || q.statusNow === 'viewed') && daysSince(q.sentAt) >= 3;
                return (
                  <Link key={q._id} to={`/terminal/ponudi/${q._id}`} className={styles.row}>
                    <span className={styles.rowMain}>
                      <strong>{q.client?.name || 'Без клиент'}</strong>
                      <span className={styles.rowSub}>{q.number}{q.title ? ` · ${q.title}` : ''}</span>
                    </span>
                    <span className={styles.rowTrack}>
                      {q.statusNow === 'draft' ? 'нацрт' :
                        q.viewCount ? `отворена ${q.viewCount}× · ${fmtDay(q.lastViewedAt)}` : 'не е отворена'}
                      {quiet && <span className={styles.quiet}>без одговор {daysSince(q.sentAt)} дена</span>}
                    </span>
                    <span className={styles.rowMoney}>{money(q.total, q.currency)}</span>
                    <span className={`${styles.status} ${styles['tone_' + st.tone]}`}>{st.label}</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </TerminalShell>
  );
}
