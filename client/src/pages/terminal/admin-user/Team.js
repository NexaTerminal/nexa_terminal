import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from './Team.module.css';

const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return '—';
  return date.toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: '2-digit' });
};

export default function Team() {
  const { token } = useAuth();
  const [seats, setSeats] = useState([]);
  const [limit, setLimit] = useState(5);
  const [used, setUsed] = useState(0);
  const [seatType, setSeatType] = useState('coworker'); // 'coworker' (Basic) | 'client' (Pro)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [invited, setInvited] = useState(null); // { email, tempPassword }
  const [resetPwTarget, setResetPwTarget] = useState(null); // { email, tempPassword }

  const fetchSeats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/admin-user/seats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSeats(res.data.seats || []);
      setLimit(res.data.limit ?? 5);
      setUsed(res.data.used ?? 0);
      setSeatType(res.data.seatType || 'coworker');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchSeats(); }, [fetchSeats]);

  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 3500); };

  const onInvite = async ({ email, fullName }) => {
    try {
      // Seat type is derived server-side from the account's tier — no companyMode sent.
      const res = await axios.post('/api/admin-user/seats',
        { email, fullName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInvited({ email, tempPassword: res.data.tempPassword });
      setShowInvite(false);
      fetchSeats();
    } catch (err) {
      // Log the raw response for debugging extensions/proxies that mutate it.
      console.error('[invite] raw error:', err.response?.status, err.response?.data, err);
      const serverMsg = err.response?.data?.message;
      const status = err.response?.status;
      // If the message mentions "language" or "override", it's coming from outside
      // our code (likely a browser extension). Show a generic message instead.
      const looksExternal = serverMsg && /language|override|unsupported/i.test(serverMsg);
      const cleanMsg = looksExternal
        ? `Грешка при поканата (HTTP ${status ?? '?'}). Проверете ја мрежата или исклучете преводни екстензии.`
        : (serverMsg || err.message);
      throw new Error(cleanMsg);
    }
  };

  const onRevoke = async (seat) => {
    if (!window.confirm(`Да го отповикаш пристапот за ${seat.email}?`)) return;
    try {
      await axios.delete(`/api/admin-user/seats/${seat._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showFlash(`✓ Отповикано ${seat.email}`);
      fetchSeats();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const onResetPassword = async (seat) => {
    if (!window.confirm(`Да генерираш нова привремена лозинка за ${seat.email}? Старата лозинка ќе престане да работи.`)) return;
    try {
      const res = await axios.post(`/api/admin-user/seats/${seat._id}/reset-password`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResetPwTarget({ email: seat.email, tempPassword: res.data.tempPassword });
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const onReactivate = async (seat) => {
    try {
      await axios.post(`/api/admin-user/seats/${seat._id}/reactivate`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showFlash(`✓ Повторно активирано ${seat.email}`);
      fetchSeats();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const isClient = seatType === 'client';
  const T = isClient ? {
    title: 'Клиенти',
    subtitle: 'Поканете клиентски фирми. Секоја работи под своја компанија, под вашата претплата.',
    badgeNoun: 'клиенти',
    inviteBtn: 'Покани клиент',
    limitReached: 'Достигнат лимит на клиенти',
    empty: 'Сè уште нема клиенти. Поканете ја првата фирма.',
    colName: 'Клиент'
  } : {
    title: 'Тим',
    subtitle: 'Поканете соработници. Тие ја делат вашата компанија и претплата.',
    badgeNoun: 'седишта',
    inviteBtn: 'Покани соработник',
    limitReached: 'Достигнат лимит на седишта',
    empty: 'Сè уште нема соработници. Поканете го првиот.',
    colName: 'Соработник'
  };

  return (
    <TerminalShell>
      <div className={styles.page}>
          <div className={styles.header}>
            <div>
              <h1>{T.title}</h1>
              <p>{T.subtitle}</p>
            </div>
            <div className={styles.seatBadge}>
              <strong>{used}</strong> од <strong>{limit}</strong> искористени {T.badgeNoun}
            </div>
          </div>

          {flash && <div className={styles.flash}>{flash}</div>}
          {error && <div className={styles.error}>{error}</div>}
          {invited && (
            <CredentialsCard
              title="Поканата е испратена — споделете ги пристапните податоци"
              hint="Препратете ги директно до корисникот ИЛИ почекајте да ја добие поканата по е-пошта. При првото најавување ќе биде побарано да постави своја лозинка."
              email={invited.email}
              tempPassword={invited.tempPassword}
              onClose={() => setInvited(null)}
            />
          )}
          {resetPwTarget && (
            <CredentialsCard
              title="Генерирана е нова привремена лозинка"
              hint="Споделете ја со членот на тимот. Старата лозинка веќе не работи."
              email={resetPwTarget.email}
              tempPassword={resetPwTarget.tempPassword}
              onClose={() => setResetPwTarget(null)}
            />
          )}

          <div className={styles.toolbar}>
            <button
              className={styles.btnPrimary}
              onClick={() => setShowInvite(true)}
              disabled={used >= limit}
            >
              {used >= limit ? T.limitReached : T.inviteBtn}
            </button>
          </div>

          <div className={styles.tableWrap}>
            {loading ? (
              <div className={styles.loading}>Се вчитува…</div>
            ) : seats.length === 0 ? (
              <div className={styles.empty}>{T.empty}</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{T.colName}</th>
                    <th>Статус</th>
                    <th>Поканет</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {seats.map(s => (
                    <tr key={s._id}>
                      <td>
                        <div className={styles.name}>
                          {s.fullName || s.email}
                          {(s.seatType === 'client' || s.companyMode === 'independent') ? (
                            <span className={`${styles.modeTag} ${styles.modeTagIndep}`} title="Клиентска фирма со свој профил">
                              🏢 Клиент
                            </span>
                          ) : (
                            <span className={`${styles.modeTag} ${styles.modeTagShared}`} title="Соработник во вашата компанија">
                              🤝 Соработник
                            </span>
                          )}
                        </div>
                        <div className={styles.email}>{s.email}</div>
                      </td>
                      <td>
                        {s.isActive === false ? (
                          <span className={`${styles.statusTag} ${styles.statusRevoked}`}>Отповикан</span>
                        ) : (
                          <span className={`${styles.statusTag} ${styles.statusActive}`}>Активен</span>
                        )}
                      </td>
                      <td>{fmtDate(s.invitedAt || s.createdAt)}</td>
                      <td className={styles.actions}>
                        {s.isActive === false ? (
                          <button className={styles.btnGhost} onClick={() => onReactivate(s)}>Активирај</button>
                        ) : (
                          <>
                            <button className={styles.btnGhost} onClick={() => onResetPassword(s)}>Ресетирај лозинка</button>
                            <button className={styles.btnDanger} onClick={() => onRevoke(s)}>Отповикај</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
      </div>

      {showInvite && (
        <InviteModal isClient={isClient} onCancel={() => setShowInvite(false)} onSubmit={onInvite} />
      )}
    </TerminalShell>
  );
}

// ---------- modals ----------

function InviteModal({ isClient, onCancel, onSubmit }) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await onSubmit({ email, fullName });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onCancel}>
      <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{isClient ? 'Покани клиентска фирма' : 'Покани соработник'}</h2>
        <p className={styles.modalSub}>
          {isClient
            ? 'Ќе добие е-пошта со привремена лозинка и ќе работи под своја компанија — нема потреба од посебна верификација.'
            : 'Ќе добие е-пошта со привремена лозинка и ќе работи под вашата компанија. Вашите податоци автоматски се споделуваат.'}
        </p>

        <label className={styles.field}>
          Е-пошта
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder={isClient ? 'kontakt@klient.mk' : 'kolega@primer.mk'}
          />
        </label>
        <label className={styles.field}>
          {isClient ? 'Назив / контакт лице (опционално)' : 'Име и презиме (опционално)'}
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
          />
        </label>

        {err && <div className={styles.modalErr}>{err}</div>}

        <div className={styles.modalActions}>
          <button type="button" className={styles.btnGhost} onClick={onCancel} disabled={busy}>Откажи</button>
          <button type="submit" className={styles.btnPrimary} disabled={busy}>
            {busy ? 'Се испраќа…' : 'Прати покана'}
          </button>
        </div>
      </form>
    </div>
  );
}

function CredentialsCard({ title, hint, email, tempPassword, onClose }) {
  const copyOne = (txt) => navigator.clipboard?.writeText(txt).catch(() => {});
  const copyBoth = () =>
    navigator.clipboard?.writeText(`Email: ${email}\nTemp password: ${tempPassword}\nLogin at: ${window.location.origin}/login`).catch(() => {});

  return (
    <div className={styles.credCard}>
      <div className={styles.credHeader}>
        <strong>✓ {title}</strong>
        <button type="button" className={styles.btnTiny} onClick={onClose}>Затвори</button>
      </div>
      <p className={styles.credHint}>{hint}</p>
      <div className={styles.credRow}>
        <span className={styles.credLabel}>Е-пошта</span>
        <code className={styles.credValue}>{email}</code>
        <button type="button" className={styles.btnTiny} onClick={() => copyOne(email)}>Копирај</button>
      </div>
      <div className={styles.credRow}>
        <span className={styles.credLabel}>Лозинка</span>
        <code className={styles.credValue}>{tempPassword}</code>
        <button type="button" className={styles.btnTiny} onClick={() => copyOne(tempPassword)}>Копирај</button>
      </div>
      <button type="button" className={styles.btnCopyAll} onClick={copyBoth}>
        Копирај сè + линк за најава
      </button>
    </div>
  );
}
