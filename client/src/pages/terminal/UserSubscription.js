import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import TerminalShell from '../../components/terminal/TerminalShell';
import { PROMO_FLASH_KEY } from '../../components/PromoRedeemWatcher';
import styles from './UserAccount.module.css';

const PLAN_LABEL = {
  basic:    'Основен',
  pro:      'Про',
  // legacy
  standard: 'Основен',
  admin_5:  'Про',
  admin_10: 'Про'
};
const STATUS_LABEL = {
  none:             'Не е активирана',
  pending_approval: 'Чека одобрување',
  active:           'Активна',
  suspended:        'Суспендирана',
  cancelled:        'Откажана'
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
const daysUntil = (d) => {
  if (!d) return null;
  const n = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  return n;
};

export default function UserSubscriptionPage() {
  const { token, currentUser, setCurrentUser } = useAuth();
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // ── Promo / code redemption ────────────────────────────────────────────
  const [redeemMsg, setRedeemMsg]   = useState(null); // { ok, msg }
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemBusy, setRedeemBusy] = useState(false);

  const refreshSub = async () => {
    try {
      const res = await axios.get('/api/subscription/me', { headers: { Authorization: `Bearer ${token}` } });
      setSub(res.data?.subscription || null);
    } catch (_) { /* keep current */ }
  };

  const onRedeem = async (e) => {
    e.preventDefault();
    const code = redeemCode.trim();
    if (!code) return;
    setRedeemBusy(true); setRedeemMsg(null);
    try {
      await ApiService.request('/subscription/redeem-code', { method: 'POST', body: JSON.stringify({ code }) });
      setRedeemMsg({ ok: true, msg: 'Кодот е успешно искористен — вашиот пристап е активен.' });
      setRedeemCode('');
      await refreshSub();
    } catch (ex) {
      setRedeemMsg({ ok: false, msg: ex.message || 'Кодот не може да се искористи.' });
    } finally {
      setRedeemBusy(false);
    }
  };

  // Pick up a flash left by the deep-link auto-redeem (PromoRedeemWatcher).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROMO_FLASH_KEY);
      if (raw) {
        setRedeemMsg(JSON.parse(raw));
        localStorage.removeItem(PROMO_FLASH_KEY);
      }
    } catch (_) { /* ignore */ }
  }, []);

  // ── Password / username change ─────────────────────────────────────────
  const [creds, setCreds] = useState({ currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '' });
  const [credsBusy, setCredsBusy] = useState(false);
  const [credsErr, setCredsErr] = useState('');
  const [credsOk, setCredsOk] = useState('');

  const onCredsChange = (e) => setCreds((s) => ({ ...s, [e.target.name]: e.target.value }));
  const onCredsSubmit = async (e) => {
    e.preventDefault();
    setCredsErr(''); setCredsOk('');
    if (creds.newPassword !== creds.confirmPassword) { setCredsErr('Новата лозинка и потврдата не се совпаѓаат.'); return; }
    if (creds.newPassword && creds.newPassword.length < 6) { setCredsErr('Лозинката мора да има најмалку 6 карактери.'); return; }
    setCredsBusy(true);
    try {
      const body = { currentPassword: creds.currentPassword };
      if (creds.newUsername) body.username = creds.newUsername;
      if (creds.newPassword) body.password = creds.newPassword;
      await ApiService.request('/users/credentials', { method: 'PUT', body: JSON.stringify(body) });
      setCredsOk('Корисничките податоци се успешно ажурирани.');
      setCreds({ currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '' });
      const fresh = await ApiService.request('/users/profile');
      if (fresh?.user) setCurrentUser(fresh.user);
      setTimeout(() => setCredsOk(''), 3000);
    } catch (ex) {
      setCredsErr(ex.message || 'Настана грешка при ажурирање.');
    } finally {
      setCredsBusy(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    axios.get('/api/subscription/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!cancelled) setSub(res.data?.subscription || null); })
      .catch(e => { if (!cancelled) setErr(e.response?.data?.message || e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const openGate = () => {
    try {
      window.dispatchEvent(new CustomEvent('subscription:blocked', {
        detail: { code: 'SUBSCRIPTION_USER_INITIATED', subscription: sub }
      }));
    } catch (_) { /* old browser */ }
  };

  const daysLeft = daysUntil(sub?.endsAt);
  const planLabel = PLAN_LABEL[sub?.plan] || PLAN_LABEL[currentUser?.intendedPlan] || '—';
  const isAdminRole = currentUser?.role === 'admin' || currentUser?.role === 'sub_seat';

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Сметка</span>
          <h1 className={styles.title}>Претплата</h1>
          <p className={styles.lead}>
            Преглед на Вашиот план и состојба. Можете да изберете нов план или
            да обновите постоен во секое време.
          </p>
        </header>

        {loading ? (
          <div className={styles.spinner}>Се вчитува…</div>
        ) : err ? (
          <div className={styles.toastError}>{err}</div>
        ) : !sub ? (
          <div className={styles.emptyState}>Нема податоци за претплата.</div>
        ) : (
          <>
            <section className={styles.panel}>
              <div className={styles.panelHead}>Активен план</div>
              <div className={styles.kv}>
                <div className={styles.kvK}>План</div>
                <div className={styles.kvV}><strong>{planLabel}</strong></div>

                <div className={styles.kvK}>Статус</div>
                <div className={styles.kvV}>
                  <span className={`${styles.statusPill} ${styles['s_' + (sub.status || 'unknown')]}`}>
                    {STATUS_LABEL[sub.status] || sub.status || '—'}
                  </span>
                </div>

                {sub.cycle && (
                  <>
                    <div className={styles.kvK}>Циклус</div>
                    <div className={styles.kvV}>
                      {sub.cycle === 'monthly' ? 'Месечно' :
                       sub.cycle === 'quarterly' ? 'Квартално' :
                       sub.cycle === 'annual' ? 'Годишно' : sub.cycle}
                    </div>
                  </>
                )}

                {sub.endsAt && (
                  <>
                    <div className={styles.kvK}>Истекува</div>
                    <div className={styles.kvV}>
                      {fmtDate(sub.endsAt)}
                      {daysLeft !== null && daysLeft >= 0 && (
                        <span className={styles.kvHint}> · {daysLeft === 0 ? 'денес' : `${daysLeft} ден(а)`}</span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {!isAdminRole && (
                <div className={styles.actionRow}>
                  <button type="button" className={styles.btnPrimary} onClick={openGate}>
                    {sub.status === 'none' || sub.status === 'suspended'
                      ? 'Изберете план'
                      : 'Промени или обнови план'}
                  </button>
                </div>
              )}
              {currentUser?.role === 'sub_seat' && (
                <div className={styles.helpNote}>
                  Како поканет колега, пристапот Ви се обезбедува преку планот
                  на компанијата. За промени контактирајте го администраторот.
                </div>
              )}
            </section>

            {sub.graceEndsAt && new Date(sub.graceEndsAt) > new Date() && (
              <section className={styles.panel} style={{ borderColor: '#FCD34D', background: '#FFFBEB' }}>
                <div className={styles.panelHead} style={{ color: '#92400E' }}>Грејс период активен</div>
                <p style={{ fontSize: 13.5, color: '#92400E', margin: 0, lineHeight: 1.55 }}>
                  Имате дополнителен пристап до {fmtDate(sub.graceEndsAt)} додека
                  ја обработуваме уплатата. Активирањето е автоматско штом
                  пристигне уплатата.
                </p>
              </section>
            )}
          </>
        )}

        {/* ── Locked onboarding: enter code OR choose a plan ───────────── */}
        {!isAdminRole && sub && ['none', 'suspended', 'cancelled'].includes(sub.status) && (
          <section className={styles.panel}>
            <div className={styles.panelHead}>Активирајте го пристапот</div>
            <p className={styles.lead} style={{ fontSize: 13.5, margin: '0 0 12px' }}>
              {sub.status === 'none'
                ? 'Сметката сè уште не е активирана. Внесете промотивен код или изберете план за да започнете.'
                : 'Внесете промотивен код или изберете план за да го вратите пристапот.'}
            </p>
            {redeemMsg && (
              <div className={redeemMsg.ok ? styles.toastOk : styles.toastError} style={{ marginBottom: 12 }}>{redeemMsg.msg}</div>
            )}
            <form className={styles.passwordForm} onSubmit={onRedeem}>
              <div className={styles.field}>
                <label htmlFor="redeemCode">Промотивен код</label>
                <input id="redeemCode" name="redeemCode" type="text" autoComplete="off"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  placeholder="на пр. PRO30-JUNE" />
              </div>
              <div className={styles.actionRow}>
                <button type="submit" className={styles.btnPrimary} disabled={redeemBusy || !redeemCode.trim()}>
                  {redeemBusy ? 'Се применува…' : 'Искористи код'}
                </button>
                <button type="button" className={styles.btnSecondary} onClick={openGate}>
                  Изберете план
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ── Promo redemption result when NOT in the locked block above ── */}
        {redeemMsg && !(sub && ['none', 'suspended', 'cancelled'].includes(sub.status)) && (
          <section className={styles.panel}>
            <div className={redeemMsg.ok ? styles.toastOk : styles.toastError}>{redeemMsg.msg}</div>
          </section>
        )}

        {/* ── Password / username change ───────────────────────────────── */}
        <section className={`${styles.panel} ${styles.passwordPanel}`}>
          <div className={styles.panelHead}>Корисничко име и лозинка</div>
          <p className={styles.lead} style={{ fontSize: 13.5, margin: '0 0 8px' }}>
            Внесете ја тековната лозинка за да потврдите промени на корисничкото име или лозинката.
          </p>
          {credsErr && <div className={styles.toastError}>{credsErr}</div>}
          {credsOk && <div className={styles.toastOk}>{credsOk}</div>}
          <form className={styles.passwordForm} onSubmit={onCredsSubmit}>
            <div className={styles.field}>
              <label htmlFor="currentPassword">Тековна лозинка *</label>
              <input id="currentPassword" name="currentPassword" type="password" required
                value={creds.currentPassword} onChange={onCredsChange}
                placeholder="За да потврдите промени, внесете ја тековната лозинка" />
            </div>
            <div className={styles.field}>
              <label htmlFor="newUsername">Ново корисничко име</label>
              <input id="newUsername" name="newUsername" type="text"
                value={creds.newUsername} onChange={onCredsChange}
                placeholder="Оставете празно ако не сакате да промените" />
            </div>
            <div className={styles.field}>
              <label htmlFor="newPassword">Нова лозинка</label>
              <input id="newPassword" name="newPassword" type="password" minLength={6}
                value={creds.newPassword} onChange={onCredsChange}
                placeholder="Минимум 6 карактери" />
            </div>
            <div className={styles.field}>
              <label htmlFor="confirmPassword">Потврди нова лозинка</label>
              <input id="confirmPassword" name="confirmPassword" type="password"
                value={creds.confirmPassword} onChange={onCredsChange}
                placeholder="Повторете ја новата лозинка" />
            </div>
            <div className={styles.actionRow}>
              <button type="submit" className={styles.btnPrimary} disabled={credsBusy}>
                {credsBusy ? 'Се ажурира…' : 'Зачувај промени'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </TerminalShell>
  );
}
