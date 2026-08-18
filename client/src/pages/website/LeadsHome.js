import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import { useAuth } from '../../contexts/AuthContext';
import SEOHelmet from '../../components/seo/SEOHelmet';
import { NEXA_ORG, NEXA_WEBSITE, webPage } from '../../components/seo/schemaGraph';
import { getStorefront, otherStorefrontUrl } from '../../lib/storefront';
import styles from './LeadsHome.module.css';

/**
 * leads.nexa.mk — Product B storefront (Nexa for Lawyers).
 * Single-viewport, no-scroll login page: 2/3 explanation + 1/3 login. Its own
 * lean top bar carries the essential links (main site, blog, contact, legal).
 */
export default function LeadsHome() {
  const { t } = useTranslation('website');
  const lang = i18n.language || 'mk';
  const isMk = lang === 'mk';
  const url = 'https://leads.nexa.mk/';
  const T = (mk, en) => (isMk ? mk : en);

  const { loginWithUsername } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  const goAfterAuth = () => {
    const params = new URLSearchParams(location.search);
    navigate(params.get('redirect') || '/terminal', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError(T('Внесете корисничко име и лозинка.', 'Enter your username and password.'));
      return;
    }
    setLoading(true);
    try {
      const result = await loginWithUsername(username, password);
      if (result.success) goAfterAuth();
      else setError(result.error || T('Неуспешна најава.', 'Login failed.'));
    } catch (err) {
      setError(err.message || T('Неуспешна најава.', 'Login failed.'));
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth — carry the storefront + redirect through so a new Google
  // account lands on the right product shell (leads.nexa.mk → Pro).
  const handleGoogleLogin = () => {
    const apiURL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    const state = new URLSearchParams();
    state.set('sf', getStorefront());
    state.set('origin', window.location.origin);
    if (redirect) state.set('redirect', redirect);
    window.location.href = `${apiURL}/auth/google?state=${encodeURIComponent(state.toString())}`;
  };

  // Rotating value props — one per Pro feature, each led by a hook.
  const FEATURES = [
    {
      label: T('Клиенти', 'Clients'),
      hook: T('Ние имаме клиенти. Вие имате експертиза.',
              'We have the clients. You have the expertise.'),
      sub: T('Луѓе со правни потреби нè контактираат секој ден преку нашата мрежа сајтови. Преземете ги случаите од Вашата област и град.',
             'People with legal needs reach us every day through our network of sites. Take the cases from your practice area and city.')
    },
    {
      label: T('Стручни одговори', 'Expert answers'),
      hook: T('Луѓето треба да знаат за Вас.',
              'People need to know you exist.'),
      sub: T('Одговарајте на реални правни прашања и градете репутација како експерт пред публика што веќе бара токму такво знаење.',
             'Answer real legal questions and build a reputation as the expert in front of an audience already looking for exactly that.')
    },
    {
      label: T('Блог', 'Blog'),
      hook: T('Имате што да кажете — ние имаме каде да го пренесеме.',
              'You have something to say — we have where to share it.'),
      sub: T('Објавувајте стручни статии и стигнете до целата Nexa мрежа од сајтови, читатели и потенцијални клиенти.',
             'Publish expert articles and reach the entire Nexa network of sites, readers and prospective clients.')
    },
    {
      label: T('Саеми', 'Fairs'),
      hook: T('Претставете се пред вистинската публика.',
              'Present yourself to the right audience.'),
      sub: T('Учествувајте на виртуелни саеми и настани и поврзете се директно со клиенти што бараат Ваши услуги.',
             'Take part in virtual fairs and events and connect directly with clients seeking your services.')
    },
    {
      label: T('Алатки', 'Tools'),
      hook: T('Целата Ваша канцеларија на едно место.',
              'Your whole practice, in one place.'),
      sub: T('Автоматизирани документи, анализа на договори, правни проверки и AI помошник — подготвени за секој случај.',
             'Automated documents, contract analysis, compliance checks and an AI assistant — ready for every case.')
    }
  ];

  // Auto-advance the rotator; pause for users who prefer reduced motion.
  // Depending on `active` also gives a full dwell after a manual tab click.
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setActive((a) => (a + 1) % FEATURES.length), 4200);
    return () => clearInterval(id);
  }, [active, FEATURES.length]);

  const NETWORK = [
    { domain: 'samodaprasham.mk', url: 'https://samodaprasham.mk', tag: T('Правни прашања', 'Legal questions') },
    { domain: 'immigration.mk', url: 'https://immigration.mk', tag: T('Дозволи за престој', 'Residence permits') },
    { domain: 'macedoniancitizenship.mk', url: 'https://macedoniancitizenship.mk', tag: T('Државјанство', 'Citizenship') },
    { domain: 'company.nexa.mk', url: 'https://company.nexa.mk', tag: T('Основање фирма', 'Company setup') },
    { domain: 'iplaw.nexa.mk', url: 'https://iplaw.nexa.mk', tag: T('Интелектуална сопственост', 'IP law') },
    { domain: 'osiguran.nexa.mk', url: 'https://osiguran.nexa.mk', tag: T('Осигурување', 'Insurance') }
  ];

  return (
    <div className={styles.page}>
      <SEOHelmet
        title={T('Nexa за правници — нови клиенти од нашата мрежа', 'Nexa for Lawyers — new clients from our network')}
        description={T('Насочени случаи од специјализирани сајти по област и град, плус видливост како експерт. Ограничени места по област.',
                       'Routed cases from specialized sites by area and city, plus visibility as an expert. Limited seats per area.')}
        canonical="/"
        locale={isMk ? 'mk_MK' : 'en_US'}
        altLocale={isMk ? 'en_US' : 'mk_MK'}
        jsonLd={[NEXA_ORG, NEXA_WEBSITE, webPage({ url, name: 'Nexa for Lawyers', description: T('Нови клиенти за правници.', 'New clients for lawyers.'), language: lang })]}
      />

      {/* ── Left side: brand · pitch · footer ───────────────────────────── */}
      <div className={styles.pitchSide}>
      <header className={styles.topBar}>
        <Link to="/" className={styles.brand} aria-label="Nexa за правници">
          <img src="/nexa-logo-navbar.png" alt="Nexa" className={styles.brandLogo} />
        </Link>
        <nav className={styles.topNav}>
          <Link to="/blog">{T('Блог', 'Blog')}</Link>
          <Link to="/contact">{T('Контакт', 'Contact')}</Link>
          <a href={otherStorefrontUrl('/')} className={styles.crossLink}>
            {T('Nexa за бизниси', 'Nexa for business')}
            <span aria-hidden> ↗</span>
          </a>
        </nav>
      </header>

      <main className={styles.intro}>
          <span className={styles.pill}>
            {T('Ние нудиме можности — Вие решавате проблеми', 'We bring the opportunities — you solve the problems')}
          </span>
          <div className={styles.rotator}>
            <h1 className={styles.rotHook} key={`h-${active}`} aria-live="polite">
              {FEATURES[active].hook}
            </h1>
            <p className={styles.rotSub} key={`s-${active}`}>
              {FEATURES[active].sub}
            </p>
          </div>

          <div className={styles.featureTabs} role="tablist"
               aria-label={T('Што нудиме', 'What we offer')}>
            {FEATURES.map((f, i) => (
              <button
                key={f.label}
                type="button"
                role="tab"
                aria-selected={i === active}
                className={`${styles.featureTab} ${i === active ? styles.featureTabActive : ''}`}
                onClick={() => setActive(i)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className={styles.network}>
            <span className={styles.networkLabel}>{T('Од нашата мрежа', 'From our network')}</span>
            <div className={styles.marquee}>
              <div className={styles.marqueeTrack}>
                {[...NETWORK, ...NETWORK].map((n, i) => (
                  <a key={`${n.domain}-${i}`} href={n.url} target="_blank" rel="noopener noreferrer"
                     className={styles.chip} aria-hidden={i >= NETWORK.length}>
                    <span className={styles.chipDomain}>{n.domain}</span>
                    <span className={styles.chipTag}>{n.tag}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
      </main>
      </div>

      <aside className={styles.loginCol}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>{T('Најавете се', 'Sign in')}</h2>
            <p className={styles.cardSub}>
              {T('Продолжете во Вашиот Nexa Terminal.', 'Continue to your Nexa Terminal.')}
            </p>

            <button type="button" className={styles.google} onClick={handleGoogleLogin} disabled={loading}>
              <svg className={styles.googleIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {T('Најавете се со Google', 'Sign in with Google')}
            </button>

            <div className={styles.divider}>{T('или', 'or')}</div>

            {error && <div className={styles.error}>{error}</div>}

            <form className={styles.form} onSubmit={handleSubmit}>
              <input
                type="text"
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={T('Корисничко име или даночен број', 'Username or tax number')}
                autoComplete="username"
              />
              <input
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={T('Лозинка', 'Password')}
                autoComplete="current-password"
              />
              <div className={styles.forgotRow}>
                <Link to="/forgot-password" className={styles.smallLink}>
                  {T('Заборавена лозинка?', 'Forgot password?')}
                </Link>
              </div>
              <button type="submit" className={styles.submit} disabled={loading}>
                {loading ? T('Се најавувате…', 'Signing in…') : T('Најава', 'Sign in')}
              </button>
            </form>

            <p className={styles.footNote}>
              {T('Немате профил?', 'No account?')}{' '}
              <Link to="/login" className={styles.smallLink}>{T('Регистрирајте се', 'Create one')}</Link>
            </p>
          </div>
      </aside>

      {/* ── Small footer (bottom-left on desktop, page bottom on mobile) ─── */}
      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} Nexa Terminal</span>
        <span className={styles.footerSep} aria-hidden>·</span>
        <Link to="/privacy-policy">{T('Приватност', 'Privacy')}</Link>
        <span className={styles.footerSep} aria-hidden>·</span>
        <Link to="/terms-conditions">{T('Услови', 'Terms')}</Link>
        <span className={styles.footerSep} aria-hidden>·</span>
        <a href="mailto:info@nexa.mk">info@nexa.mk</a>
      </footer>
    </div>
  );
}
