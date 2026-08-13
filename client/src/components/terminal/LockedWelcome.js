import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { openSubscriptionGate, hasFreeDocPass, hasFreeCheckPass } from '../../lib/tier';
import { activeProduct } from '../../lib/storefront';
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

// ── Product A (SMB) pillars — mirror the SMB sidebar groups:
// Администрирај · Набави · Расти · Учи.
const PILLARS_A = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>
      </svg>
    ),
    title: 'Администрација',
    desc: '45+ автоматизирани документи, свои шаблони, Правен AI, анализа на договори и проверки на усогласеност.'
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h4"/><circle cx="14.5" cy="15.5" r="2.2"/><path d="M16.2 17.2L18 19"/>
      </svg>
    ),
    title: 'Набавки',
    desc: 'Побарајте понуди од проверени добавувачи — ние ги собираме и Ви ги доставуваме.'
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 17l6-6 4 4 7-7"/><path d="M17 7h4v4"/>
      </svg>
    ),
    title: 'Маркетинг и раст',
    desc: 'Блог статија под Ваше име, банер во билтенот до 1000+ претплатници, Маркетинг AI и маркетинг проверка.'
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z"/><path d="M9 7h6M9 11h6"/>
      </svg>
    ),
    title: 'Едукација',
    desc: 'Курсеви и стручни содржини за бизнис и право.'
  }
];

// ── Product B (Lawyers / Pro) pillars — the leads.nexa.mk value proposition.
const PILLARS_B = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 13h5l1 3h6l1-3h5"/><path d="M3 13V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7"/><path d="M3 13v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>
      </svg>
    ),
    title: 'Насочени случаи',
    desc: 'Барања од клиенти од нашата мрежа специјализирани сајтови — насочени до Вас по област и град, право во сандачето.'
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 21l-4.9-2.6.9-5.5-4-3.9 5.5-.8z"/>
      </svg>
    ),
    title: 'Ексклузивност по област',
    desc: 'Најмногу 3 правници по област. Помалку конкуренција, повеќе вредни случаи — местото е Ваше додека областа е слободна.'
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 17l6-6 4 4 7-7"/><path d="M17 7h4v4"/>
      </svg>
    ),
    title: 'Видливост како експерт',
    desc: 'Одговарајте на Topics прашања, објавете блог под Ваше име и добијте банер во билтенот до 1000+ претплатници.'
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M5.5 18.5l2-2M16.5 7.5l2-2"/>
      </svg>
    ),
    title: 'Алатки за работа',
    desc: 'Правен AI, автоматизирани документи и анализа на договори — бонус кон членството, користете колку сакате.'
  }
];

export default function LockedWelcome() {
  const { currentUser } = useAuth();
  // Domain-driven shell: leads.nexa.mk → the Pro onboarding pitch, nexa.mk → SMB.
  const isPro = activeProduct() === 'B';
  const PILLARS = isPro ? PILLARS_B : PILLARS_A;
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }

  // If the user arrived through the public „Бесплатна проверка" funnel,
  // surface their score + gaps here — continuity from the public page into
  // the locked terminal (master-plan Phase 1.2).
  const [teaser, setTeaser] = useState(null);
  useEffect(() => {
    let id = null;
    try {
      // Magic-link arrivals carry ?result=<id> (works cross-device); fall back
      // to the localStorage id set on the public /proverka page (same browser).
      id = new URLSearchParams(window.location.search).get('result')
        || localStorage.getItem(PROVERKA_RESULT_KEY);
    } catch (_) { /* ignore */ }
    if (!id) return;
    fetch(`${API_BASE}/public/screening/result/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.success) setTeaser(d.data); })
      .catch(() => { /* best-effort */ });
    // Link this teaser completion to the now-signed-in account (funnel
    // attribution for Google arrivals). Best-effort, fire-and-forget.
    ApiService.request(`/public/screening/result/${id}/claim`, { method: 'POST' }).catch(() => {});
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
        {teaser ? (
          <>
            <h1 className={styles.title}>Продолжете ја вашата проверка на усогласеност</h1>
            <p className={styles.lead}>
              Сметката е креирана. Подолу е резултатот од вашата бесплатна проверка.
              Следен чекор: решете ги пропустите со автоматизирани документи и направете
              целосни проверки за секоја област — работни односи, лични податоци,
              безбедност, отпад и повеќе.
            </p>
          </>
        ) : (
          <>
            <h1 className={styles.title}>
              {isPro ? 'Добредојдовте во Nexa за правници' : 'Добредојдовте во Nexa Терминал'}
            </h1>
            <p className={styles.lead}>
              {isPro
                ? 'Вашата сметка е креирана. За да почнете да примате насочени случаи од нашата мрежа, внесете код за активација или изберете план — активирањето е веднашно.'
                : 'Вашата сметка е креирана. За да ги отклучите алатките, внесете код за активација или изберете план — активирањето е веднашно.'}
            </p>
          </>
        )}
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
              Отклучете го пристапот за да ги решите овие пропусти — целосните проверки
              на усогласеност и документите за нивно решавање се веднаш достапни.
            </div>
          </div>
        </div>
      )}

      {!isPro && hasFreeCheckPass(currentUser) && (
        <div className={styles.freeDoc}>
          <span className={styles.freeDocBadge}>Бесплатно</span>
          <span className={styles.freeDocText}>
            Направете <strong>една целосна проверка на усогласеност</strong> бесплатно —
            изберете област (работни односи, лични податоци, безбедност, отпад…) и добијте
            детален извештај со приоритетни ризици и чекори за усогласување.
          </span>
          <Link to="/terminal/legal-screening" className={styles.freeDocLink}>
            Започни целосна проверка →
          </Link>
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

      {!isPro && hasFreeDocPass(currentUser) && (
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
