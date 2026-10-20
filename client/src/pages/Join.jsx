import { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getStorefront } from '../lib/storefront';

/**
 * Founder invite landing — the single reusable Pro onboarding link:
 *   https://leads.nexa.mk/join?t=<secret>
 *
 * Sharing the link IS the approval (seats are vetted/sold manually). The visitor
 * never sees or types a code: the token rides in the OAuth `state` and is
 * verified server-side (see server/utils/founderInvite.js). A valid token →
 * INSTANT active Pro on first Google sign-in; without it, leads signup is blocked.
 */
export default function Join() {
  const { search } = useLocation();
  const { currentUser, token } = useAuth();
  const navigate = useNavigate();
  const t = new URLSearchParams(search).get('t') || '';

  // Already signed in → straight into the terminal (their access is already set).
  useEffect(() => {
    if (currentUser || token) navigate('/terminal');
  }, [currentUser, token, navigate]);

  // Launch Google OAuth carrying the storefront, return origin, and the founder
  // invite — the server provisions active Pro only when the invite verifies.
  const googleJoin = () => {
    const apiURL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
    const state = new URLSearchParams();
    state.set('sf', getStorefront());
    state.set('origin', window.location.origin);
    if (t) state.set('invite', t);
    window.location.href = `${apiURL}/auth/google?state=${encodeURIComponent(state.toString())}`;
  };

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

  if (!t) {
    return (
      <div style={wrap}>
        <div style={card}>
          <h1 style={{ fontSize: 20, marginTop: 0 }}>Неважечка покана</h1>
          <p style={{ color: '#6B7280' }}>
            Линкот за пристап е нецелосен. Проверете ја адресата или побарајте нов линк.
          </p>
          <Link to="/" style={btnGhost}>Кон почетна</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ fontSize: 13, color: '#1E4DB7', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Nexa за адвокати</div>
        <h1 style={{ fontSize: 22, margin: '0 0 8px' }}>Активирајте го вашиот Pro пристап</h1>
        <p style={{ color: '#374151', lineHeight: 1.6 }}>
          Вашата покана е потврдена. Најавете се со Google — пристапот се активира
          веднаш, без код.
        </p>
        <div style={{ marginTop: 20 }}>
          <button onClick={googleJoin} style={{ ...btn, width: '100%', cursor: 'pointer', border: 'none' }}>
            Продолжи со Google
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 18 }}>
          Прашања? Пишете на <a href="mailto:info@nexa.mk" style={{ color: '#1E4DB7' }}>info@nexa.mk</a>.
        </p>
      </div>
    </div>
  );
}
