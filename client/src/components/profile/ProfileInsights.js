import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../../services/api';
import styles from '../../styles/terminal/CompanyProfile.module.css';

/** Views, contacts and the latest visitor messages for the owner. */
export default function ProfileInsights() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);
  const [adding, setAdding] = useState(null);

  // „Додај во Клиенти": the visitor becomes a potential deal in the pipeline.
  const toDeal = async (m) => {
    setAdding(m._id);
    try {
      const r = await ApiService.request(`/profile/me/messages/${m._id}/to-deal`, { method: 'POST' });
      setData((d) => ({ ...d, messages: d.messages.map((x) => (x._id === m._id ? { ...x, dealId: r.dealId } : x)) }));
    } catch (_) { /* keep the button; user can retry */ }
    setAdding(null);
  };

  useEffect(() => {
    let cancelled = false;
    ApiService.request('/profile/me/insights').then((d) => !cancelled && setData(d)).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!data) return null;
  const fmt = (d) => new Date(d).toLocaleDateString('mk-MK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return (
    <div className={styles.panel}>
      <h2 className={styles.groupTitle}>Резултати</h2>
      <div className={styles.stats}>
        <div><strong>{data.month.views}</strong><span>прегледи овој месец</span></div>
        <div><strong>{data.month.contacts}</strong><span>пораки овој месец</span></div>
        <div><strong>{data.total.views}</strong><span>прегледи вкупно</span></div>
      </div>
      {data.messages.length > 0 ? (
        <ul className={styles.messages}>
          {data.messages.map((m) => (
            <li key={m._id}>
              <button type="button" className={styles.messageHead} onClick={() => setOpen(open === m._id ? null : m._id)}>
                <span>
                  <strong>{m.name}</strong> · {fmt(m.createdAt)}
                  {m.service && <span className={styles.msgService}> · понуда: {m.service}</span>}
                  {m.postTitle && <span className={styles.msgService}> · објава: {m.postTitle}</span>}
                  {m.dealId && <span className={styles.msgInPipe}> · во Клиенти</span>}
                </span>
                <span aria-hidden="true">{open === m._id ? '−' : '+'}</span>
              </button>
              {open === m._id && (
                <div className={styles.messageBody}>
                  <p>{m.message}</p>
                  <p className={styles.help}>
                    <a href={`mailto:${m.email}`} className={styles.textLink}>{m.email}</a>
                    {m.phone ? ` · ${m.phone}` : ''}
                    {m.fromSlug ? <> · <a href={`/f/${m.fromSlug}`} target="_blank" rel="noopener noreferrer" className={styles.textLink}>страница на фирмата</a></> : ''}
                  </p>
                  {m.dealId ? (
                    <Link to="/terminal/sales" className={styles.textLink}>Отвори во Клиенти →</Link>
                  ) : (
                    <button type="button" className={styles.msgAction} disabled={adding === m._id} onClick={() => toDeal(m)}>
                      {adding === m._id ? 'Се додава…' : '+ Додај во Клиенти'}
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.help}>Сè уште нема пораки. Споделете го линкот — пораките од формуларот стигнуваат на Вашата е-пошта и тука.</p>
      )}
    </div>
  );
}
