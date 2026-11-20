import React, { useState, useEffect, useCallback } from 'react';
import ApiService from '../../../services/api';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/terminal/Sidebar';
import ProfileRequired from '../../../components/common/ProfileRequired';
import { AI_AGENTS } from '../../../config/aiAgents';
import styles from '../../../styles/terminal/admin/ManageUpdates.module.css';

const EMPTY = { title: '', body: '', category: '', ctaLabel: '', ctaHref: '', status: 'published', authorAgent: '', publishAt: '' };

const agentByKey = (k) => AI_AGENTS.find(a => a.key === k);

// Date → value for <input type="datetime-local"> (local time, no seconds).
const toLocalInput = (d) => {
  const x = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
};
const isFuture = (d) => d && new Date(d).getTime() > Date.now();

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' })
  : '';

const ManageUpdates = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState('');
  const [hint, setHint] = useState('');
  const [drafting, setDrafting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ApiService.request('/updates/admin/all');
      setItems(data?.items || []);
    } catch (err) {
      setError('Грешка при вчитување на известувањата.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const resetForm = () => { setForm(EMPTY); setEditingId(null); setSource(''); setHint(''); };

  // The chosen character drafts the post from the pasted source; admin edits after.
  const generateDraft = async () => {
    setError(''); setSuccess('');
    if (!form.authorAgent) { setError('Прво избери лик во „Објави како".'); return; }
    if (!source.trim()) { setError('Внеси извор (текст, вест, рок…).'); return; }
    setDrafting(true);
    try {
      const { draft } = await ApiService.post('/updates/admin/draft', { agent: form.authorAgent, source, hint });
      setForm(f => ({ ...f, ...draft }));
      setSuccess(`${agentByKey(form.authorAgent)?.name} напиша нацрт — провери го и уреди пред објава.`);
    } catch (err) {
      setError('Нацртот не успеа. Обиди се повторно.');
    } finally {
      setDrafting(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.title.trim() || !form.body.trim()) {
      setError('Насловот и текстот се задолжителни.');
      return;
    }
    setSaving(true);
    const payload = { ...form, publishAt: form.publishAt ? new Date(form.publishAt).toISOString() : '' };
    const scheduled = form.status === 'published' && isFuture(payload.publishAt);
    try {
      if (editingId) {
        await ApiService.put(`/updates/${editingId}`, payload);
        setSuccess('Известувањето е ажурирано.');
      } else {
        await ApiService.post('/updates', payload);
        setSuccess(scheduled ? 'Известувањето е закажано.' : 'Известувањето е зачувано.');
      }
      resetForm();
      await load();
    } catch (err) {
      setError('Зачувувањето не успеа. Обидете се повторно.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (it) => {
    setEditingId(it._id);
    setForm({
      title: it.title || '',
      body: it.body || '',
      category: it.category || '',
      ctaLabel: it.ctaLabel || '',
      ctaHref: it.ctaHref || '',
      status: it.status || 'published',
      authorAgent: it.authorAgent || '',
      publishAt: isFuture(it.publishedAt) ? toLocalInput(it.publishedAt) : ''
    });
    setSource(''); setHint('');
    setSuccess(''); setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!window.confirm('Да се избрише ова известување?')) return;
    setError(''); setSuccess('');
    try {
      await ApiService.delete(`/updates/${id}`);
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError('Бришењето не успеа.');
    }
  };

  return (
    <ProfileRequired>
      <Header isTerminal={true} />
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>
          <h1 className={styles.title}>Известувања</h1>
          <p className={styles.subtitle}>
            Кратки, датирани објави што се прикажуваат на почетната страница во терминалот.
            Видливи се за сите најавени корисници (не се јавни блогови).
          </p>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <form className={styles.form} onSubmit={submit}>
            <h2 className={styles.formTitle}>
              {editingId ? 'Уреди известување' : 'Ново известување'}
            </h2>
            <div className={styles.row}>
              <label className={styles.label}>Објави како</label>
              <select className={styles.select} value={form.authorAgent} onChange={set('authorAgent')}>
                <option value="">Nexa (без лик)</option>
                {AI_AGENTS.map(a => (
                  <option key={a.key} value={a.key}>{a.name} · {a.role}</option>
                ))}
              </select>
            </div>

            {form.authorAgent && (
              <div className={styles.draftBox}>
                <div className={styles.row}>
                  <label className={styles.label}>Извор за {agentByKey(form.authorAgent)?.name}</label>
                  <textarea className={styles.textarea} value={source} onChange={(e) => setSource(e.target.value)}
                    placeholder="Залепи текст од закон, вест од УЈП, рок, линк со опис… Ликот ќе користи само факти од тука." />
                </div>
                <div className={styles.row}>
                  <label className={styles.label}>Насока (опц.)</label>
                  <input className={styles.input} value={hint} onChange={(e) => setHint(e.target.value)}
                    placeholder="пр. нагласи го рокот; фокус на фирми со до 10 вработени" />
                </div>
                <button type="button" className={styles.linkBtn} onClick={generateDraft} disabled={drafting}>
                  {drafting ? 'Се пишува нацрт…' : 'Генерирај нацрт →'}
                </button>
                <p className={styles.hint}>Коментарите под објавата добиваат автоматски краток одговор од ликот.</p>
              </div>
            )}

            <div className={styles.row}>
              <label className={styles.label}>Наслов *</label>
              <input className={styles.input} value={form.title} onChange={set('title')}
                placeholder="пр. Се менува минималната плата од 1 јули" />
            </div>
            <div className={styles.row}>
              <label className={styles.label}>Текст *</label>
              <textarea className={styles.textarea} value={form.body} onChange={set('body')}
                placeholder="Кратко објаснување и што треба да преземе корисникот." />
            </div>
            <div className={styles.row2}>
              <div className={styles.row}>
                <label className={styles.label}>Категорија</label>
                <input className={styles.input} value={form.category} onChange={set('category')}
                  placeholder="пр. Работни односи" />
              </div>
              <div className={styles.row}>
                <label className={styles.label}>Статус</label>
                <select className={styles.select} value={form.status} onChange={set('status')}>
                  <option value="published">Објавено</option>
                  <option value="draft">Нацрт</option>
                </select>
              </div>
            </div>
            <div className={styles.row2}>
              <div className={styles.row}>
                <label className={styles.label}>Текст на копче (опц.)</label>
                <input className={styles.input} value={form.ctaLabel} onChange={set('ctaLabel')}
                  placeholder="пр. Ажурирај го документот" />
              </div>
              <div className={styles.row}>
                <label className={styles.label}>Линк на копче (опц.)</label>
                <input className={styles.input} value={form.ctaHref} onChange={set('ctaHref')}
                  placeholder="/terminal/documents/... или https://..." />
              </div>
            </div>
            <div className={styles.row}>
              <label className={styles.label}>Закажи за (опц.)</label>
              <input type="datetime-local" className={styles.input} value={form.publishAt} onChange={set('publishAt')} />
            </div>
            <div className={styles.actions}>
              <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>
                {saving ? 'Се зачувува…' : editingId ? 'Зачувај промени'
                  : form.status === 'draft' ? 'Зачувај нацрт'
                  : isFuture(form.publishAt) ? 'Закажи' : 'Објави'}
              </button>
              {editingId && (
                <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={resetForm}>
                  Откажи
                </button>
              )}
            </div>
          </form>

          <h2 className={styles.listTitle}>Сите известувања</h2>
          {loading ? (
            <div className={styles.empty}>Вчитување…</div>
          ) : items.length === 0 ? (
            <div className={styles.empty}>Сè уште нема известувања.</div>
          ) : (
            <div className={styles.list}>
              {items.map(it => (
                <div key={it._id} className={styles.card}>
                  <div>
                    <div className={styles.cardMeta}>
                      {it.status === 'published' && isFuture(it.publishedAt) ? (
                        <span className={`${styles.badge} ${styles.badgeScheduled}`}>Закажано</span>
                      ) : (
                        <span className={`${styles.badge} ${it.status === 'published' ? styles.badgePublished : styles.badgeDraft}`}>
                          {it.status === 'published' ? 'Објавено' : 'Нацрт'}
                        </span>
                      )}
                      {it.authorAgent && <span className={styles.author}>{agentByKey(it.authorAgent)?.name}·AI</span>}
                      {it.category && <span className={styles.cat}>{it.category}</span>}
                      <span className={styles.date}>{fmtDate(it.publishedAt || it.createdAt)}</span>
                    </div>
                    <h3 className={styles.cardTitle}>{it.title}</h3>
                    {it.body && <p className={styles.cardBody}>{it.body}</p>}
                  </div>
                  <div className={styles.cardActions}>
                    <button className={`${styles.linkBtn} ${styles.linkEdit}`} onClick={() => startEdit(it)}>Уреди</button>
                    <button className={`${styles.linkBtn} ${styles.linkDelete}`} onClick={() => remove(it._id)}>Избриши</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProfileRequired>
  );
};

export default ManageUpdates;
