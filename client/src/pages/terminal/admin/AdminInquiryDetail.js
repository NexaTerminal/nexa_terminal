import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from '../Inquiries.module.css';

const STATUS_LABEL = {
  open: 'Отворено', interest_received: 'Има интерес',
  partially_claimed: 'Делумно зафатено', claimed: 'Зафатено', closed: 'Затворено'
};
const SIGNAL_LABEL = {
  pending: 'Чека одлука', approved: 'Одобрено', acknowledged: 'Не избран'
};
const CATEGORY_LABEL = {
  legal: 'Правен', accounting: 'Сметководство', tax: 'Даноци', insurance: 'Осигурување',
  real_estate: 'Недвижности', hr: 'HR', marketing: 'Маркетинг', translation: 'Превод', other: 'Друго'
};
const PROFESSION_LABEL = {
  lawyer: 'Адвокат', accountant: 'Сметководител', tax_advisor: 'Даночен советник',
  insurance_broker: 'Осигурителен брокер', real_estate: 'Недвижности',
  hr_consultant: 'HR консултант', marketing: 'Маркетинг', translator: 'Преведувач', other: 'Друго'
};

const fmt = (d) => d ? new Date(d).toLocaleString('mk-MK', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const suggestedEmail = (inquiry, member) => {
  const en = inquiry.language === 'en';
  if (en) {
    return {
      subject: `Re: ${inquiry.topic}`,
      body: [
        `Hello ${inquiry.inquirerName || ''},`,
        ``,
        `Following your inquiry on ${inquiry.source}, I would like to introduce ${member?.fullName || member?.username || ''} (CC'd).`,
        ``,
        `${member?.fullName || ''} has the relevant expertise and can take it from here. Please reply to both of us to coordinate next steps.`,
        ``,
        `Best regards,`,
        `Martin Boshkoski`,
        `Nexa`
      ].join('\n')
    };
  }
  return {
    subject: `Re: ${inquiry.topic}`,
    body: [
      `Здраво ${inquiry.inquirerName || ''},`,
      ``,
      `Во врска со Вашето барање преку ${inquiry.source}, Ве запознавам со ${member?.fullName || member?.username || ''} (во CC).`,
      ``,
      `${member?.fullName || ''} ги има потребните искуства и од тука понатаму ќе биде на располагање. Ве молам одговорете на двајцата за договарање на следните чекори.`,
      ``,
      `Со почит,`,
      `Мартин Бошкоски`,
      `Nexa`
    ].join('\n')
  };
};

export default function AdminInquiryDetailPage() {
  const { token } = useAuth();
  const { id } = useParams();
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const [inquiry, setInquiry] = useState(null);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [readyTo, setReadyTo] = useState(null); // { approval, member }

  const refresh = () => {
    setLoading(true);
    axios.get(`/api/admin/inquiries/${id}`, auth)
      .then(res => { setInquiry(res.data?.inquiry); setSignals(res.data?.signals || []); })
      .catch(e => setToast({ type: 'error', text: e.response?.data?.message || e.message }))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const approve = async (signal, operatorNotes = '') => {
    setBusy(true); setToast(null);
    try {
      const res = await axios.post(`/api/admin/inquiries/${id}/approve`,
                                   { signalId: signal._id, operatorNotes },
                                   auth);
      const member = signal.member;
      setReadyTo({ approval: res.data?.approval, member });
      setToast({ type: 'ok', text: 'Одобрен. Прегледајте го прозорот „Подготвено за претставување" десно.' });
      refresh();
    } catch (e) {
      setToast({ type: 'error', text: e.response?.data?.message || e.message });
    } finally { setBusy(false); }
  };

  const markIntroduced = async (approvalId) => {
    setBusy(true);
    try {
      await axios.post(`/api/admin/inquiries/${id}/mark-introduced`, { approvalId }, auth);
      setToast({ type: 'ok', text: 'Запишано. Останатите интереси се означени како „не избрани"; известувања пратени.' });
      setReadyTo(null);
      refresh();
    } catch (e) {
      setToast({ type: 'error', text: e.response?.data?.message || e.message });
    } finally { setBusy(false); }
  };

  const closeInquiry = async () => {
    if (!window.confirm('Затвори го барањето? Нема да биде видливо на табла.')) return;
    setBusy(true);
    try {
      await axios.post(`/api/admin/inquiries/${id}/close`, {}, auth);
      refresh();
    } catch (e) { setToast({ type: 'error', text: e.response?.data?.message || e.message }); }
    finally { setBusy(false); }
  };

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text || ''); setToast({ type: 'ok', text: 'Копирано.' }); }
    catch { setToast({ type: 'error', text: 'Копирањето не успеа.' }); }
  };

  if (loading) {
    return <TerminalShell><div className={styles.spinner}>Се вчитува…</div></TerminalShell>;
  }
  if (!inquiry) {
    return <TerminalShell><div className={styles.emptyState}>Не е најдено.</div></TerminalShell>;
  }

  const tmpl = readyTo ? suggestedEmail(inquiry, readyTo.member) : null;

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Admin · Барање</span>
          <h1 className={styles.title}>{inquiry.topic}</h1>
          <p className={styles.lead}>
            Извор: {inquiry.source} · Поднесено: {fmt(inquiry.postedAt)}
            {inquiry.urgency === 'urgent' && ' · ИТНО'}
          </p>
        </header>

        <Link to="/terminal/admin/inquiries" className={styles.btnSecondary} style={{ marginBottom: 14, display: 'inline-block', textDecoration: 'none' }}>
          ← Назад на листата
        </Link>

        {toast && <div className={toast.type === 'ok' ? styles.toastOk : styles.toastError}>{toast.text}</div>}

        <div className={styles.detail}>
          {/* ── left column ───────────────────────────────────────────── */}
          <div className={styles.col}>
            <div className={styles.panel}>
              <div className={styles.panelHead}>Анонимизирано резиме (видно на табла)</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.6, color: '#1e293b' }}>{inquiry.summary}</div>
              <div className={styles.chipsRow}>
                {(inquiry.categories || []).map(c => (
                  <span key={c} className={styles.chip}>{CATEGORY_LABEL[c] || c}</span>
                ))}
              </div>
              <div className={styles.cardMeta}>
                <span>Град: {inquiry.city}</span>
                <span>Јазик: {inquiry.language?.toUpperCase()}</span>
                <span className={`${styles.statusPill} ${styles['s_' + inquiry.status]}`}>{STATUS_LABEL[inquiry.status]}</span>
              </div>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHead}>Контакт на клиентот (приватно)</div>
              <div className={styles.kv}>
                <div className={styles.kvK}>Име</div><div className={styles.kvV}>{inquiry.inquirerName}</div>
                <button className={styles.copyBtn} onClick={() => copy(inquiry.inquirerName)}>Копирај</button>
                <div className={styles.kvK}>Е-пошта</div><div className={styles.kvV}>{inquiry.inquirerEmail}</div>
                <button className={styles.copyBtn} onClick={() => copy(inquiry.inquirerEmail)}>Копирај</button>
                <div className={styles.kvK}>Телефон</div><div className={styles.kvV}>{inquiry.inquirerPhone}</div>
                <button className={styles.copyBtn} onClick={() => copy(inquiry.inquirerPhone)}>Копирај</button>
              </div>
            </div>

            {inquiry.internalNotes && (
              <div className={styles.panel}>
                <div className={styles.panelHead}>Внатрешни белешки</div>
                <div style={{ fontSize: 13, color: '#475569', whiteSpace: 'pre-wrap' }}>{inquiry.internalNotes}</div>
              </div>
            )}

            <div className={styles.panel}>
              <div className={styles.panelHead}>Изразени интереси ({signals.length})</div>
              {signals.length === 0 ? (
                <div style={{ fontSize: 13, color: '#94a3b8' }}>Сè уште нема интереси.</div>
              ) : signals.map(s => (
                <div key={s._id} className={styles.signalCard}>
                  <div className={styles.signalHead}>
                    <span className={styles.signalName}>{s.member?.fullName || s.member?.username || 'Без име'}</span>
                    <span className={styles.signalProfession}>{PROFESSION_LABEL[s.profession] || s.profession}</span>
                    <span style={{ flex: 1 }} />
                    <span className={`${styles.signalStatus} ${styles['sig' + s.status.charAt(0).toUpperCase() + s.status.slice(1)]}`}>
                      {SIGNAL_LABEL[s.status]}
                    </span>
                  </div>
                  <div className={styles.signalHelp}>{s.helpDescription}</div>
                  <div className={styles.signalMeta}>
                    Бесплатна почетна: {s.freeTalkOffered ? 'Да' : 'Не'} ·
                    Е-пошта: {s.member?.email || '—'} ·
                    Поднесено: {fmt(s.createdAt)}
                  </div>
                  {s.status === 'pending' && (
                    <div className={styles.actionRow} style={{ borderTop: 'none', padding: 0 }}>
                      <button type="button" className={styles.btnAccent}
                              disabled={busy} onClick={() => approve(s)}>
                        Одобри овој член
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {inquiry.status !== 'closed' && (
              <button type="button" className={styles.btnGhost} onClick={closeInquiry} disabled={busy}>
                Затвори го барањето
              </button>
            )}
          </div>

          {/* ── right column: Ready to introduce ──────────────────────── */}
          <div className={styles.col}>
            {readyTo && tmpl ? (
              <div className={styles.panel} style={{ borderColor: '#15803D', background: '#F0FDF4' }}>
                <div className={styles.panelHead} style={{ color: '#15803D' }}>Подготвено за претставување</div>
                <div className={styles.kv}>
                  <div className={styles.kvK}>До</div>
                  <div className={styles.kvV}>{inquiry.inquirerName} &lt;{inquiry.inquirerEmail}&gt;</div>
                  <button className={styles.copyBtn} onClick={() => copy(`${inquiry.inquirerName} <${inquiry.inquirerEmail}>`)}>Копирај</button>

                  <div className={styles.kvK}>CC</div>
                  <div className={styles.kvV}>{readyTo.member?.fullName || readyTo.member?.username} &lt;{readyTo.member?.email}&gt;</div>
                  <button className={styles.copyBtn} onClick={() => copy(`${readyTo.member?.fullName || readyTo.member?.username} <${readyTo.member?.email}>`)}>Копирај</button>

                  <div className={styles.kvK}>Тема</div>
                  <div className={styles.kvV}>{tmpl.subject}</div>
                  <button className={styles.copyBtn} onClick={() => copy(tmpl.subject)}>Копирај</button>
                </div>

                <div>
                  <div className={styles.label} style={{ marginBottom: 6 }}>Предложен текст</div>
                  <div className={styles.suggestedEmail}>{tmpl.body}</div>
                  <button className={styles.copyBtn} style={{ marginTop: 8 }} onClick={() => copy(tmpl.body)}>Копирај текст</button>
                </div>

                <div className={styles.actionRow} style={{ borderTop: 'none', padding: 0 }}>
                  <button type="button" className={styles.btnPrimary} disabled={busy}
                          onClick={() => markIntroduced(readyTo.approval._id)}>
                    Означи како воведено
                  </button>
                  <button type="button" className={styles.btnSecondary} onClick={() => setReadyTo(null)}>Затвори</button>
                </div>
                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.4 }}>
                  По копирање и испраќање од Вашата е-пошта, кликнете „Означи
                  како воведено" — другите чекачки интереси ќе бидат
                  автоматски означени како „не избрани".
                </div>
              </div>
            ) : (
              <div className={styles.panel}>
                <div className={styles.panelHead}>Одобрени членови</div>
                {(inquiry.approvals || []).length === 0 ? (
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>Нема одобрени членови.</div>
                ) : inquiry.approvals.map(a => (
                  <div key={a._id} className={styles.signalCard} style={{ borderColor: a.introducedAt ? '#15803D' : '#e5e7eb' }}>
                    <div className={styles.signalHead}>
                      <span className={styles.signalName}>{CATEGORY_LABEL[a.category] || a.category}</span>
                      <span style={{ flex: 1 }} />
                      {a.introducedAt
                        ? <span className={`${styles.signalStatus} ${styles.sigApproved}`}>Воведен/а</span>
                        : <span className={`${styles.signalStatus} ${styles.sigPending}`}>Чека претставување</span>}
                    </div>
                    <div className={styles.signalMeta}>Одобрено: {fmt(a.approvedAt)}</div>
                    {a.operatorNotes && <div className={styles.signalHelp}>Белешки: {a.operatorNotes}</div>}
                    {!a.introducedAt && (
                      <button type="button" className={styles.btnPrimary} style={{ marginTop: 4 }}
                              onClick={() => {
                                const sig = signals.find(s => String(s.memberId) === String(a.memberId));
                                setReadyTo({ approval: a, member: sig?.member });
                              }}>
                        Прикажи подготвено за претставување
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </TerminalShell>
  );
}
