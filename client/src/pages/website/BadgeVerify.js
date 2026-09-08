import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PublicLayout from '../../components/website/PublicLayout';
import SEOHelmet from '../../components/seo/SEOHelmet';
import s from './EmployerBadge.module.css';

/**
 * Public „Проверен работодавач“ verify page — where a badge's link resolves.
 * Shows the seal, company, rating, validity + an honest self-assessment note,
 * and a CTA for the viewer to check their own company (the acquisition loop).
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const STATUS = {
  valid: { cls: 'statusValid', label: 'Активна значка' },
  expired: { cls: 'statusExpired', label: 'Истечена значка' },
  revoked: { cls: 'statusRevoked', label: 'Повлечена значка' },
};

function fmt(d) {
  if (!d) return '';
  const dt = new Date(d);
  return `${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}`;
}

export default function BadgeVerify() {
  const { token } = useParams();
  const [state, setState] = useState('loading'); // loading | ok | notfound
  const [status, setStatus] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/public/employer-badge/verify/${token}`)
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok || !j.success) { setState('notfound'); return; }
        setStatus(j.status); setData(j.data); setState('ok');
      })
      .catch(() => setState('notfound'));
  }, [token]);

  const st = status ? STATUS[status] : null;

  return (
    <PublicLayout>
      <SEOHelmet
        title="Проверен работодавач · Nexa"
        description="Потврда за спроведена Nexa правна проверка (самопроценка) на работодавач."
        canonical={`/badge/${token}`}
        locale="mk_MK"
      />
      <section className="nx-section">
        <div className="nexa-container">
          <div className={s.verifyWrap}>
            {state === 'loading' && <p>Се вчитува…</p>}

            {state === 'notfound' && (
              <>
                <h1 className={s.verifyCompany}>Значката не е пронајдена</h1>
                <p className={s.verifySub}>Овој линк за потврда не постои или е повлечен.</p>
                <a className="nexa-btn nexa-btn-accent" href="/proverka-rabotodavac">Направете ваша проверка</a>
              </>
            )}

            {state === 'ok' && data && (
              <>
                {st && <span className={`${s.statusBadge} ${s[st.cls]}`}>{st.label}</span>}
                <div className={s.sealWrap}>
                  <img src={`${API_BASE}/public/employer-badge/verify/${token}/image.svg`} alt="Nexa Проверен работодавач" />
                </div>
                <h1 className={s.verifyCompany}>{data.companyName}</h1>
                <p className={s.verifySub}>
                  Проверен работодавач · рејтинг <strong>{data.ratingTier}</strong>
                  {data.ratingLabel ? ` — ${data.ratingLabel}` : ''}
                  {data.verified ? ' · верификувана компанија' : ''}
                </p>
                <p className={s.verifyMeta}>Издадено: {fmt(data.issuedAt)} · Важи до: {fmt(data.expiresAt)}</p>

                <p className={s.verifyDisclaimer}>
                  Оваа значка е резултат на самопроценка спроведена преку Nexa и е сигнал на
                  посветеност на работничките права. Не претставува правна заверка, ревизија
                  ниту гаранција за усогласеност.
                </p>

                <div className={s.verifyCta}>
                  <a className="nexa-btn nexa-btn-accent nexa-btn-lg" href="/proverka-rabotodavac">
                    Проверете ја вашата фирма — бесплатно
                  </a>
                  {status === 'valid' && (
                    <p className={s.verifyMeta}>
                      <a href={`${API_BASE}/public/employer-badge/verify/${token}/certificate.pdf`} target="_blank" rel="noopener noreferrer">
                        Преземи потврда (PDF)
                      </a>
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
