import { useState, useEffect, useCallback } from 'react';
import TerminalShell from '../../components/terminal/TerminalShell';
import ApiService from '../../services/api';
import styles from './Clients.module.css';

const EMPTY = { companyName: '', companyAddress: '', companyTaxNumber: '', companyManager: '', role: '', note: '' };

/**
 * Клиентски профили — saved client company profiles for Pro (lawyer) users.
 * Reused when generating documents on behalf of a client (see ClientSelector /
 * BaseDocumentPage). Records are private to the owner.
 */
export default function ClientsPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | client object
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (q) => {
    setLoading(true); setError(null);
    try {
      const res = await ApiService.get(`/clients${q ? `?search=${encodeURIComponent(q)}` : ''}`);
      setItems(res.items || []);
    } catch (e) {
      setError(e.message || 'Грешка при вчитување.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(''); }, [load]);

  // Debounced search.
  useEffect(() => {
    const t = setTimeout(() => load(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const openNew = () => { setForm(EMPTY); setEditing('new'); };
  const openEdit = (c) => {
    setForm({
      companyName: c.companyName || '', companyAddress: c.companyAddress || '',
      companyTaxNumber: c.companyTaxNumber || '', companyManager: c.companyManager || '',
      role: c.role || '', note: c.note || ''
    });
    setEditing(c);
  };
  const close = () => { setEditing(null); setForm(EMPTY); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.companyName.trim()) { setError('Името на клиентот е задолжително.'); return; }
    setBusy(true); setError(null);
    try {
      if (editing === 'new') await ApiService.post('/clients', form);
      else await ApiService.put(`/clients/${editing._id}`, form);
      close();
      load(search.trim());
    } catch (e2) {
      setError(e2.message || 'Грешка при зачувување.');
    } finally { setBusy(false); }
  };

  const remove = async (c) => {
    if (!window.confirm(`Избриши го клиентот „${c.companyName}“?`)) return;
    try {
      await ApiService.delete(`/clients/${c._id}`);
      load(search.trim());
    } catch (e) { setError(e.message || 'Грешка при бришење.'); }
  };

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Документи · Про</span>
          <h1 className={styles.title}>Клиентски профили</h1>
          <p className={styles.lead}>
            Зачувајте ги податоците на вашите клиенти еднаш и користете ги при
            генерирање документи — документот се изготвува во име на избраниот клиент.
          </p>
        </header>

        <div className={styles.toolbar}>
          <input
            className={styles.search}
            placeholder="Пребарај по име или даночен број…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className={styles.btnPrimary} onClick={openNew}>+ Нов клиент</button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <div className={styles.list} aria-hidden>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`${styles.card} ${styles.skeletonCard}`}>
                <div className={styles.cardMain}>
                  <div className={`${styles.sk} ${styles.skName}`} />
                  <div className={`${styles.sk} ${styles.skMeta}`} />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            {search ? 'Нема резултати за пребарувањето.' : 'Сè уште немате зачувани клиенти. Додадете го првиот.'}
          </div>
        ) : (
          <div className={styles.list}>
            {items.map(c => (
              <div key={c._id} className={styles.card}>
                <div className={styles.cardMain}>
                  <div className={styles.cardName}>{c.companyName}</div>
                  <div className={styles.cardMeta}>
                    {c.companyTaxNumber && <span>ЕДБ: {c.companyTaxNumber}</span>}
                    {c.companyAddress && <span>{c.companyAddress}</span>}
                    {c.companyManager && <span>Управител: {c.companyManager}</span>}
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <button type="button" className={styles.btnGhost} onClick={() => openEdit(c)}>Уреди</button>
                  <button type="button" className={styles.btnGhostDanger} onClick={() => remove(c)}>Избриши</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <div className={styles.backdrop} onClick={close}>
            <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={save}>
              <button type="button" className={styles.close} aria-label="Затвори" onClick={close}>×</button>
              <h2 className={styles.modalTitle}>{editing === 'new' ? 'Нов клиент' : 'Уреди клиент'}</h2>

              <label className={styles.label}>Име на фирма (клиент) *</label>
              <input className={styles.input} value={form.companyName} onChange={(e) => set('companyName', e.target.value)} required />

              <label className={styles.label}>Адреса</label>
              <input className={styles.input} value={form.companyAddress} onChange={(e) => set('companyAddress', e.target.value)} />

              <div className={styles.row}>
                <div className={styles.col}>
                  <label className={styles.label}>Даночен број (ЕДБ)</label>
                  <input className={styles.input} value={form.companyTaxNumber} onChange={(e) => set('companyTaxNumber', e.target.value)} />
                </div>
                <div className={styles.col}>
                  <label className={styles.label}>Управител / застапник</label>
                  <input className={styles.input} value={form.companyManager} onChange={(e) => set('companyManager', e.target.value)} />
                </div>
              </div>

              <label className={styles.label}>Функција (опционо)</label>
              <input className={styles.input} value={form.role} onChange={(e) => set('role', e.target.value)} placeholder="на пр. управител" />

              <label className={styles.label}>Белешка (опционо)</label>
              <textarea className={styles.ta} rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} />

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={close}>Откажи</button>
                <button type="submit" className={styles.btnPrimary} disabled={busy}>
                  {busy ? 'Се зачувува…' : 'Зачувај'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </TerminalShell>
  );
}
