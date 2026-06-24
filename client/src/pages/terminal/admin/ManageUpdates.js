import React, { useState, useEffect, useCallback } from 'react';
import ApiService from '../../../services/api';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/terminal/Sidebar';
import ProfileRequired from '../../../components/common/ProfileRequired';
import styles from '../../../styles/terminal/admin/ManageUpdates.module.css';

const EMPTY = { title: '', body: '', category: '', ctaLabel: '', ctaHref: '', status: 'published' };

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

  const resetForm = () => { setForm(EMPTY); setEditingId(null); };

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.title.trim() || !form.body.trim()) {
      setError('Насловот и текстот се задолжителни.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await ApiService.put(`/updates/${editingId}`, form);
        setSuccess('Известувањето е ажурирано.');
      } else {
        await ApiService.post('/updates', form);
        setSuccess('Известувањето е објавено.');
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
      status: it.status || 'published'
    });
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
            <div className={styles.actions}>
              <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>
                {saving ? 'Се зачувува…' : editingId ? 'Зачувај промени' : 'Објави'}
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
                      <span className={`${styles.badge} ${it.status === 'published' ? styles.badgePublished : styles.badgeDraft}`}>
                        {it.status === 'published' ? 'Објавено' : 'Нацрт'}
                      </span>
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
