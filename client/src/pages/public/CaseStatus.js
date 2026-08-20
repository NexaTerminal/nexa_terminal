import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import casesApi from '../../services/casesApi';
import styles from './CaseStatus.module.css';
import {
  CASE_TYPE_LABEL, STATUS_LABEL, DEADLINE_TYPE_LABEL, TIMELINE_TYPE_LABEL, fmtDate, dueLabel
} from '../../config/cases';

/**
 * Public, read-only case status page for a lawyer's client. No authentication.
 * The server returns only the client-visible subset (see casesService
 * getPublicByToken); this page never has access to internal notes or fees.
 */
export default function CaseStatus() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    casesApi.getPublic(token)
      .then((res) => { if (!cancelled) setData(res.case); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return <div className={styles.wrap}><div className={styles.state}><p>Се вчитува…</p></div></div>;
  }

  if (notFound || !data || data.state === 'inactive') {
    return (
      <div className={styles.wrap}>
        <div className={styles.state}>
          <h1>Статусот не е достапен</h1>
          <p>Овој линк е неактивен или предметот е затворен. Контактирајте го вашиот адвокат за повеќе информации.</p>
        </div>
      </div>
    );
  }

  const badgeClass =
    data.state === 'closed' ? styles.badge_closed
    : data.status === 'waiting' ? styles.badge_waiting
    : styles.badge_active;

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.brand}>Статус на предмет</div>
          <h1 className={styles.title}>{data.title}</h1>
          <span className={`${styles.badge} ${badgeClass}`}>{STATUS_LABEL[data.status] || data.status}</span>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Детали</div>
          <div className={styles.meta}>
            <div className={styles.metaItem}><span className={styles.metaLabel}>Вид</span><span className={styles.metaValue}>{CASE_TYPE_LABEL[data.caseType] || data.caseType}</span></div>
            {data.courtName && <div className={styles.metaItem}><span className={styles.metaLabel}>Суд / институција</span><span className={styles.metaValue}>{data.courtName}</span></div>}
            {data.caseNumber && <div className={styles.metaItem}><span className={styles.metaLabel}>Службен број</span><span className={styles.metaValue}>{data.caseNumber}</span></div>}
            {data.internalNumber && <div className={styles.metaItem}><span className={styles.metaLabel}>Внатрешен број</span><span className={styles.metaValue}>{data.internalNumber}</span></div>}
          </div>
        </div>

        {data.nextDeadline && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Следен чекор</div>
            <div className={styles.next}>
              <span className={styles.nextLabel}>
                {DEADLINE_TYPE_LABEL[data.nextDeadline.type] || 'Рок'}: {data.nextDeadline.title}
              </span>
              <span className={styles.nextDate}>{fmtDate(data.nextDeadline.dueAt)} · {dueLabel(data.nextDeadline.dueAt)}</span>
            </div>
          </div>
        )}

        {data.timeline && data.timeline.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Тек на предметот</div>
            <ul className={styles.timeline}>
              {data.timeline.map((e, i) => (
                <li key={i} className={styles.tItem}>
                  <span className={styles.tDot} />
                  <div className={styles.tDate}>{fmtDate(e.at)} · {TIMELINE_TYPE_LABEL[e.type] || ''}</div>
                  {e.title && <div className={styles.tTitle}>{e.title}</div>}
                  {e.body && <div className={styles.tBody}>{e.body}</div>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.lawyer && (data.lawyer.companyName || data.lawyer.email || data.lawyer.phone) && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Ваш адвокат</div>
            <div className={styles.contact}>
              {data.lawyer.companyName && <div><strong>{data.lawyer.companyName}</strong></div>}
              {data.lawyer.email && <div><a href={`mailto:${data.lawyer.email}`}>{data.lawyer.email}</a></div>}
              {data.lawyer.phone && <div><a href={`tel:${data.lawyer.phone}`}>{data.lawyer.phone}</a></div>}
              {data.lawyer.website && <div><a href={data.lawyer.website} target="_blank" rel="noreferrer">{data.lawyer.website}</a></div>}
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.updated}>Последно ажурирање: {fmtDate(data.updatedAt)}</div>
          Оваа страница ја одржува вашиот адвокат преку Nexa Терминал.
        </div>
      </div>
    </div>
  );
}
