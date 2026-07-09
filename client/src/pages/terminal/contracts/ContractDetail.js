import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import { STATUS_LABEL, fmtDate } from './Contracts';
import styles from './Contracts.module.css';

/**
 * Детали за договор (cms-v1-plan.md M3): metadata, obligations (add/complete),
 * file download, status actions (раскини / обнови), delete.
 */

const OBLIGATION_TYPES = [
  { value: 'renewal', label: 'Обнова' },
  { value: 'payment', label: 'Плаќање' },
  { value: 'notice', label: 'Отказен рок' },
  { value: 'custom', label: 'Друго' }
];

export default function ContractDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [obForm, setObForm] = useState({ label: '', type: 'custom', dueAt: '' });

  const authHeaders = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`/api/contracts/${id}`, { headers: authHeaders() });
      setContract(res.data.data);
    } catch (err) {
      setError(err.response?.status === 404 ? 'Договорот не е пронајден.' : 'Грешка при вчитување.');
    } finally {
      setLoading(false);
    }
  }, [id, authHeaders]);

  useEffect(() => { load(); }, [load]);

  const patchStatus = async (status) => {
    setBusy(true);
    try {
      await axios.patch(`/api/contracts/${id}`, { status }, { headers: authHeaders() });
      await load();
    } catch (_) {
      setError('Грешка при промена на статусот.');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!window.confirm('Да се избрише овој договор од евиденцијата? Дејството е неповратно.')) return;
    setBusy(true);
    try {
      await axios.delete(`/api/contracts/${id}`, { headers: authHeaders() });
      navigate('/terminal/contracts');
    } catch (_) {
      setError('Грешка при бришење.');
      setBusy(false);
    }
  };

  const onDownload = async () => {
    try {
      const res = await axios.get(`/api/contracts/${id}/download`, {
        headers: authHeaders(), responseType: 'blob'
      });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = contract?.file?.fileName || 'contract';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (_) {
      setError('Грешка при преземање на датотеката.');
    }
  };

  const addObligation = async (e) => {
    e.preventDefault();
    if (!obForm.label.trim() || !obForm.dueAt) return;
    setBusy(true);
    try {
      await axios.post(`/api/contracts/${id}/obligations`, obForm, { headers: authHeaders() });
      setObForm({ label: '', type: 'custom', dueAt: '' });
      await load();
    } catch (_) {
      setError('Грешка при додавање на обврската.');
    } finally {
      setBusy(false);
    }
  };

  const completeObligation = async (oid) => {
    setBusy(true);
    try {
      await axios.patch(`/api/contracts/${id}/obligations/${oid}`, { status: 'done' }, { headers: authHeaders() });
      await load();
    } catch (_) {
      setError('Грешка при означување.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <TerminalShell><div className={styles.page}><p>Се вчитува…</p></div></TerminalShell>;
  }
  if (!contract) {
    return (
      <TerminalShell>
        <div className={styles.page}>
          <p className={styles.error}>{error || 'Договорот не е пронајден.'}</p>
          <Link to="/terminal/contracts" className={styles.secondaryBtn}>← Кон Договори</Link>
        </div>
      </TerminalShell>
    );
  }

  const c = contract;

  return (
    <TerminalShell>
      <div className={styles.page}>
        <div className={styles.headRow}>
          <div>
            <h1 className={styles.title}>{c.title}</h1>
            <p className={styles.subtitle}>
              <span className={`${styles.badge} ${styles[`badge_${c.status}`]}`}>{STATUS_LABEL[c.status] || c.status}</span>
              {c.counterparty?.name ? <>  ·  {c.counterparty.name}</> : null}
            </p>
          </div>
          <div className={styles.formActions}>
            <Link to={`/terminal/contracts/${id}/edit`} className={styles.secondaryBtn}>Измени</Link>
            {c.file?.fileId && (
              <button type="button" className={styles.secondaryBtn} onClick={onDownload}>Преземи датотека</button>
            )}
            <Link to="/terminal/contracts" className={styles.secondaryBtn}>← Назад</Link>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Податоци</h2>
          <div className={styles.metaGrid}>
            <div>
              <div className={styles.metaLabel}>Потпишан</div>
              <div className={styles.metaValue}>{fmtDate(c.dates?.signedAt)}</div>
            </div>
            <div>
              <div className={styles.metaLabel}>Важи од</div>
              <div className={styles.metaValue}>{fmtDate(c.dates?.effectiveAt)}</div>
            </div>
            <div>
              <div className={styles.metaLabel}>Истекува</div>
              <div className={styles.metaValue}>{fmtDate(c.dates?.expiresAt)}</div>
            </div>
            <div>
              <div className={styles.metaLabel}>Отказен рок</div>
              <div className={styles.metaValue}>{c.dates?.noticePeriodDays ? `${c.dates.noticePeriodDays} дена` : '—'}</div>
            </div>
            <div>
              <div className={styles.metaLabel}>Вредност</div>
              <div className={styles.metaValue}>{c.value ? `${c.value.amount.toLocaleString('mk-MK')} ${c.value.currency}` : '—'}</div>
            </div>
            <div>
              <div className={styles.metaLabel}>Извор</div>
              <div className={styles.metaValue}>
                {c.source === 'generated' ? 'Генериран во Nexa' : c.source === 'uploaded' ? 'Прикачен' : 'Рачен внес'}
              </div>
            </div>
          </div>
          {c.notes && (
            <>
              <div className={`${styles.metaLabel} ${styles.notesLabel}`}>Белешки</div>
              <div className={styles.metaValue}>{c.notes}</div>
            </>
          )}
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Обврски и потсетници</h2>
          {(c.obligations || []).length === 0 && (
            <p className={styles.hint}>Нема обврски. Додадете плаќање, обнова или отказен рок — потсетниците пристигнуваат на е-пошта.</p>
          )}
          {(c.obligations || []).map((o) => (
            <div key={o._id} className={`${styles.obligationRow} ${o.status === 'done' ? styles.obligationDone : ''}`}>
              <span className={styles.obligationLabel}>
                <strong>{o.label}</strong>
                {' '}<span className={styles.hint}>({OBLIGATION_TYPES.find((t) => t.value === o.type)?.label || o.type})</span>
              </span>
              <span className={styles.obligationDue}>{fmtDate(o.dueAt)}</span>
              {o.status === 'pending' && (
                <button type="button" className={styles.smallBtn} disabled={busy} onClick={() => completeObligation(o._id)}>
                  ✓ Заврши
                </button>
              )}
            </div>
          ))}

          <form onSubmit={addObligation} className={`${styles.formGrid} ${styles.obligationForm}`}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ob-label">Нова обврска</label>
              <input id="ob-label" className={styles.input} value={obForm.label}
                onChange={(e) => setObForm((s) => ({ ...s, label: e.target.value }))}
                placeholder="пр. Кирија за август" />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ob-type">Тип</label>
              <select id="ob-type" className={styles.select} value={obForm.type}
                onChange={(e) => setObForm((s) => ({ ...s, type: e.target.value }))}>
                {OBLIGATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ob-due">Рок</label>
              <input id="ob-due" type="date" className={styles.input} value={obForm.dueAt}
                onChange={(e) => setObForm((s) => ({ ...s, dueAt: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>&nbsp;</label>
              <button type="submit" className={styles.primaryBtn} disabled={busy || !obForm.label.trim() || !obForm.dueAt}>
                + Додади
              </button>
            </div>
          </form>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Дејства</h2>
          <div className={styles.formActions}>
            {['active', 'expiring', 'expired'].includes(c.status) && (
              <>
                <button type="button" className={styles.secondaryBtn} disabled={busy} onClick={() => patchStatus('renewed')}>
                  Означи како обновен
                </button>
                <button type="button" className={styles.secondaryBtn} disabled={busy} onClick={() => patchStatus('terminated')}>
                  Означи како раскинат
                </button>
              </>
            )}
            {['terminated', 'renewed'].includes(c.status) && (
              <button type="button" className={styles.secondaryBtn} disabled={busy} onClick={() => patchStatus('active')}>
                Врати во активен
              </button>
            )}
            <button type="button" className={styles.dangerBtn} disabled={busy} onClick={onDelete}>
              Избриши
            </button>
          </div>
        </div>
      </div>
    </TerminalShell>
  );
}
