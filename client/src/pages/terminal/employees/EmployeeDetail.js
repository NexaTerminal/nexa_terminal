import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from '../contracts/Contracts.module.css';
import { STATUS_LABEL, fmtDate } from './Employees';

/**
 * Профил на вработен: податоци, годишен одмор (баланс + записи + запишување),
 * потсетници и брз пат до „Решение за годишен одмор" со автоматско пополнување.
 */

const DAY_MS = 86400000;
const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const inclusiveDays = (from, to) => {
  const f = new Date(from); const t = new Date(to);
  if (isNaN(f) || isNaN(t) || f > t) return '';
  return Math.round((t - f) / DAY_MS) + 1;
};

const EMPTY_LEAVE = { from: '', to: '', days: '', note: '' };
const EMPTY_RECORD = { date: '', text: '', amount: '' };

/* Optional HR record tabs — one generic dated-record shape per kind.
   Visible as empty tabs; filled only if the user decides to track them. */
const RECORD_TABS = [
  { kind: 'salaryHistory', label: 'Плата', textLabel: 'Промена / основ', amount: true,
    empty: 'Нема записи за плата. Запишете промена на плата, бонус или регрес — историјата останува тука.' },
  { kind: 'requests', label: 'Барања', textLabel: 'Барање', amount: false,
    empty: 'Нема барања. Запишете барање од вработениот (слободни денови, потврди, опрема…).' },
  { kind: 'sanctions', label: 'Санкции', textLabel: 'Мерка / причина', amount: false,
    empty: 'Нема санкции. Запишете дисциплинска мерка или опомена — со датум, за евиденција.' },
  { kind: 'education', label: 'Едукација', textLabel: 'Обука / сертификат', amount: false,
    empty: 'Нема записи за едукација. Запишете обуки, курсеви и сертификати на вработениот.' }
];

export default function EmployeeDetail() {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [emp, setEmp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [leave, setLeave] = useState(EMPTY_LEAVE);
  const [tab, setTab] = useState('overview');
  const [record, setRecord] = useState(EMPTY_RECORD);

  const authHeaders = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`/api/employees/${id}`, { headers: authHeaders() });
      setEmp(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Вработениот не може да се вчита.');
    } finally {
      setLoading(false);
    }
  }, [id, authHeaders]);

  useEffect(() => { load(); }, [load]);

  const setLeaveField = (k) => (e) => {
    setLeave((s) => {
      const next = { ...s, [k]: e.target.value };
      // Auto-compute inclusive calendar days when both dates are set; stays editable.
      if ((k === 'from' || k === 'to') && next.from && next.to) {
        next.days = inclusiveDays(next.from, next.to);
      }
      return next;
    });
  };

  const addLeave = async (e) => {
    e.preventDefault();
    if (!leave.from || !leave.to || !leave.days) { setError('Внесете датуми и број на денови.'); return; }
    setBusy(true); setError('');
    try {
      await axios.post(`/api/employees/${id}/leave`, {
        year: new Date(leave.from).getFullYear(),
        from: leave.from,
        to: leave.to,
        days: Number(leave.days),
        note: leave.note
      }, { headers: authHeaders() });
      setLeave(EMPTY_LEAVE);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при запишување на одморот.');
    } finally {
      setBusy(false);
    }
  };

  const deleteLeave = async (lid) => {
    if (!window.confirm('Да се избрише овој запис за одмор? Балансот се враќа.')) return;
    setBusy(true); setError('');
    try {
      await axios.delete(`/api/employees/${id}/leave/${lid}`, { headers: authHeaders() });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при бришење.');
    } finally {
      setBusy(false);
    }
  };

  const addRecord = async (kind) => {
    if (!record.date || !record.text.trim()) { setError('Внесете датум и опис.'); return; }
    setBusy(true); setError('');
    try {
      await axios.post(`/api/employees/${id}/records/${kind}`, {
        date: record.date,
        text: record.text.trim(),
        amount: record.amount !== '' ? Number(record.amount) : null
      }, { headers: authHeaders() });
      setRecord(EMPTY_RECORD);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при запишување.');
    } finally {
      setBusy(false);
    }
  };

  const deleteRecord = async (kind, rid) => {
    if (!window.confirm('Да се избрише овој запис?')) return;
    setBusy(true); setError('');
    try {
      await axios.delete(`/api/employees/${id}/records/${kind}/${rid}`, { headers: authHeaders() });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при бришење.');
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (status) => {
    const msg = status === 'terminated'
      ? `Да се прекине вработувањето на ${emp.fullName}? Потсетниците за него запираат.`
      : `Да се врати ${emp.fullName} како активен вработен?`;
    if (!window.confirm(msg)) return;
    setBusy(true); setError('');
    try {
      await axios.patch(`/api/employees/${id}`, { status }, { headers: authHeaders() });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при ажурирање.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Трајно да се избрише ${emp.fullName} од регистарот, заедно со записите за одмор?`)) return;
    setBusy(true);
    try {
      await axios.delete(`/api/employees/${id}`, { headers: authHeaders() });
      navigate('/terminal/employees');
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при бришење.');
      setBusy(false);
    }
  };

  if (loading) return <TerminalShell><div className={styles.page}><p>Се вчитува…</p></div></TerminalShell>;
  if (!emp) return <TerminalShell><div className={styles.page}><p className={styles.error}>{error || 'Не е пронајден.'}</p></div></TerminalShell>;

  const allowance = emp.annualLeaveDays || 0;
  const yearRecords = (emp.leaveRecords || []).filter((r) => r.year === year);
  const used = yearRecords.reduce((s, r) => s + (r.days || 0), 0);
  const balance = allowance - used;
  const yearOptions = [year - 1, year, year + 1]
    .concat(new Date().getFullYear())
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();

  const upcoming = [];
  if (emp.status === 'active') {
    if (emp.employmentType === 'определено' && emp.contractEndsAt) {
      upcoming.push({ label: 'Истек на договорот', date: emp.contractEndsAt });
    }
    if (emp.probationEndsAt && new Date(emp.probationEndsAt) > new Date()) {
      upcoming.push({ label: 'Крај на пробна работа', date: emp.probationEndsAt });
    }
  }

  return (
    <TerminalShell>
      <div className={styles.page}>
        <div className={styles.headRow}>
          <div>
            <h1 className={styles.title}>
              {emp.fullName}{' '}
              <span className={`${styles.badge} ${emp.status === 'active' ? styles.badge_active : styles.badge_terminated}`}>
                {STATUS_LABEL[emp.status]}
              </span>
            </h1>
            <p className={styles.subtitle}>{emp.position} · {emp.employmentType} време</p>
          </div>
          <div className={styles.formActions}>
            <Link to="/terminal/employees" className={styles.secondaryBtn}>← Назад</Link>
            <Link to={`/terminal/employees/${id}/edit`} className={styles.secondaryBtn}>Измени</Link>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.filters}>
          <div className={styles.statusChips}>
            {[{ kind: 'overview', label: 'Преглед' }, { kind: 'leave', label: 'Одмор' }, ...RECORD_TABS].map((t) => (
              <button
                key={t.kind}
                type="button"
                className={`${styles.chip} ${tab === t.kind ? styles.chipActive : ''}`}
                onClick={() => { setTab(t.kind); setRecord(EMPTY_RECORD); setError(''); }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'overview' && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Податоци</h2>
          <div className={styles.formGrid}>
            <div className={styles.field}><span className={styles.label}>ЕМБГ</span>{emp.embg}</div>
            <div className={styles.field}><span className={styles.label}>Адреса</span>{emp.address || '—'}</div>
            <div className={styles.field}><span className={styles.label}>Вработен од</span>{fmtDate(emp.hiredAt)}</div>
            {emp.employmentType === 'определено' && (
              <div className={styles.field}><span className={styles.label}>Договор до</span>{fmtDate(emp.contractEndsAt)}</div>
            )}
            {emp.probationEndsAt && (
              <div className={styles.field}><span className={styles.label}>Пробна работа до</span>{fmtDate(emp.probationEndsAt)}</div>
            )}
            {emp.salaryGross != null && (
              <div className={styles.field}><span className={styles.label}>Бруто плата</span>{emp.salaryGross.toLocaleString('mk-MK')} МКД</div>
            )}
            {emp.status === 'terminated' && (
              <div className={styles.field}><span className={styles.label}>Прекинато на</span>{fmtDate(emp.terminatedAt)}</div>
            )}
            {emp.notes && (
              <div className={`${styles.field} ${styles.fieldFull}`}><span className={styles.label}>Белешки</span>{emp.notes}</div>
            )}
          </div>
        </div>
        )}

        {tab === 'leave' && (
        <div className={styles.card}>
          <div className={styles.headRow}>
            <h2 className={styles.cardTitle}>Годишен одмор</h2>
            <select className={styles.input} value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ maxWidth: 120 }}>
              {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <p className={balance < 0 ? styles.error : styles.subtitle}>
            Искористено <strong>{used}</strong> од <strong>{allowance}</strong> дена за {year} ·
            преостанато <strong>{balance}</strong> {balance < 0 ? '(надминато!)' : ''}
          </p>

          {yearRecords.length > 0 && (
            <table className={styles.table}>
              <thead>
                <tr><th>Од</th><th>До</th><th>Денови</th><th>Забелешка</th><th /></tr>
              </thead>
              <tbody>
                {yearRecords.map((r) => (
                  <tr key={r._id}>
                    <td>{fmtDate(r.from)}</td>
                    <td>{fmtDate(r.to)}</td>
                    <td>{r.days}</td>
                    <td>{r.note || '—'}</td>
                    <td>
                      <button type="button" className={styles.secondaryBtn} disabled={busy} onClick={() => deleteLeave(r._id)}>
                        Избриши
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {emp.status === 'active' && (
            <form onSubmit={addLeave}>
              <div className={styles.formGrid} style={{ marginTop: 14 }}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="l-from">Од</label>
                  <input id="l-from" type="date" className={styles.input} value={leave.from} onChange={setLeaveField('from')} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="l-to">До</label>
                  <input id="l-to" type="date" className={styles.input} value={leave.to} onChange={setLeaveField('to')} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="l-days">Работни денови</label>
                  <input id="l-days" type="number" min="1" className={styles.input} value={leave.days} onChange={setLeaveField('days')} />
                  <span className={styles.hint}>Предлогот е календарски — прилагодете за викенди и празници.</span>
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="l-note">Забелешка</label>
                  <input id="l-note" className={styles.input} value={leave.note} onChange={setLeaveField('note')} />
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.secondaryBtn} disabled={busy}>Запиши одмор</button>
                <Link
                  to={`/terminal/documents/employment/annual-leave-decision?employeeId=${id}`}
                  className={styles.primaryBtn}
                >
                  Генерирај решение за одмор →
                </Link>
              </div>
            </form>
          )}
        </div>
        )}

        {RECORD_TABS.filter((t) => t.kind === tab).map((t) => {
          const records = [...(emp[t.kind] || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
          return (
            <div key={t.kind} className={styles.card}>
              <h2 className={styles.cardTitle}>{t.label}</h2>
              {records.length === 0 ? (
                <p className={styles.subtitle}>{t.empty}</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr><th>Датум</th><th>{t.textLabel}</th>{t.amount && <th>Износ (МКД)</th>}<th /></tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r._id}>
                        <td>{fmtDate(r.date)}</td>
                        <td>{r.text}</td>
                        {t.amount && <td>{r.amount != null ? r.amount.toLocaleString('mk-MK') : '—'}</td>}
                        <td>
                          <button type="button" className={styles.secondaryBtn} disabled={busy} onClick={() => deleteRecord(t.kind, r._id)}>
                            Избриши
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <form onSubmit={(e) => { e.preventDefault(); addRecord(t.kind); }}>
                <div className={styles.formGrid} style={{ marginTop: 14 }}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="r-date">Датум</label>
                    <input id="r-date" type="date" className={styles.input} value={record.date}
                      onChange={(e) => setRecord((s) => ({ ...s, date: e.target.value }))} />
                  </div>
                  <div className={`${styles.field} ${t.amount ? '' : styles.fieldFull}`}>
                    <label className={styles.label} htmlFor="r-text">{t.textLabel}</label>
                    <input id="r-text" className={styles.input} value={record.text} maxLength={300}
                      onChange={(e) => setRecord((s) => ({ ...s, text: e.target.value }))} />
                  </div>
                  {t.amount && (
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="r-amount">Износ (МКД)</label>
                      <input id="r-amount" type="number" min="0" className={styles.input} value={record.amount}
                        onChange={(e) => setRecord((s) => ({ ...s, amount: e.target.value }))} placeholder="опционално" />
                    </div>
                  )}
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.secondaryBtn} disabled={busy}>Запиши</button>
                </div>
              </form>
            </div>
          );
        })}

        {tab === 'overview' && upcoming.length > 0 && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Потсетници</h2>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {upcoming.map((u) => (
                <li key={u.label} className={styles.subtitle} style={{ marginBottom: 4 }}>
                  {u.label}: <strong>{fmtDate(u.date)}</strong>
                </li>
              ))}
            </ul>
            <p className={styles.hint}>
              Автоматски потсетник по email: 30 и 7 дена пред истек на договор; 7 дена пред крај на пробна работа.
              {(emp.remindersSent || []).length > 0 &&
                ` Испратени: ${emp.remindersSent.filter((s) => s.fired).map((s) => s.type).join(', ') || '—'}.`}
            </p>
          </div>
        )}

        {tab === 'overview' && (
        <div className={styles.formActions}>
          {emp.status === 'active'
            ? <button type="button" className={styles.secondaryBtn} disabled={busy} onClick={() => setStatus('terminated')}>Прекини вработување</button>
            : <button type="button" className={styles.secondaryBtn} disabled={busy} onClick={() => setStatus('active')}>Врати како активен</button>}
          <button type="button" className={styles.dangerBtn} disabled={busy} onClick={remove}>Избриши од регистарот</button>
        </div>
        )}
      </div>
    </TerminalShell>
  );
}
