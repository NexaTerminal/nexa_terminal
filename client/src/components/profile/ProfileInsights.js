import React, { useEffect, useState } from 'react';
import ApiService from '../../services/api';
import styles from '../../styles/terminal/CompanyProfile.module.css';

/** Views, contacts and the latest visitor messages for the owner. */
export default function ProfileInsights() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);

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
                <span><strong>{m.name}</strong> · {fmt(m.createdAt)}</span>
                <span aria-hidden="true">{open === m._id ? '−' : '+'}</span>
              </button>
              {open === m._id && (
                <div className={styles.messageBody}>
                  <p>{m.message}</p>
                  <p className={styles.help}>
                    <a href={`mailto:${m.email}`} className={styles.textLink}>{m.email}</a>
                    {m.phone ? ` · ${m.phone}` : ''}
                  </p>
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
