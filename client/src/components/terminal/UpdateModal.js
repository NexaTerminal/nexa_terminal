import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../../services/api';
import styles from '../../styles/terminal/UpdatesFeed.module.css';

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' })
  : '';

/**
 * "Read more" modal for an Update: full text, like toggle, and comments.
 * `seed` is the card-level item (instant render); we fetch the full doc with
 * comments on open. `onPatch(id, patch)` keeps the underlying card in sync.
 */
const UpdateModal = ({ seed, onClose, onPatch }) => {
  const [item, setItem] = useState(seed);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const id = seed._id;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await ApiService.request(`/updates/${id}`);
        if (cancelled) return;
        setItem(data.item);
        setComments(data.item.comments || []);
      } catch {
        if (!cancelled) setError('Грешка при вчитување.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggleLike = useCallback(async () => {
    try {
      const r = await ApiService.post(`/updates/${id}/like`);
      setItem(prev => ({ ...prev, likesCount: r.likesCount, likedByMe: r.likedByMe }));
      onPatch?.(id, { likesCount: r.likesCount, likedByMe: r.likedByMe });
    } catch { /* ignore */ }
  }, [id, onPatch]);

  const addComment = async (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || posting) return;
    setPosting(true); setError('');
    try {
      const r = await ApiService.post(`/updates/${id}/comments`, { content });
      setComments(prev => [...prev, r.comment]);
      setDraft('');
      setItem(prev => ({ ...prev, commentsCount: r.commentsCount }));
      onPatch?.(id, { commentsCount: r.commentsCount });
    } catch {
      setError('Коментарот не е испратен.');
    } finally {
      setPosting(false);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      const r = await ApiService.delete(`/updates/${id}/comments/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
      setItem(prev => ({ ...prev, commentsCount: r.commentsCount }));
      onPatch?.(id, { commentsCount: r.commentsCount });
    } catch { /* ignore */ }
  };

  const cta = (item.ctaLabel && item.ctaHref) ? item : null;
  const isExternal = cta && /^https?:\/\//i.test(cta.ctaHref);

  return (
    <div className={styles.modalOverlay} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{item.title}</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Затвори">×</button>
        </header>

        <div className={styles.modalBody}>
          <div className={styles.modalMeta}>
            {item.category && <span className={styles.updateCategory}>{item.category}</span>}
            <span className={styles.blogPostTime}>{fmtDate(item.publishedAt || item.createdAt)}</span>
          </div>

          <p className={styles.modalText}>{item.body}</p>

          {cta && (isExternal
            ? <a className={styles.updateCta} href={cta.ctaHref} target="_blank" rel="noopener noreferrer">{cta.ctaLabel}</a>
            : <Link className={styles.updateCta} to={cta.ctaHref} onClick={onClose}>{cta.ctaLabel}</Link>
          )}

          <div className={styles.modalEngage}>
            <button
              className={`${styles.engageBtn} ${item.likedByMe ? styles.engageBtnActive : ''}`}
              onClick={toggleLike}
              type="button"
            >
              <span className={styles.engageIcon}>{item.likedByMe ? '♥' : '♡'}</span>
              <span>{item.likesCount || 0}</span>
            </button>
            <span className={styles.engageBtn} aria-hidden="true">
              <span className={styles.engageIcon}>💬</span>
              <span>{item.commentsCount || 0}</span>
            </span>
          </div>
        </div>

        <div className={styles.commentsWrap}>
          <h3 className={styles.commentsTitle}>Коментари</h3>

          <form className={styles.commentForm} onSubmit={addComment}>
            <textarea
              className={styles.commentInput}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Напишете коментар…"
              rows={1}
            />
            <button className={styles.commentSubmit} type="submit" disabled={posting || !draft.trim()}>
              {posting ? '…' : 'Испрати'}
            </button>
          </form>
          {error && <div className={styles.feedError}>{error}</div>}

          {loading ? (
            <div className={styles.commentEmpty}>Се вчитува…</div>
          ) : comments.length === 0 ? (
            <div className={styles.commentEmpty}>Сè уште нема коментари. Бидете први.</div>
          ) : (
            <div className={styles.commentList}>
              {comments.map(c => (
                <div key={c._id} className={styles.commentItem}>
                  <div className={styles.commentTop}>
                    <span className={styles.commentAuthor}>{c.authorName}</span>
                    <span className={styles.commentDate}>{fmtDate(c.createdAt)}</span>
                  </div>
                  <p className={styles.commentText}>{c.content}</p>
                  {c.mine && (
                    <button className={styles.commentDelete} onClick={() => deleteComment(c._id)}>Избриши</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateModal;
