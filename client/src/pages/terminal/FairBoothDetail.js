import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import styles from './Fair.module.css';

const TYPE_LABEL = { product: 'Производ', service: 'Услуга' };

export default function FairBoothDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const [booth, setBooth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios.get(`/api/fair/${id}`, auth)
      .then(r => { if (!cancelled) setBooth(r.data?.booth || null); })
      .catch(() => { if (!cancelled) setBooth(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasContact = booth && (booth.website || booth.contactEmail);

  return (
    <TerminalShell>
      <div className={styles.page}>
        <Link to="/terminal/fair" className={styles.btnGhost}>← Назад на саемот</Link>

        {loading ? (
          <div className={styles.loading}>Се вчитува…</div>
        ) : !booth ? (
          <div className={styles.empty}>Штандот не е пронајден.</div>
        ) : (
          <>
            {booth.imageUrl && (
              <img className={styles.cover} src={booth.imageUrl} alt={booth.companyName} />
            )}

            <div className={styles.boothHead} style={{ marginTop: 16 }}>
              {booth.logoUrl
                ? <img className={styles.logo} src={booth.logoUrl} alt={booth.companyName} />
                : <div className={`${styles.logo} ${styles.logoFallback}`}>{(booth.companyName || '?').charAt(0)}</div>}
              <div>
                <h1 className={styles.title}>{booth.companyName}</h1>
                {booth.city && <div className={styles.city}>{booth.city}</div>}
              </div>
            </div>

            {/* Direct contact — no platform-mediated inquiry */}
            {hasContact && (
              <div className={styles.contactBar}>
                {booth.website && (
                  <a className={styles.btnPrimary} href={booth.website} target="_blank" rel="noopener noreferrer">
                    Посети веб-страница
                  </a>
                )}
                {booth.contactEmail && (
                  <a className={styles.btnGhost} href={`mailto:${booth.contactEmail}`}>✉ {booth.contactEmail}</a>
                )}
              </div>
            )}

            <div className={styles.offers}>
              {(booth.offers || []).map((o, i) => (
                <div key={i} className={styles.offer}>
                  <div className={styles.offerBody}>
                    <span className={`${styles.typeBadge} ${o.type === 'product' ? styles.typeProduct : styles.typeService}`}>
                      {TYPE_LABEL[o.type] || o.type}
                    </span>
                    <p className={styles.offerDesc}>{o.text}</p>
                    {o.whyUs && (
                      <div className={styles.whyUs}>
                        <strong>Зошто ние</strong>
                        {o.whyUs}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </TerminalShell>
  );
}
