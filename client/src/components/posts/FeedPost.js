import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import CompanyPostCard from './CompanyPostCard';
import a from './postActions.module.css';

/**
 * A company post in the Terminal feed with the network actions:
 *  - „Заинтересирани сме" (optional short note) → message + e-mail to the company
 *  - „Испратете понуда" on „Бараме" → deal + quote draft (Понуди) for the viewer
 *  - share, report; admin: remove.
 */
export default function FeedPost({ post, onChange }) {
  const { token, currentUser } = useAuth();
  const navigate = useNavigate();
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const admin = currentUser?.role === 'admin';
  const url = post.author?.slug ? `${window.location.origin}/f/${post.author.slug}#objava-${post._id}` : '';

  const call = async (key, fn) => {
    setBusy(key); setErr('');
    try { await fn(); } catch (e) { setErr(e.response?.data?.message || 'Не успеа. Обидете се повторно.'); }
    setBusy('');
  };

  const interest = () => call('interest', async () => {
    await axios.post(`/api/company-posts/${post._id}/interest`, { note }, auth);
    setNoteOpen(false);
    onChange?.({ ...post, interested: true });
  });
  const quote = () => call('quote', async () => {
    const r = await axios.post(`/api/company-posts/${post._id}/quote`, {}, auth);
    navigate(`/terminal/ponudi/${r.data.quoteId}`);
  });
  const report = () => call('report', async () => {
    if (!window.confirm('Да ја пријавиме објавата како несоодветна?')) return;
    await axios.post(`/api/company-posts/${post._id}/report`, {}, auth);
    onChange?.({ ...post, reported: true });
  });
  const remove = () => call('remove', async () => {
    if (!window.confirm('Да се отстрани објавата од мрежата?')) return;
    await axios.delete(`/api/company-posts/admin/${post._id}`, auth);
    onChange?.(null);
  });
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch (_) { /* ignore */ }
  };

  return (
    <CompanyPostCard post={post}>
      {post.mine ? (
        <span className={a.done}>Ваша објава</span>
      ) : post.interested ? (
        <span className={a.done}>✓ Ја известивте фирмата</span>
      ) : noteOpen ? (
        <div className={a.noteRow}>
          <input autoFocus maxLength={500} placeholder="Кратка порака (опционално)" value={note} onChange={(e) => setNote(e.target.value)} />
          <button type="button" className={a.primary} disabled={!!busy} onClick={interest}>{busy === 'interest' ? 'Се испраќа…' : 'Испрати'}</button>
          <button type="button" className={a.link} onClick={() => setNoteOpen(false)}>Откажи</button>
        </div>
      ) : (
        <>
          {post.type === 'seeking' && (
            <button type="button" className={a.primary} disabled={!!busy} onClick={quote}>{busy === 'quote' ? 'Се отвора…' : 'Испратете понуда'}</button>
          )}
          <button type="button" className={post.type === 'seeking' ? a.ghost : a.primary} onClick={() => setNoteOpen(true)}>
            {post.type === 'offer' ? 'Заинтересирани сме' : 'Јавете се'}
          </button>
        </>
      )}
      {!noteOpen && (
        <span className={a.right}>
          {url && <button type="button" className={a.link} onClick={copy}>{copied ? 'Копирано' : 'Сподели'}</button>}
          {!post.mine && !post.reported && <button type="button" className={a.link} onClick={report}>Пријави</button>}
          {admin && <button type="button" className={a.link} onClick={remove}>Отстрани</button>}
        </span>
      )}
      {err && <div className={a.err}>{err}</div>}
    </CompanyPostCard>
  );
}
