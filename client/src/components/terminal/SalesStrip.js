import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import styles from './SalesStrip.module.css';

/**
 * Dashboard „Продажба овој месец" — money first. Shows only numbers that are
 * not zero; an account with no sales activity yet gets three first steps
 * instead of a row of zeros (an empty account must not look dead).
 */
const den = (n) => `${Number(n || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })} ден.`;
const eur = (n) => `€${Number(n || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })}`;

export default function SalesStrip() {
  const { token } = useAuth();
  const [d, setD] = useState(null);

  useEffect(() => {
    let cancelled = false;
    axios.get('/api/sales/overview', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { if (!cancelled) setD(r.data.data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token]);

  if (!d) return null;
  const { pipeline: p, quotes: q, page } = d;

  const tiles = [
    q.acceptedMonth > 0 && { key: 'won', to: '/terminal/ponudi', tone: 'success', value: den(q.acceptedMonthMkd), label: `прифатени понуди (${q.acceptedMonth})` },
    p.wonMonth.count > 0 && q.acceptedMonth === 0 && { key: 'deals', to: '/terminal/sales', tone: 'success', value: p.wonMonth.value ? eur(p.wonMonth.value) : p.wonMonth.count, label: 'добиени зделки' },
    q.awaiting > 0 && { key: 'await', to: '/terminal/ponudi', value: den(q.awaitingMkd), label: `чекаат одговор (${q.awaiting})${q.unopened ? ` · ${q.unopened} неотворени` : ''}` },
    p.open > 0 && { key: 'pipe', to: '/terminal/sales', value: p.openValueEur ? eur(p.openValueEur) : p.open, label: `во инката (${p.open} отворени)` },
    page.views > 0 && { key: 'views', to: '/terminal/moj-profil', value: page.views, label: 'прегледи на Вашата страница' },
  ].filter(Boolean);

  const actions = [
    page.newMessages > 0 && { key: 'msg', to: '/terminal/moj-profil', text: page.newMessages === 1 ? '1 нова порака од Вашата страница — додајте ја во Клиенти' : `${page.newMessages} нови пораки од Вашата страница — додајте ги во Клиенти` },
    p.overdue > 0 && { key: 'due', to: '/terminal/sales', text: `${p.overdue} ${p.overdue === 1 ? 'задоцнета активност' : 'задоцнети активности'} кај клиенти` },
  ].filter(Boolean);

  if (!tiles.length && !actions.length) {
    return (
      <section className={styles.strip} aria-label="Продажба">
        <div className={styles.head}>
          <h2>Продажба</h2>
          <span>Три чекори до првиот клиент преку Nexa</span>
        </div>
        <div className={styles.steps}>
          <Link to="/terminal/moj-profil" className={styles.step}><b>1</b><span><strong>Моја страница</strong>Бесплатна страница за фирмата — споделете ја насекаде.</span></Link>
          <Link to="/terminal/sales" className={styles.step}><b>2</b><span><strong>Клиенти</strong>Внесете ги потенцијалните клиенти и следниот чекор.</span></Link>
          <Link to="/terminal/ponudi" className={styles.step}><b>3</b><span><strong>Понуда</strong>Пратете понуда како линк — клиентот прифаќа со едно копче.</span></Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.strip} aria-label="Продажба овој месец">
      <div className={styles.head}>
        <h2>Продажба овој месец</h2>
        <Link to="/terminal/ponudi" className={styles.cta}>+ Нова понуда</Link>
      </div>
      {tiles.length > 0 && (
        <div className={styles.tiles}>
          {tiles.map((t) => (
            <Link key={t.key} to={t.to} className={`${styles.tile} ${t.tone === 'success' ? styles.tileSuccess : ''}`}>
              <strong>{t.value}</strong><span>{t.label}</span>
            </Link>
          ))}
        </div>
      )}
      {actions.map((a) => (
        <Link key={a.key} to={a.to} className={styles.action}>{a.text} →</Link>
      ))}
    </section>
  );
}
