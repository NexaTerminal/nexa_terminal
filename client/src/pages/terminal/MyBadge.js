import { useEffect, useState } from 'react';
import Header from '../../components/common/Header';
import s from '../website/EmployerBadge.module.css';
import BadgeSharePanel from '../../components/badge/BadgeSharePanel';

/**
 * „Мојата значка" — lets a user re-open and re-share their „Проверен работодавач"
 * badge anytime from the terminal (it's attached to their account). If they
 * don't have one yet, points them to the public check.
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const STATUS_LABEL = {
  valid: 'Активна',
  expired: 'Истечена — повторете ја проверката за обнова',
  revoked: 'Повлечена',
};

function fmt(d) {
  if (!d) return '';
  const dt = new Date(d);
  return `${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}`;
}

export default function MyBadge() {
  const [state, setState] = useState('loading'); // loading | has | none | error
  const [badge, setBadge] = useState(null);

  useEffect(() => {
    const jwt = localStorage.getItem('token');
    fetch(`${API_BASE}/public/employer-badge/mine`, {
      headers: { ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) { setState('error'); return; }
        if (!d.badge) { setState('none'); return; }
        setBadge(d.badge); setState('has');
      })
      .catch(() => setState('error'));
  }, []);

  return (
    <div>
      <Header isTerminal={true} />
      <div className="nexa-container">
        <div className={s.verifyWrap}>
          <h1 className={s.verifyCompany}>Мојата значка</h1>

          {state === 'loading' && <p>Се вчитува…</p>}

          {(state === 'none' || state === 'error') && (
            <>
              <p className={s.verifySub}>
                Сè уште немате значка „Проверен работодавач“. Направете ја бесплатната
                проверка и добијте ја вашата значка со рејтинг.
              </p>
              <a className="nexa-btn nexa-btn-accent nexa-btn-lg" href="/proverka-rabotodavac">
                Направи проверка
              </a>
            </>
          )}

          {state === 'has' && badge && (
            <>
              <p className={s.verifySub}>
                {badge.companyName} · рејтинг <strong>{badge.ratingTier}</strong>
                {badge.ratingLabel ? ` — ${badge.ratingLabel}` : ''}
                {badge.verified ? ' · верификувана компанија' : ''}
              </p>
              <p className={s.verifyMeta}>
                Статус: {STATUS_LABEL[badge.status] || badge.status} · Издадено: {fmt(badge.issuedAt)} · Важи до: {fmt(badge.expiresAt)}
              </p>

              <BadgeSharePanel token={badge.token} />

              {badge.status === 'expired' && (
                <div className={s.verifyCta}>
                  <a className="nexa-btn nexa-btn-accent" href="/proverka-rabotodavac">Обнови ја значката</a>
                </div>
              )}
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
