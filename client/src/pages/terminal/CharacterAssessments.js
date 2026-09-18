import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import ProfileReport from '../../components/character/ProfileReport';
import characterApi from '../../services/characterApi';
import s from './CharacterAssessments.module.css';

/**
 * „Проценка на карактер" — owner cockpit. Create a named assessment, share/email the
 * link, and read the Big Five profile once the candidate answers. SMB (Basic) HR tool.
 */

const fmt = (d) => (d ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

export default function CharacterAssessments() {
  const { token } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ candidateName: '', role: '', inviteEmail: '', note: '' });
  const [openId, setOpenId] = useState(null);      // id of the report being viewed
  const [detail, setDetail] = useState(null);      // fetched full item (with report)
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(null);

  const load = () => {
    setLoading(true);
    characterApi.list(token)
      .then((d) => setItems(d.items || []))
      .catch(() => setToast({ type: 'err', text: 'Не може да се вчита листата.' }))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const notify = (type, text) => { setToast({ type, text }); setTimeout(() => setToast(null), 4000); };

  const submitCreate = async (e) => {
    e.preventDefault();
    if (!form.candidateName.trim()) { notify('err', 'Внесете име за проценката.'); return; }
    setCreating(true);
    try {
      const res = await characterApi.create(token, form);
      setItems((prev) => [res.item, ...prev]);
      setForm({ candidateName: '', role: '', inviteEmail: '', note: '' });
      notify('ok', res.emailed ? 'Проценката е креирана и поканата е испратена.' : 'Проценката е креирана. Копирајте го линкот подолу.');
    } catch (ex) {
      notify('err', ex.response?.data?.message || 'Грешка при креирање.');
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async (item) => {
    try {
      await navigator.clipboard.writeText(item.link);
      setCopied(item.id);
      setTimeout(() => setCopied(null), 2000);
    } catch (_) {
      notify('err', 'Копирањето не успеа — изберете го линкот рачно.');
    }
  };

  const resend = async (item) => {
    const email = item.inviteEmail || window.prompt('Е-пошта за испраќање на линкот:');
    if (!email) return;
    try {
      const r = await characterApi.resend(token, item.id, email);
      if (r.emailed) { notify('ok', `Поканата е испратена на ${email}.`); load(); }
      else notify('err', 'Испраќањето не успеа.');
    } catch (ex) {
      notify('err', ex.response?.data?.message || 'Испраќањето не успеа.');
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Да ја избришам проценката за „${item.candidateName}“?`)) return;
    try {
      await characterApi.remove(token, item.id);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      if (openId === item.id) { setOpenId(null); setDetail(null); }
      notify('ok', 'Избришано.');
    } catch (_) {
      notify('err', 'Бришењето не успеа.');
    }
  };

  const openReport = async (item) => {
    if (openId === item.id) { setOpenId(null); setDetail(null); return; }
    setOpenId(item.id); setDetail(null);
    try {
      const d = await characterApi.get(token, item.id);
      setDetail(d.item);
    } catch (_) {
      notify('err', 'Извештајот не може да се вчита.');
    }
  };

  const counts = useMemo(() => ({
    completed: items.filter((i) => i.status === 'completed').length,
    pending: items.filter((i) => i.status === 'pending').length,
  }), [items]);

  return (
    <TerminalShell>
      <div className={s.page}>
        <header className={s.header}>
          <span className={s.eyebrow}>HR алатки</span>
          <h1 className={s.title}>Проценка на карактер</h1>
          <p className={s.lead}>
            Испратете кратка проценка на личноста (модел „Големите пет“) до кандидат или
            вработен. Штом ќе одговори, добивате визуелен профил со објаснувања — за
            подобро да ги запознаете луѓето со кои работите.
          </p>
        </header>

        {toast && <div className={toast.type === 'ok' ? s.toastOk : s.toastErr}>{toast.text}</div>}

        {/* Create */}
        <form className={s.createCard} onSubmit={submitCreate}>
          <h2 className={s.cardTitle}>Нова проценка</h2>
          <div className={s.formGrid}>
            <label className={s.field}>
              <span className={s.fieldLabel}>Име (кандидат/вработен) *</span>
              <input className={s.input} value={form.candidateName} maxLength={120}
                     onChange={(e) => setForm({ ...form, candidateName: e.target.value })}
                     placeholder="пр. Марко Марковски" />
            </label>
            <label className={s.field}>
              <span className={s.fieldLabel}>Позиција (опционално)</span>
              <input className={s.input} value={form.role} maxLength={120}
                     onChange={(e) => setForm({ ...form, role: e.target.value })}
                     placeholder="пр. Комерцијалист" />
            </label>
            <label className={s.field}>
              <span className={s.fieldLabel}>Е-пошта за покана (опционално)</span>
              <input className={s.input} type="email" value={form.inviteEmail} maxLength={160}
                     onChange={(e) => setForm({ ...form, inviteEmail: e.target.value })}
                     placeholder="ако сакате да го испратиме линкот" />
            </label>
            <label className={s.field}>
              <span className={s.fieldLabel}>Приватна белешка (опционално)</span>
              <input className={s.input} value={form.note} maxLength={500}
                     onChange={(e) => setForm({ ...form, note: e.target.value })}
                     placeholder="само за вас" />
            </label>
          </div>
          <button type="submit" className={s.btnPrimary} disabled={creating}>
            {creating ? 'Се креира…' : 'Креирај и подготви линк'}
          </button>
        </form>

        {/* List */}
        <div className={s.listHead}>
          <h2 className={s.cardTitle}>Мои проценки</h2>
          {!loading && <span className={s.countPill}>{counts.completed} завршени · {counts.pending} во тек</span>}
        </div>

        {loading ? (
          <div className={s.empty}>Се вчитува…</div>
        ) : items.length === 0 ? (
          <div className={s.empty}>Сè уште немате проценки. Креирајте ја првата погоре.</div>
        ) : (
          <div className={s.list}>
            {items.map((item) => (
              <div key={item.id} className={s.row}>
                <div className={s.rowMain}>
                  <div className={s.rowTitleWrap}>
                    <span className={s.rowName}>{item.candidateName}</span>
                    {item.role ? <span className={s.rowRole}>· {item.role}</span> : null}
                  </div>
                  <div className={s.rowMeta}>
                    <span className={item.status === 'completed' ? s.stDone : s.stPending}>
                      {item.status === 'completed' ? 'Завршено' : 'Чека одговор'}
                    </span>
                    <span className={s.rowDate}>Креирано {fmt(item.createdAt)}</span>
                    {item.completedAt ? <span className={s.rowDate}>· Одговорено {fmt(item.completedAt)}</span> : null}
                  </div>
                </div>

                <div className={s.rowActions}>
                  {item.status === 'completed' ? (
                    <button type="button" className={s.btnAccent} onClick={() => openReport(item)}>
                      {openId === item.id ? 'Сокриј извештај' : 'Види извештај'}
                    </button>
                  ) : (
                    <>
                      <button type="button" className={s.btnGhost} onClick={() => copyLink(item)}>
                        {copied === item.id ? 'Копирано ✓' : 'Копирај линк'}
                      </button>
                      <button type="button" className={s.btnGhost} onClick={() => resend(item)}>
                        {item.inviteEmail ? 'Испрати повторно' : 'Испрати по е-пошта'}
                      </button>
                    </>
                  )}
                  <button type="button" className={s.btnDangerGhost} onClick={() => remove(item)} aria-label="Избриши">✕</button>
                </div>

                {openId === item.id && (
                  <div className={s.reportPanel}>
                    {detail?.report
                      ? <ProfileReport candidateName={detail.candidateName} role={detail.role}
                                       report={detail.report} disclaimer={detail.disclaimer}
                                       completedAt={detail.completedAt} />
                      : <div className={s.empty}>Се вчитува извештајот…</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </TerminalShell>
  );
}
