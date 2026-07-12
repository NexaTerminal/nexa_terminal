import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import styles from '../contracts/Contracts.module.css';

/** Нов вработен / измени вработен — clone of the contracts form conventions. */

const toInputDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date)) return '';
  return date.toISOString().slice(0, 10);
};

const EMPTY = {
  fullName: '',
  embg: '',
  position: '',
  address: '',
  employmentType: 'неопределено',
  contractEndsAt: '',
  probationEndsAt: '',
  hiredAt: '',
  salaryGross: '',
  annualLeaveDays: 21,
  notes: ''
};

export default function EmployeeForm() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // present → edit mode
  const editing = !!id;

  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [error, setError] = useState('');

  const authHeaders = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    if (!editing) return;
    axios.get(`/api/employees/${id}`, { headers: authHeaders() })
      .then((res) => {
        const e = res.data.data;
        setForm({
          fullName: e.fullName || '',
          embg: e.embg || '',
          position: e.position || '',
          address: e.address || '',
          employmentType: e.employmentType || 'неопределено',
          contractEndsAt: toInputDate(e.contractEndsAt),
          probationEndsAt: toInputDate(e.probationEndsAt),
          hiredAt: toInputDate(e.hiredAt),
          salaryGross: e.salaryGross ?? '',
          annualLeaveDays: e.annualLeaveDays ?? 21,
          notes: e.notes || ''
        });
      })
      .catch(() => setError('Вработениот не може да се вчита.'))
      .finally(() => setLoading(false));
  }, [editing, id, authHeaders]);

  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const buildPayload = () => ({
    fullName: form.fullName.trim(),
    embg: form.embg.trim(),
    position: form.position.trim(),
    address: form.address.trim(),
    employmentType: form.employmentType,
    contractEndsAt: form.employmentType === 'определено' ? (form.contractEndsAt || null) : null,
    probationEndsAt: form.probationEndsAt || null,
    hiredAt: form.hiredAt || null,
    salaryGross: form.salaryGross !== '' && !isNaN(Number(form.salaryGross)) ? Number(form.salaryGross) : null,
    annualLeaveDays: Number(form.annualLeaveDays) || 21,
    notes: form.notes
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) { setError('Внесете име и презиме.'); return; }
    if (!/^\d{13}$/.test(form.embg.trim())) { setError('ЕМБГ мора да содржи точно 13 цифри.'); return; }
    if (!form.position.trim()) { setError('Внесете работна позиција.'); return; }
    if (form.employmentType === 'определено' && !form.contractEndsAt) {
      setError('За вработување на определено време внесете датум на истек на договорот.');
      return;
    }
    setBusy(true); setError('');
    try {
      let employeeId = id;
      if (editing) {
        await axios.patch(`/api/employees/${id}`, buildPayload(), { headers: authHeaders() });
      } else {
        const res = await axios.post('/api/employees', buildPayload(), { headers: authHeaders() });
        employeeId = res.data.data._id;
      }
      navigate(`/terminal/employees/${employeeId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при зачувување.');
      setBusy(false);
    }
  };

  if (loading) {
    return <TerminalShell><div className={styles.page}><p>Се вчитува…</p></div></TerminalShell>;
  }

  return (
    <TerminalShell>
      <div className={styles.page}>
        <div className={styles.headRow}>
          <div>
            <h1 className={styles.title}>{editing ? 'Измени вработен' : 'Нов вработен'}</h1>
            <p className={styles.subtitle}>
              {editing
                ? 'Ажурирајте ги податоците — потсетниците и документите се прилагодуваат автоматски.'
                : 'Внесете го вработениот еднаш — потоа документите (решенија, договори, анекси) се пополнуваат автоматски.'}
            </p>
          </div>
          <Link to={editing ? `/terminal/employees/${id}` : '/terminal/employees'} className={styles.secondaryBtn}>
            ← Назад
          </Link>
        </div>

        <form onSubmit={onSubmit}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Лични податоци</h2>
            <div className={styles.formGrid}>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="e-name">Име и презиме *</label>
                <input id="e-name" className={styles.input} value={form.fullName} onChange={set('fullName')} placeholder="пр. Марија Петровска" />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="e-embg">ЕМБГ *</label>
                <input
                  id="e-embg" className={styles.input} value={form.embg} onChange={set('embg')}
                  maxLength={13} inputMode="numeric" placeholder="13 цифри"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="e-addr">Адреса</label>
                <input id="e-addr" className={styles.input} value={form.address} onChange={set('address')} />
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Вработување</h2>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="e-pos">Работна позиција *</label>
                <input id="e-pos" className={styles.input} value={form.position} onChange={set('position')} placeholder="пр. Комерцијалист" />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="e-type">Вид на вработување</label>
                <select id="e-type" className={styles.input} value={form.employmentType} onChange={set('employmentType')}>
                  <option value="неопределено">Неопределено време</option>
                  <option value="определено">Определено време</option>
                </select>
              </div>
              {form.employmentType === 'определено' && (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="e-cend">Договорот истекува на *</label>
                  <input id="e-cend" type="date" className={styles.input} value={form.contractEndsAt} onChange={set('contractEndsAt')} />
                  <span className={styles.hint}>Добивате потсетник 30 и 7 дена претходно.</span>
                </div>
              )}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="e-hired">Датум на вработување</label>
                <input id="e-hired" type="date" className={styles.input} value={form.hiredAt} onChange={set('hiredAt')} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="e-prob">Пробна работа до</label>
                <input id="e-prob" type="date" className={styles.input} value={form.probationEndsAt} onChange={set('probationEndsAt')} />
                <span className={styles.hint}>Опционално — потсетник 7 дена претходно.</span>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="e-salary">Бруто плата (МКД)</label>
                <input id="e-salary" type="number" min="0" className={styles.input} value={form.salaryGross} onChange={set('salaryGross')} placeholder="опционално" />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="e-leave">Годишен одмор (денови)</label>
                <input id="e-leave" type="number" min="0" max="60" className={styles.input} value={form.annualLeaveDays} onChange={set('annualLeaveDays')} />
                <span className={styles.hint}>Законски минимум 20; вообичаено 20–26.</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Белешки</h2>
            <div className={styles.formGrid}>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <textarea className={styles.textarea} value={form.notes} onChange={set('notes')} />
              </div>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryBtn} disabled={busy}>
              {busy ? 'Се зачувува…' : editing ? 'Зачувај измени' : 'Зачувај вработен'}
            </button>
          </div>
        </form>
      </div>
    </TerminalShell>
  );
}
