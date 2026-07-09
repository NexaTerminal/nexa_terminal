import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { hasFeatureAccess } from '../../lib/tier';
import styles from './CommandCenter.module.css';

/**
 * Dashboard command center (master-plan Phase 3): compliance score per
 * domain, next-best-action card, recent documents. Replaces the "social
 * feed as main stage" dashboard — the updates feed now renders below.
 */

const DOMAIN_META = {
  legal: { label: 'Правна', path: '/terminal/legal-screening' },
  marketing: { label: 'Маркетинг', path: '/terminal/marketing-screening' },
  hr: { label: 'HR и Оперативна', path: '/terminal/hr-screening' },
  cyber: { label: 'Сајбер', path: '/terminal/cyber-screening' }
};

const fmtDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date)) return '';
  return date.toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' });
};

const scoreClass = (pct) => {
  if (pct === null || pct === undefined) return '';
  if (pct >= 80) return styles.scoreGood;
  if (pct >= 50) return styles.scoreMid;
  return styles.scoreLow;
};

/**
 * One rule-driven suggestion, most urgent first:
 *   1. never screened at all → run the legal check
 *   2. latest legal screening has violations → fix them (documents)
 *   3. any domain never screened → run that one
 *   4. everything screened, no violations → generate documents / re-check
 */
function nextBestAction(screenings) {
  const legal = screenings.find((s) => s.domain === 'legal');
  if (legal && !legal.done) {
    return {
      title: 'Направете ја првата правна проверка',
      body: 'За 10-15 минути дознавате каде вашата фирма е изложена — работни односи, лични податоци, безбедност.',
      cta: 'Започни проверка', path: '/terminal/legal-screening'
    };
  }
  if (legal?.violationsCount > 0) {
    return {
      title: `Имате ${legal.violationsCount} ${legal.violationsCount === 1 ? 'наод' : 'наоди'} од правната проверка`,
      body: 'Повеќето наоди се решаваат со документ што Nexa го генерира за 30 секунди.',
      cta: 'Генерирај ги документите', path: '/terminal/documents'
    };
  }
  const missing = screenings.find((s) => !s.done);
  if (missing) {
    const meta = DOMAIN_META[missing.domain];
    return {
      title: `Проверете ја ${meta.label.toLowerCase()} усогласеност`,
      body: 'Оваа област сè уште не е проверена — пополнете ја сликата за вашата фирма.',
      cta: 'Започни проверка', path: meta.path
    };
  }
  return {
    title: 'Сè е проверено — одржувајте',
    body: 'Генерирајте ги документите што ви требаат или повторете проверка за свежа слика.',
    cta: 'Кон документите', path: '/terminal/documents'
  };
}

export default function CommandCenter() {
  const { currentUser, token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!token || !hasFeatureAccess(currentUser)) return;
    axios.get('/api/dashboard/summary', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setData(res.data.data))
      .catch(() => setData(null));
  }, [token, currentUser]);

  if (!data) return null;

  const action = nextBestAction(data.screenings || []);

  return (
    <>
      {/* Next best action */}
      <section className={styles.actionCard}>
        <div className={styles.actionBody}>
          <h2 className={styles.actionTitle}>{action.title}</h2>
          <p className={styles.actionText}>{action.body}</p>
        </div>
        <Link to={action.path} className={styles.actionBtn}>{action.cta} →</Link>
      </section>

      {/* Compliance scores per domain */}
      <section className={styles.grid}>
        {(data.screenings || []).map((s) => {
          const meta = DOMAIN_META[s.domain];
          if (!meta) return null;
          return (
            <Link key={s.domain} to={meta.path} className={styles.domainCard}>
              <div className={styles.domainLabel}>{meta.label}</div>
              {s.done ? (
                <>
                  <div className={`${styles.domainScore} ${scoreClass(s.percentage)}`}>
                    {s.percentage !== null ? `${s.percentage}%` : (s.grade || '✓')}
                  </div>
                  <div className={styles.domainMeta}>
                    {s.domain === 'legal' && s.areasDone > 1 ? `${s.areasDone} области · ` : ''}
                    {fmtDate(s.createdAt)}
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.domainEmpty}>—</div>
                  <div className={styles.domainMeta}>Направи проверка →</div>
                </>
              )}
            </Link>
          );
        })}
      </section>

      {/* Savings meter (Phase 5) — the ten-second renewal argument */}
      {data.savings?.docsCount > 0 && (
        <section className={styles.savings}>
          <span className={styles.savingsAmount}>~€{data.savings.totalEur.toLocaleString('mk-MK')}</span>
          <span className={styles.savingsText}>
            заштедени адвокатски трошоци досега — {data.savings.docsCount}{' '}
            {data.savings.docsCount === 1 ? 'генериран документ' : 'генерирани документи'}
            <span className={styles.savingsHint}> (проценка по просечни пазарни цени)</span>
          </span>
        </section>
      )}

      {/* Recent documents */}
      {data.recentDocuments?.length > 0 && (
        <section className={styles.recent}>
          <div className={styles.recentHead}>
            <h2 className={styles.recentTitle}>Последни документи</h2>
            <Link to="/terminal/documents" className={styles.recentAll}>Сите документи →</Link>
          </div>
          <ul className={styles.recentList}>
            {data.recentDocuments.map((d) => (
              <li key={d._id} className={styles.recentItem}>
                <span className={styles.recentName}>{d.fileName}</span>
                <span className={styles.recentDate}>{fmtDate(d.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
