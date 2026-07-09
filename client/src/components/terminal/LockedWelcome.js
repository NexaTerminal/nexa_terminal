import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { openSubscriptionGate, hasFreeDocPass } from '../../lib/tier';
import { PROVERKA_RESULT_KEY } from '../../pages/website/Proverka';
import styles from './LockedWelcome.module.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

/**
 * Full-width onboarding panel shown on the Dashboard to LOCKED accounts
 * (subscription.status === 'none' — registered, no code, no payment).
 *
 * Replaces the old dead-end (slim strip + updates feed) with a screen that
 * sells what's inside and offers the two unlock paths: redeem a code or
 * order a plan (opens the in-terminal SubscriptionGate modal).
 */

const PILLARS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>
      </svg>
    ),
    title: 'Автоматизирани документи',
    desc: '45+ правни документи — договори, одлуки, политики — подготвени за 30 секунди.'
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>
      </svg>
    ),
    title: 'Проверки за усогласеност',
    desc: 'Правна, HR, маркетинг и сајбер проверка — дознајте што Ви недостасува.'
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M5.5 18.5l2-2M16.5 7.5l2-2"/>
      </svg>
    ),
    title: 'Nexa AI',
    desc: 'Правен AI помошник базиран на македонското право + анализа на договори.'
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z"/><path d="M9 7h6M9 11h6"/>
      </svg>
    ),
    title: 'Мои шаблони и курсеви',
    desc: 'Прикачете свој .docx и автоматизирајте го + едукативни ресурси.'
  }
];

export default function LockedWelcome() {
  const { currentUser } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }

  // If the user arrived through the public „Бесплатна проверка" funnel,
  // surface their score + gaps here — continuity from the public page into
  // the locked terminal (master-plan Phase 1.2).
  const [teaser, setTeaser] = useState(null);
  useEffect(() => {
    let id = null;
    try { id = localStorage.getItem(PROVERKA_RESULT_KEY); } catch (_) { /* ignore */ }
    if (!id) return;
    fetch(`${API_BASE}/public/screening/result/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.success) setTeaser(d.data); })
      .catch(() => { /* best-effort */ });
  }, []);

  const onRedeem = async (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setBusy(true); setMsg(null);
    try {
      await ApiService.request('/subscription/redeem-code', { method: 'POST', body: JSON.stringify({ code: trimmed }) });
      setMsg({ ok: true, text: 'Кодот е успешно искористен — пристапот е активен. Се вчитува…' });
      // Auth context caches the locked state; a reload picks up the fresh
      // subscription and reveals the full terminal.
      setTimeout(() => window.location.reload(), 1200);
    } catch (ex) {
      setMsg({ ok: false, text: ex.message || 'Кодот не може да се искористи.' });
      setBusy(false);
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.head}>
        <h1 className={styles.title}>Добредојдовте во Nexa Терминал</h1>
        <p className={styles.lead}>
          Вашата сметка е креирана. За да ги отклучите алатките, внесете код за
          активација или изберете план — активирањето е веднашно.
        </p>
      </div>

      {teaser && (
        <div className={styles.teaser}>
          <div className={styles.teaserScore}>
            <span className={styles.teaserPct}>{teaser.percentage}%</span>
            <span className={styles.teaserGrade}>{teaser.grade}</span>
          </div>
          <div className={styles.teaserBody}>
            <div className={styles.teaserTitle}>
              Вашата бесплатна проверка идентификуваше {teaser.gapCount}{' '}
              {teaser.gapCount === 1 ? 'недостаток' : 'недостатоци'}
            </div>
            <ul className={styles.teaserGaps}>
              {teaser.topGaps.map((g) => (
                <li key={g.id}>{g.gapTitle}</li>
              ))}
            </ul>
            <div className={styles.teaserNote}>
              Активирајте го пристапот за да ги решите — документите и целосните
              проверки се веднаш достапни.
            </div>
          </div>
        </div>
      )}

      <div className={styles.pillars}>
        {PILLARS.map((p) => (
          <div key={p.title} className={styles.pillar}>
            <span className={styles.pillarIcon}>{p.icon}</span>
            <div>
              <div className={styles.pillarTitle}>{p.title}</div>
              <div className={styles.pillarDesc}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <form className={styles.redeemForm} onSubmit={onRedeem}>
          <input
            type="text"
            className={styles.redeemInput}
            placeholder="Код за активација"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={busy}
            aria-label="Код за активација"
          />
          <button type="submit" className={styles.redeemBtn} disabled={busy || !code.trim()}>
            {busy ? 'Се активира…' : 'Активирај'}
          </button>
        </form>
        <span className={styles.or}>или</span>
        <button
          type="button"
          className={styles.planBtn}
          onClick={() => openSubscriptionGate({ message: 'Изберете план за да го активирате пристапот.' })}
        >
          Изберете план →
        </button>
      </div>

      {msg && (
        <p className={`${styles.msg} ${msg.ok ? styles.msgOk : styles.msgErr}`} role="status">
          {msg.text}
        </p>
      )}

      {hasFreeDocPass(currentUser) && (
        <div className={styles.freeDoc}>
          <span className={styles.freeDocBadge}>Подарок</span>
          <span className={styles.freeDocText}>
            Имате <strong>1 бесплатен документ</strong> — пробајте го генераторот
            без активација.
          </span>
          <Link to="/terminal/documents" className={styles.freeDocLink}>
            Генерирај документ →
          </Link>
        </div>
      )}
    </section>
  );
}
