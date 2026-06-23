import { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PENDING_PROMO_KEY } from '../components/PromoRedeemWatcher';

/**
 * Public landing for the hard-coded campaign deep link `/redeem?code=CODE`.
 *  - Logged in  → stash the code; PromoRedeemWatcher applies it + redirects.
 *  - Logged out → stash the code and offer Sign-up / Login. After auth the
 *    watcher picks the code up and redeems it automatically.
 */
export default function Redeem() {
  const { search } = useLocation();
  const { currentUser, token } = useAuth();
  const navigate = useNavigate();
  const code = new URLSearchParams(search).get('code');

  useEffect(() => {
    if (code) localStorage.setItem(PENDING_PROMO_KEY, code);
  }, [code]);

  // Already authenticated → let the watcher redeem; bounce into the terminal.
  useEffect(() => {
    if (code && (currentUser || token)) navigate('/terminal');
  }, [code, currentUser, token, navigate]);

  const wrap = {
    minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Arial, sans-serif", padding: 24
  };
  const card = {
    maxWidth: 440, width: '100%', background: '#fff', border: '1px solid #E6E8EC',
    borderRadius: 12, padding: 32, textAlign: 'center'
  };
  const btn = {
    display: 'inline-block', background: '#0B1220', color: '#fff', textDecoration: 'none',
    padding: '12px 22px', borderRadius: 8, fontWeight: 600, fontSize: 14, margin: '6px'
  };
  const btnGhost = { ...btn, background: '#fff', color: '#0B1220', border: '1px solid #E6E8EC' };

  // One-click path for cold leads: straight to Google OAuth. The code already
  // sits in localStorage, so it auto-applies the moment the user comes back
  // authenticated — same browser session, no copy-paste.
  const googleLogin = () => {
    const apiURL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
    window.location.href = `${apiURL}/auth/google`;
  };

  if (!code) {
    return (
      <div style={wrap}>
        <div style={card}>
          <h1 style={{ fontSize: 20, marginTop: 0 }}>Неважечка врска</h1>
          <p style={{ color: '#6B7280' }}>Кодот недостасува во врската. Проверете ја адресата од е-поштата.</p>
          <Link to="/" style={btnGhost}>Кон почетна</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ fontSize: 13, color: '#1E4DB7', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Nexa</div>
        <h1 style={{ fontSize: 22, margin: '0 0 8px' }}>Активирајте 30 дена Pro</h1>
        <p style={{ color: '#374151', lineHeight: 1.6 }}>
          Вашиот код <strong>{code}</strong> е спремен. Најавете се или регистрирајте се —
          кодот се применува автоматски штом влезете.
        </p>
        <div style={{ marginTop: 20 }}>
          <button onClick={googleLogin} style={{ ...btn, width: '100%', cursor: 'pointer', border: 'none' }}>
            Продолжи со Google
          </button>
        </div>
        <div style={{ marginTop: 10, fontSize: 13 }}>
          <span style={{ color: '#9CA3AF' }}>или </span>
          <Link to="/login" style={{ color: '#1E4DB7' }}>најави се / регистрирај се со е-пошта</Link>
        </div>
        <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 18 }}>
          Прашања? Пишете на <a href="mailto:info@nexa.mk" style={{ color: '#1E4DB7' }}>info@nexa.mk</a>.
        </p>
      </div>
    </div>
  );
}
