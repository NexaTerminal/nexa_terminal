import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from '../Fair.module.css';

const fmt = (d) => d ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const toDateInput = (d) => d ? new Date(d).toISOString().slice(0, 10) : '';
const addDays = (dateStr, n) => {
  if (!dateStr) return '';
  const d = new Date(dateStr); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

/**
 * Admin control for the virtual fair — schedule only. There is no booth
 * moderation/approval: booths post freely and contact happens directly.
 */
export default function FairSchedulePage() {
  const { token, currentUser } = useAuth();
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const isAdmin = currentUser?.role === 'admin' || currentUser?.isAdmin === true;

  const [settings, setSettings] = useState(null);
  const [status, setStatusInfo] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;
    axios.get('/api/fair/admin/settings', auth)
      .then(r => { setSettings(r.data?.settings || null); setStatusInfo(r.data?.status || null); })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (!isAdmin) {
    return <TerminalShell><div className={styles.page}><div className={styles.empty}>Пристапот е дозволен само за администратори.</div></div></TerminalShell>;
  }

  return (
    <TerminalShell>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Виртуелен саем — распоред</h1>
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
                {[['manual', 'Рачно'], ['auto', 'Авто'], ['open', 'Отворено'], ['closed', 'Затворено']].map(([v, l]) => (
                  <button key={v} type="button" className={settings.mode === v ? styles.on : ''}
                    disabled={savingSettings} onClick={() => saveSettings({ mode: v })}>{l}</button>
                ))}
              </div>
            </div>

            <div className={styles.schedRow}>
              <label className={styles.label}>Закажи отворање</label>
              <div className={styles.schedDates}>
                <input type="date" className={styles.selectInline} value={toDateInput(settings.customOpensAt)}
                  onChange={e => {
                    const open = e.target.value;
                    // Default a 7-day window so a single date pick is a valid edition.
                    const close = toDateInput(settings.customClosesAt) || addDays(open, 6);
                    saveSettings({ customOpensAt: open, customClosesAt: close });
                  }} />
                <span>→</span>
                <input type="date" className={styles.selectInline} value={toDateInput(settings.customClosesAt)}
                  onChange={e => saveSettings({ customClosesAt: e.target.value })} />
                {(settings.customOpensAt || settings.customClosesAt) && (
                  <button type="button" className={styles.btnGhost}
                    onClick={() => saveSettings({ customOpensAt: '', customClosesAt: '' })}>Исчисти</button>
                )}
              </div>
            </div>
            <p className={styles.schedHint}>
              Закажаното отворање има предност пред режимот. Во режим „Рачно" саемот е затворен се додека не закажете отворање.
            </p>

            {settings.mode === 'auto' && (
              <div className={styles.schedRow}>
                <label className={styles.label}>Авто прозорец (последни денови од кварталот)</label>
                <input type="number" min={1} max={90} className={styles.selectInline}
                  value={settings.windowDays}
                  onChange={e => setSettings(s => ({ ...s, windowDays: e.target.value }))}
                  onBlur={e => saveSettings({ windowDays: e.target.value })} />
              </div>
            )}
          </div>
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
