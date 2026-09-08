import { useEffect, useState } from 'react';
import Header from '../../components/common/Header';
import s from '../website/EmployerBadge.module.css';
import BadgeSharePanel from '../../components/badge/BadgeSharePanel';
import { BADGE_RESULT_KEY } from '../website/EmployerBadgeCheck';

/**
 * Authenticated landing after Google signup from the „Проверен работодавач“
 * public check. Claims (issues) the badge for the just-completed check, then
 * shows the seal + share panel (embed, LinkedIn, download, copy verify link).
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

function getResultId() {
  const q = new URLSearchParams(window.location.search).get('result');
  if (q) return q;
  try { return localStorage.getItem(BADGE_RESULT_KEY); } catch (_) { return null; }
}

export default function BadgeClaim() {
  const [state, setState] = useState('loading'); // loading | ready | notEligible | error
  const [token, setToken] = useState(null);
  const [tier, setTier] = useState(null);

  useEffect(() => {
    const resultId = getResultId();
    if (!resultId) { setState('error'); return; }
    const jwt = localStorage.getItem('token');
    fetch(`${API_BASE}/public/employer-badge/result/${resultId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) { setState('error'); return; }
        if (!d.eligible) { setState('notEligible'); return; }
        setToken(d.token); setTier(d.ratingTier); setState('ready');
        try { localStorage.removeItem(BADGE_RESULT_KEY); } catch (_) { /* ignore */ }
      })
      .catch(() => setState('error'));
  }, []);

  return (
    <div>
      <Header isTerminal={true} />
      <div className="nexa-container">
        <div className={s.verifyWrap}>
          {state === 'loading' && <p>Се издава вашата значка…</p>}

          {state === 'error' && (
            <>
              <h1 className={s.verifyCompany}>Нешто не е во ред</h1>
              <p className={s.verifySub}>Не успеавме да ја издадеме значката. Обидете се повторно преку проверката.</p>
              <a className="nexa-btn nexa-btn-accent" href="/proverka-rabotodavac">Кон проверката</a>
            </>
          )}

          {state === 'notEligible' && (
            <>
              <h1 className={s.verifyCompany}>Резултатот е под прагот за значка</h1>
              <p className={s.verifySub}>
                Потребни се најмалку 65%. Отворете го извештајот и решете ги недостатоците, па повторете ја проверката.
              </p>
              <a className="nexa-btn nexa-btn-accent" href="/terminal/legal-screening">Кон проверките</a>
            </>
          )}

          {state === 'ready' && token && (
            <>
              <span className={`${s.statusBadge} ${s.statusValid}`}>Значката е издадена · рејтинг {tier}</span>
              <BadgeSharePanel token={token} />
              <p className={s.verifyMeta}>
                Значката е зачувана на вашиот профил — секогаш ја наоѓате под „Мојата значка“.
              </p>
              <p className={s.verifyDisclaimer}>
                Значката е самопроценка и важи 1 година. Не претставува правна заверка или гаранција за усогласеност.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
