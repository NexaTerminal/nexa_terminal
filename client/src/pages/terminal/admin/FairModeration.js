import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from '../Fair.module.css';

const fmt = (d) => d ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const toDateInput = (d) => d ? new Date(d).toISOString().slice(0, 10) : '';

export default function FairModerationPage() {
  const { token, currentUser } = useAuth();
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const isAdmin = currentUser?.role === 'admin' || currentUser?.isAdmin === true;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(''); // '', 'published', 'hidden'
  const [toast, setToast] = useState(null);

  // Schedule settings
  const [settings, setSettings] = useState(null);
  const [status, setStatusInfo] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const load = () => {
    setLoading(true);
    const params = filter ? `?status=${filter}` : '';
    axios.get(`/api/fair/admin/all${params}`, auth)
      .then(r => setItems(r.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  const loadSettings = () => {
    axios.get('/api/fair/admin/settings', auth)
      .then(r => { setSettings(r.data?.settings || null); setStatusInfo(r.data?.status || null); })
      .catch(() => {});
  };

  useEffect(() => { if (isAdmin) loadSettings(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (isAdmin) load(); else setLoading(false); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveSettings = async (patch) => {
    setSavingSettings(true);
    try {
      const body = {
        mode: settings.mode, windowDays: settings.windowDays,
        customOpensAt: settings.customOpensAt || '', customClosesAt: settings.customClosesAt || '',
        ...patch
      };
      const r = await axios.post('/api/fair/admin/settings', body, auth);
      setSettings(r.data?.settings || null);
      setStatusInfo(r.data?.status || null);
      setToast({ type: 'ok', text: 'Распоредот е зачуван.' });
    } catch (e) {
      setToast({ type: 'err', text: e.response?.data?.message || 'Грешка.' });
    } finally {
      setSavingSettings(false);
    }
  };

  const setStatus = async (id, status) => {
    try {
      await axios.post(`/api/fair/admin/${id}/status`, { status }, auth);
      setItems(prev => prev.map(b => b._id === id ? { ...b, status } : b));
      setToast({ type: 'ok', text: status === 'hidden' ? 'Штандот е сокриен.' : 'Штандот е објавен.' });
    } catch (e) {
      setToast({ type: 'err', text: e.response?.data?.message || 'Грешка.' });
    }
  };

  if (!isAdmin) {
    return <TerminalShell><div className={styles.page}><div className={styles.empty}>Пристапот е дозволен само за администратори.</div></div></TerminalShell>;
  }

  return (
    <TerminalShell>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Виртуелен саем — модерација</h1>
        </div>

        {settings && status && (
          <div className={styles.schedPanel}>
            <div className={styles.schedStatus}>
              {status.open
                ? <><span className={styles.statusPub}>● Отворено</span> до {fmt(status.closesAt)}</>
                : <><span className={styles.statusHidden}>● Затворено</span> · следно отворање {fmt(status.opensAt)}</>}
            </div>

            <div className={styles.schedRow}>
              <label className={styles.label}>Режим</label>
              <div className={styles.typeToggle}>
                {[['auto', 'Авто'], ['open', 'Отворено'], ['closed', 'Затворено']].map(([v, l]) => (
                  <button key={v} type="button" className={settings.mode === v ? styles.on : ''}
                    disabled={savingSettings} onClick={() => saveSettings({ mode: v })}>{l}</button>
                ))}
              </div>
            </div>

            <div className={styles.schedRow}>
              <label className={styles.label}>Авто прозорец (последни денови од кварталот)</label>
              <input type="number" min={1} max={90} className={styles.selectInline}
                value={settings.windowDays}
                onChange={e => setSettings(s => ({ ...s, windowDays: e.target.value }))}
                onBlur={e => saveSettings({ windowDays: e.target.value })} />
            </div>

            <div className={styles.schedRow}>
              <label className={styles.label}>Посебно издание (опционално)</label>
              <div className={styles.schedDates}>
                <input type="date" className={styles.selectInline} value={toDateInput(settings.customOpensAt)}
                  onChange={e => saveSettings({ customOpensAt: e.target.value })} />
                <span>→</span>
                <input type="date" className={styles.selectInline} value={toDateInput(settings.customClosesAt)}
                  onChange={e => saveSettings({ customClosesAt: e.target.value })} />
                {(settings.customOpensAt || settings.customClosesAt) && (
                  <button type="button" className={styles.btnGhost}
                    onClick={() => saveSettings({ customOpensAt: '', customClosesAt: '' })}>Исчисти</button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className={styles.chips} style={{ margin: '16px 0' }}>
          {[['', 'Сите'], ['published', 'Објавени'], ['hidden', 'Сокриени']].map(([v, l]) => (
            <button key={v} className={`${styles.chip} ${filter === v ? styles.chipActive : ''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>

        {loading ? (
          <div className={styles.loading}>Се вчитува…</div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>Нема штандови.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr><th>Компанија</th><th>Понуди</th><th>Статус</th><th>Ажуриран</th><th></th></tr>
            </thead>
            <tbody>
              {items.map(b => (
                <tr key={b._id}>
                  <td><Link to={`/terminal/fair/${b._id}`}>{b.companyName}</Link><div className={styles.city}>{b.city}</div></td>
                  <td>{(b.offers || []).length}</td>
                  <td><span className={b.status === 'published' ? styles.statusPub : styles.statusHidden}>{b.status === 'published' ? 'Објавен' : 'Сокриен'}</span></td>
                  <td>{fmt(b.updatedAt)}</td>
                  <td>
                    {b.status === 'published'
                      ? <button className={`${styles.btnGhost} ${styles.btnDanger}`} onClick={() => setStatus(b._id, 'hidden')}>Сокриј</button>
                      : <button className={styles.btnGhost} onClick={() => setStatus(b._id, 'published')}>Објави</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'ok' ? styles.toastOk : styles.toastErr}`} onClick={() => setToast(null)}>
          {toast.text}
        </div>
      )}
    </TerminalShell>
  );
}
