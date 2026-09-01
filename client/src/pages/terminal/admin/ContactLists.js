import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import TerminalShell from '../../../components/terminal/TerminalShell';
import MACEDONIAN_CITIES from '../../../data/macedonianCities';
import styles from './ContactLists.module.css';

const TYPE_LABEL = { basic: 'Basic', pro: 'Pro' };
const STATUS_LABEL = { pending: 'Чека', sent: 'Испратено', failed: 'Неуспешно', unsubscribed: 'Исклучен' };

/**
 * Admin: contact lists (audiences) + the daily drip sender.
 * Buckets basic/pro drip 40+40/day (configurable) at 08:30 Europe/Skopje.
 */
export default function ContactLists() {
  const { token } = useAuth();
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const api = '/api/admin/outreach';

  const [lists, setLists] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [codes, setCodes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [drip, setDrip] = useState(null);      // { enabled, basic, pro }
  const [stats, setStats] = useState({ basic: {}, pro: {} });
  const [flash, setFlash] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState(null); // null = not searching; [] = no hits
  const [searchNonce, setSearchNonce] = useState(0); // bump to re-run the active search

  const notify = (m) => { setFlash(m); setError(''); setTimeout(() => setFlash(''), 4000); };
  const fail = (m) => { setError(m); setTimeout(() => setError(''), 6000); };

  // ── Loaders ────────────────────────────────────────────────────────────
  const loadLists = useCallback(async () => {
    try {
      const res = await axios.get(`${api}/lists`, auth);
      setLists(res.data.lists || []);
    } catch (e) { fail(e.response?.data?.message || e.message); }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDrip = useCallback(async () => {
    try {
      const res = await axios.get(`${api}/drip`, auth);
      setDrip(res.data.settings);
      setStats(res.data.stats || { basic: {}, pro: {} });
    } catch (e) { fail(e.response?.data?.message || e.message); }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAux = useCallback(async () => {
    try {
      const [c, t] = await Promise.all([
        axios.get('/api/admin/subscriptions/codes', auth),
        axios.get('/api/admin/subscriptions/invite-templates', auth),
      ]);
      setCodes(c.data.items || []);
      setTemplates(t.data.items || []);
    } catch (e) { /* non-fatal */ }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadContacts = useCallback(async (listId) => {
    if (!listId) { setContacts([]); return; }
    try {
      const res = await axios.get(`${api}/lists/${listId}/contacts`, auth);
      setContacts(res.data.contacts || []);
    } catch (e) { fail(e.response?.data?.message || e.message); }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadLists(); loadDrip(); loadAux(); }, [loadLists, loadDrip, loadAux]);
  useEffect(() => { loadContacts(selectedId); }, [selectedId, loadContacts]);

  // Global contact search (across all lists), debounced. Clears to the normal
  // per-list view when the box is emptied.
  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) { setResults(null); return; }
    const t = setTimeout(async () => {
      try {
        const res = await axios.get(`${api}/search`, { ...auth, params: { q } });
        setResults(res.data.contacts || []);
      } catch (e) { fail(e.response?.data?.message || e.message); }
    }, 300);
    return () => clearTimeout(t);
  }, [search, searchNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = lists.find((l) => l._id === selectedId);

  // ── List actions ──────────────────────────────────────────────────────
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('basic');
  const createList = async () => {
    if (!newName.trim()) return;
    try {
      await axios.post(`${api}/lists`, { name: newName.trim(), type: newType }, auth);
      setNewName('');
      notify('Листата е креирана.');
      loadLists(); loadDrip();
    } catch (e) { fail(e.response?.data?.message || e.message); }
  };
  const deleteList = async (id) => {
    if (!window.confirm('Да се избрише листата и сите нејзини контакти?')) return;
    try {
      await axios.delete(`${api}/lists/${id}`, auth);
      if (selectedId === id) setSelectedId(null);
      notify('Листата е избришана.');
      loadLists(); loadDrip();
    } catch (e) { fail(e.response?.data?.message || e.message); }
  };

  // Inline rename of a list.
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const startRename = (l) => { setEditingId(l._id); setEditName(l.name); };
  const cancelRename = () => { setEditingId(null); setEditName(''); };
  const saveRename = async (id) => {
    const name = editName.trim();
    if (!name) { cancelRename(); return; }
    try {
      await axios.put(`${api}/lists/${id}`, { name }, auth);
      cancelRename();
      loadLists(); loadDrip();
    } catch (e) { fail(e.response?.data?.message || e.message); }
  };

  // Merge: multi-select lists, then fold them into one target.
  const [mergeSel, setMergeSel] = useState([]);   // selected list ids
  const [mergeTarget, setMergeTarget] = useState('');
  const toggleMerge = (id) => setMergeSel((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const doMerge = async () => {
    const target = mergeTarget || mergeSel[0];
    if (!target || mergeSel.length < 2) return;
    const sources = mergeSel.filter((id) => id !== target);
    if (!window.confirm(`Спој ${sources.length} листа(и) во целната? Изворните листи ќе бидат избришани.`)) return;
    try {
      const res = await axios.post(`${api}/lists/merge`, { targetId: target, sourceIds: sources }, auth);
      notify(`Споени — преместени ${res.data.moved} контакти, избришани ${res.data.deletedLists} листи.`);
      setMergeSel([]); setMergeTarget('');
      loadLists(); loadDrip();
      if (sources.includes(selectedId)) setSelectedId(target);
    } catch (e) { fail(e.response?.data?.message || e.message); }
  };

  // Export to CSV (opens in Excel). Fetched as a blob so the auth header rides
  // along. `query` selects the scope:
  //   ''                    → all lists (grouped, deduped server-side)
  //   '?listId=<id>'        → one list, flat table
  //   '?listIds=a,b,c'      → the selected lists, grouped
  const download = async (query, filename) => {
    try {
      const res = await axios.get(`${api}/export${query}`, { ...auth, responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) { fail(e.response?.data?.message || e.message); }
  };
  const exportCsv = (listId) =>
    download(listId ? `?listId=${listId}` : '', listId ? 'contacts-list.csv' : 'contacts-all.csv');
  const exportSelectedCsv = () => {
    if (mergeSel.length === 0) return;
    download(`?listIds=${mergeSel.join(',')}`, 'contacts-selected.csv');
  };

  // ── Contact actions ───────────────────────────────────────────────────
  const [pasteText, setPasteText] = useState('');
  const importContacts = async () => {
    if (!selectedId || !pasteText.trim()) return;
    setBusy(true);
    try {
      const res = await axios.post(`${api}/lists/${selectedId}/import`, { text: pasteText }, auth);
      setPasteText('');
      notify(`Додадени ${res.data.added} · дупликати ${res.data.duplicates} · невалидни ${res.data.invalid}`);
      loadContacts(selectedId); loadLists(); loadDrip();
    } catch (e) { fail(e.response?.data?.message || e.message); }
    finally { setBusy(false); }
  };
  const [ce, setCe] = useState('');
  const emptyExtra = { company: '', city: '', name: '', other: '' };
  const [showExtra, setShowExtra] = useState(false);
  const [caExtra, setCaExtra] = useState(emptyExtra);
  const addOne = async () => {
    if (!selectedId || !ce.trim()) return;
    try {
      await axios.post(`${api}/lists/${selectedId}/contacts`, { email: ce.trim(), ...caExtra }, auth);
      setCe(''); setCaExtra(emptyExtra); setShowExtra(false);
      loadContacts(selectedId); loadLists(); loadDrip();
    } catch (e) { fail(e.response?.data?.message || e.message); }
  };
  // Per-contact detail editor (modal). `company` = назив, `name` = менаџер.
  const [editContact, setEditContact] = useState(null); // the contact being edited
  const [cForm, setCForm] = useState({ company: '', city: '', name: '', other: '' });
  const openContact = (c) => {
    setEditContact(c);
    setCForm({ company: c.company || '', city: c.city || '', name: c.name || '', other: c.other || '' });
  };
  const closeContact = () => { setEditContact(null); };
  const saveContact = async () => {
    if (!editContact) return;
    try {
      await axios.put(`${api}/contacts/${editContact._id}`, cForm, auth);
      closeContact();
      notify('Контактот е зачуван.');
      loadContacts(selectedId); refreshSearch();
    } catch (e) { fail(e.response?.data?.message || e.message); }
  };

  const refreshSearch = () => { if (results !== null) setSearchNonce((n) => n + 1); };
  const setContactStatus = async (contactId, status) => {
    try {
      await axios.put(`${api}/contacts/${contactId}`, { status }, auth);
      loadContacts(selectedId); loadDrip(); refreshSearch();
    } catch (e) { fail(e.response?.data?.message || e.message); }
  };
  const deleteContact = async (contactId) => {
    try {
      await axios.delete(`${api}/contacts/${contactId}`, auth);
      loadContacts(selectedId); loadLists(); loadDrip(); refreshSearch();
    } catch (e) { fail(e.response?.data?.message || e.message); }
  };

  // ── Drip actions ──────────────────────────────────────────────────────
  const setBucket = (bucket, patch) =>
    setDrip((d) => ({ ...d, [bucket]: { ...d[bucket], ...patch } }));

  const saveDrip = async () => {
    try {
      await axios.put(`${api}/drip`, { basic: drip.basic, pro: drip.pro }, auth);
      notify('Поставките се зачувани.');
      loadDrip(); loadLists();
    } catch (e) { fail(e.response?.data?.message || e.message); }
  };
  const togglePause = async () => {
    try {
      const res = await axios.post(`${api}/drip/enabled`, { enabled: !drip.enabled }, auth);
      setDrip(res.data.settings);
      notify(res.data.settings.enabled ? 'Дрипот е активиран.' : 'Дрипот е паузиран.');
    } catch (e) { fail(e.response?.data?.message || e.message); }
  };
  // `type` restricts the send to one bucket ('basic' | 'pro'); omit for both.
  const [busyType, setBusyType] = useState(null); // which send button is spinning
  const runNow = async (type = null) => {
    setBusy(true); setBusyType(type || 'all');
    try {
      const res = await axios.post(`${api}/drip/run-now`, type ? { type } : {}, auth);
      const r = res.data.result || {};
      if (r.paused) notify('Дрипот е паузиран — ништо не е испратено.');
      else if (type === 'basic') notify(`Испратено — Basic: ${r.basic?.sent || 0}`);
      else if (type === 'pro') notify(`Испратено — Pro: ${r.pro?.sent || 0}`);
      else notify(`Испратено — Basic: ${r.basic?.sent || 0}, Pro: ${r.pro?.sent || 0}`);
      loadDrip(); if (selectedId) loadContacts(selectedId);
    } catch (e) { fail(e.response?.data?.message || e.message); }
    finally { setBusy(false); setBusyType(null); }
  };

  // ── Render ────────────────────────────────────────────────────────────
  const renderBucket = (bucket) => {
    if (!drip) return null;
    const b = drip[bucket] || {};
    const s = stats[bucket] || {};
    const codesForType = codes.filter((c) => {
      const plan = c.plan || '';
      return bucket === 'pro' ? !(plan === 'basic' || plan === 'standard') : (plan === 'basic' || plan === 'standard');
    });
    const listsForType = lists.filter((l) => l.type === bucket);
    return (
      <div className={styles.bucket}>
        <div className={styles.bucketHead}>
          <span className={`${styles.badge} ${styles[bucket]}`}>{TYPE_LABEL[bucket]}</span>
          <span className={styles.progress}>
            {s.pending || 0} чекаат · {s.sent || 0} испратени · {s.failed || 0} неуспешни
          </span>
        </div>
        <label className={styles.field}>
          Извор (листа)
          <select value={b.listId || ''} onChange={(e) => setBucket(bucket, { listId: e.target.value || null })}>
            <option value="">Сите {TYPE_LABEL[bucket]} листи</option>
            {listsForType.map((l) => (
              <option key={l._id} value={l._id}>{l.name} ({l.contactCount || 0})</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Промо код
          <select value={b.code || ''} onChange={(e) => setBucket(bucket, { code: e.target.value })}>
            <option value="">— избери код —</option>
            {codesForType.map((c) => (
              <option key={c.code} value={c.code}>{c.code} ({c.promoDays || 30}д)</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Порака (зачуван текст)
          <select value={b.templateId || ''} onChange={(e) => setBucket(bucket, { templateId: e.target.value || null })}>
            <option value="">Стандардна порака</option>
            {templates.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </label>
        <div className={styles.row2}>
          <label className={styles.field}>
            Јазик
            <select value={b.language || 'mk'} onChange={(e) => setBucket(bucket, { language: e.target.value })}>
              <option value="mk">Македонски</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className={styles.field}>
            Дневно
            <input type="number" min="0" max="100" value={b.perDay ?? 40}
              onChange={(e) => setBucket(bucket, { perDay: e.target.value })} />
          </label>
        </div>
      </div>
    );
  };

  return (
    <TerminalShell>
      <div className={styles.wrap}>
        <div className={styles.pageHead}>
          <div>
            <h1>Контакт листи</h1>
            <p className={styles.sub}>Аудиенции за дневен дрип — 08:30 (Скопје). Испраќа промо покани постепено за да останеме во лимитите на Resend.</p>
          </div>
        </div>

        {flash && <div className={styles.flash}>{flash}</div>}
        {error && <div className={styles.error}>{error}</div>}

        {/* Drip control */}
        {drip && (
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Дрип</h2>
              <span className={`${styles.status} ${drip.enabled ? styles.on : styles.off}`}>
                {drip.enabled ? '● Активен' : '❚❚ Паузиран'}
              </span>
              <div className={styles.spacer} />
              <button className={drip.enabled ? styles.btnWarn : styles.btnPrimary} onClick={togglePause}>
                {drip.enabled ? 'Паузирај' : 'Активирај'}
              </button>
              <button className={styles.btnGhost} onClick={() => runNow('basic')} disabled={busy}>
                {busyType === 'basic' ? '…' : 'Испрати Basic'}
              </button>
              <button className={styles.btnGhost} onClick={() => runNow('pro')} disabled={busy}>
                {busyType === 'pro' ? '…' : 'Испрати Pro'}
              </button>
            </div>
            <div className={styles.buckets}>
              {renderBucket('basic')}
              {renderBucket('pro')}
            </div>
            <div className={styles.panelFoot}>
              <button className={styles.btnPrimary} onClick={saveDrip}>Зачувај поставки</button>
            </div>
          </section>
        )}

        <div className={styles.cols}>
          {/* Lists */}
          <aside className={styles.listsCol}>
            <div className={styles.listsTop}>
              <span className={styles.listsTitle}>Листи</span>
              <button className={styles.btnGhost} onClick={() => exportCsv(null)}>Извези сите (CSV)</button>
            </div>
            <div className={styles.newList}>
              <input placeholder="Име на листа" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <select value={newType} onChange={(e) => setNewType(e.target.value)}>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
              </select>
              <button className={styles.btnPrimary} onClick={createList}>+ Нова</button>
            </div>
            {mergeSel.length >= 2 && (
              <div className={styles.mergeBar}>
                <span>Спој {mergeSel.length} во:</span>
                <select value={mergeTarget || mergeSel[0]} onChange={(e) => setMergeTarget(e.target.value)}>
                  {mergeSel.map((id) => {
                    const l = lists.find((x) => x._id === id);
                    return <option key={id} value={id}>{l?.name || id}</option>;
                  })}
                </select>
                <button className={styles.btnPrimary} onClick={doMerge}>Спој</button>
                <button className={styles.btnGhost} onClick={exportSelectedCsv}>Извези избрани (CSV)</button>
                <button className={styles.btnGhost} onClick={() => { setMergeSel([]); setMergeTarget(''); }}>Откажи</button>
              </div>
            )}
            <ul className={styles.listUl}>
              {lists.map((l) => (
                <li key={l._id}
                  className={`${styles.listLi} ${selectedId === l._id ? styles.active : ''}`}
                  onClick={() => editingId === l._id ? null : setSelectedId(l._id)}>
                  <input type="checkbox" className={styles.mergeCheck}
                    checked={mergeSel.includes(l._id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleMerge(l._id)} />
                  <span className={`${styles.badge} ${styles[l.type]}`}>{TYPE_LABEL[l.type]}</span>
                  {editingId === l._id ? (
                    <input
                      className={styles.renameInput}
                      value={editName}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(l._id);
                        if (e.key === 'Escape') cancelRename();
                      }}
                      onBlur={() => saveRename(l._id)}
                    />
                  ) : (
                    <span className={styles.listName} title={l.name || 'Без име'}>{l.name || 'Без име'}</span>
                  )}
                  <span className={styles.count}>{l.contactCount || 0}</span>
                  <button className={styles.edit} title="Преименувај"
                    onClick={(e) => { e.stopPropagation(); startRename(l); }}>✎</button>
                  <button className={styles.del} title="Избриши"
                    onClick={(e) => { e.stopPropagation(); deleteList(l._id); }}>✕</button>
                </li>
              ))}
              {lists.length === 0 && <li className={styles.empty}>Нема листи. Креирај една погоре.</li>}
            </ul>
          </aside>

          {/* Contacts */}
          <main className={styles.contactsCol}>
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="🔍 Пребарај контакт (е-маил, фирма, град, менаџер) низ сите листи…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && <button className={styles.btnGhost} onClick={() => setSearch('')}>Исчисти</button>}
            </div>

            {/* Global search results — shown whenever the search box is active. */}
            {results !== null && (
              <>
                <div className={styles.contactsHead}>
                  <h2>Резултати од пребарување <span className={styles.count}>{results.length}</span></h2>
                </div>
                <table className={styles.table}>
                  <thead>
                    <tr><th>Е-маил</th><th>Фирма</th><th>Град</th><th>Менаџер</th><th>Листа</th><th>Статус</th><th></th></tr>
                  </thead>
                  <tbody>
                    {results.map((c) => (
                      <tr key={c._id} className={styles.clickRow} onClick={() => openContact(c)} title="Кликни за да уредиш">
                        <td>{c.email}</td>
                        <td>{c.company || '—'}</td>
                        <td>{c.city || '—'}</td>
                        <td>{c.name || '—'}</td>
                        <td>
                          <button className={styles.linkBtn}
                            onClick={(e) => { e.stopPropagation(); setSearch(''); setSelectedId(c.listId); }}
                            title="Отвори ја листата">
                            <span className={`${styles.badge} ${styles[c.listType]}`}>{TYPE_LABEL[c.listType] || c.listType}</span> {c.listName || '—'}
                          </button>
                        </td>
                        <td><span className={`${styles.st} ${styles['st_' + c.status]}`}>{STATUS_LABEL[c.status] || c.status}</span></td>
                        <td className={styles.rowActions} onClick={(e) => e.stopPropagation()}>
                          {c.status !== 'pending' && (
                            <button className={styles.miniBtn} title="Врати во ред" onClick={() => setContactStatus(c._id, 'pending')}>↺</button>
                          )}
                          <button className={styles.miniDel} onClick={() => deleteContact(c._id)}>✕</button>
                        </td>
                      </tr>
                    ))}
                    {results.length === 0 && <tr><td colSpan={7} className={styles.empty}>Нема совпаѓања.</td></tr>}
                  </tbody>
                </table>
              </>
            )}

            {results === null && !selected && <div className={styles.placeholder}>Избери листа за да ги видиш контактите.</div>}
            {results === null && selected && (
              <>
                <div className={styles.contactsHead}>
                  <h2>{selected.name} <span className={`${styles.badge} ${styles[selected.type]}`}>{TYPE_LABEL[selected.type]}</span></h2>
                  <button className={styles.btnGhost} onClick={() => exportCsv(selected._id)}>Извези CSV</button>
                </div>
                <div className={styles.importBox}>
                  <textarea rows={3} placeholder={'Еден контакт во ред. Само е-маил, или со детали одвоени со запирка:\nemail@пример.мк, Назив на фирма, Град, Менаџер, Друго'}
                    value={pasteText} onChange={(e) => setPasteText(e.target.value)} />
                  <button className={styles.btnPrimary} onClick={importContacts} disabled={busy}>Увези</button>
                </div>
                <p className={styles.importHint}>
                  Формат по ред: <code>е-маил, фирма, град, менаџер, друго</code> — само е-маилот е задолжителен, останатите колони се опционални.
                </p>
                <div className={styles.addOne}>
                  <input placeholder="еден е-маил" value={ce} onChange={(e) => setCe(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addOne()} />
                  <button type="button" className={styles.btnGhost} onClick={() => setShowExtra((v) => !v)}>
                    {showExtra ? '− детали' : '＋ детали'}
                  </button>
                  <button className={styles.btnPrimary} onClick={addOne}>Додади</button>
                </div>
                {showExtra && (
                  <div className={styles.addExtra}>
                    <input placeholder="Назив на фирма" value={caExtra.company}
                      onChange={(e) => setCaExtra((f) => ({ ...f, company: e.target.value }))} />
                    <select value={caExtra.city} onChange={(e) => setCaExtra((f) => ({ ...f, city: e.target.value }))}>
                      <option value="">Град…</option>
                      {MACEDONIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input placeholder="Менаџер" value={caExtra.name}
                      onChange={(e) => setCaExtra((f) => ({ ...f, name: e.target.value }))} />
                    <input placeholder="Друго" value={caExtra.other}
                      onChange={(e) => setCaExtra((f) => ({ ...f, other: e.target.value }))} />
                  </div>
                )}
                <table className={styles.table}>
                  <thead>
                    <tr><th>Е-маил</th><th>Фирма</th><th>Град</th><th>Менаџер</th><th>Статус</th><th></th></tr>
                  </thead>
                  <tbody>
                    {contacts.map((c) => (
                      <tr key={c._id} className={styles.clickRow} onClick={() => openContact(c)} title="Кликни за да уредиш">
                        <td>{c.email}</td>
                        <td>{c.company || '—'}</td>
                        <td>{c.city || '—'}</td>
                        <td>{c.name || '—'}</td>
                        <td><span className={`${styles.st} ${styles['st_' + c.status]}`}>{STATUS_LABEL[c.status] || c.status}</span></td>
                        <td className={styles.rowActions} onClick={(e) => e.stopPropagation()}>
                          {c.status !== 'pending' && (
                            <button className={styles.miniBtn} title="Врати во ред" onClick={() => setContactStatus(c._id, 'pending')}>↺</button>
                          )}
                          <button className={styles.miniDel} onClick={() => deleteContact(c._id)}>✕</button>
                        </td>
                      </tr>
                    ))}
                    {contacts.length === 0 && <tr><td colSpan={6} className={styles.empty}>Нема контакти.</td></tr>}
                  </tbody>
                </table>
              </>
            )}
          </main>
        </div>

        {/* Contact detail editor */}
        {editContact && (
          <div className={styles.overlay} onClick={closeContact}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHead}>
                <h3>Уреди контакт</h3>
                <button className={styles.modalClose} onClick={closeContact}>✕</button>
              </div>
              <label className={styles.field}>
                Е-маил
                <input value={editContact.email} readOnly disabled />
              </label>
              <label className={styles.field}>
                Назив на фирма
                <input value={cForm.company} placeholder="Назив на фирма"
                  onChange={(e) => setCForm((f) => ({ ...f, company: e.target.value }))} />
              </label>
              <label className={styles.field}>
                Град
                <select value={cForm.city} onChange={(e) => setCForm((f) => ({ ...f, city: e.target.value }))}>
                  <option value="">— избери град —</option>
                  {MACEDONIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className={styles.field}>
                Менаџер / контакт лице
                <input value={cForm.name} placeholder="Име и презиме"
                  onChange={(e) => setCForm((f) => ({ ...f, name: e.target.value }))} />
              </label>
              <label className={styles.field}>
                Друго
                <textarea rows={3} value={cForm.other} placeholder="Дополнителни белешки"
                  onChange={(e) => setCForm((f) => ({ ...f, other: e.target.value }))} />
              </label>
              <div className={styles.modalFoot}>
                <button className={styles.btnGhost} onClick={closeContact}>Откажи</button>
                <button className={styles.btnPrimary} onClick={saveContact}>Зачувај</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TerminalShell>
  );
}
