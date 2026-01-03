import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import styles from '../../styles/public/SharedDocument.module.css';

/**
 * Public Shared Document Viewer
 *
 * Allows third parties to view, download, confirm, and comment on shared documents
 * WITHOUT requiring authentication
 */
const SharedDocument = () => {
  const { shareToken } = useParams();
  const navigate = useNavigate();

  // Document state
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [commenting, setCommenting] = useState(false);

  // Comment form state
  const [commentForm, setCommentForm] = useState({
    name: '',
    email: '',
    comment: ''
  });

  /**
   * Fetch document metadata from server
   */
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await ApiService.getSharedDocument(shareToken);
        setDocument(data.document);
      } catch (error) {
        console.error('Error fetching document:', error);
        setError(error.message || 'Документот не е пронајден');
      } finally {
        setLoading(false);
      }
    };

    if (shareToken) {
      fetchDocument();
    }
  }, [shareToken]);

  /**
   * Download document
   */
  const handleDownload = async () => {
    try {
      await ApiService.downloadSharedDocument(shareToken);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Грешка при симнување на документот');
    }
  };

  /**
   * Confirm document
   */
  const handleConfirm = async () => {
    const confirmedBy = prompt('Внесете го вашето име или email за потврда:');
    if (!confirmedBy || !confirmedBy.trim()) {
      return;
    }

    try {
      setConfirming(true);
      await ApiService.confirmSharedDocument(shareToken, confirmedBy.trim());

      // Update local state
      setDocument(prev => ({
        ...prev,
        isConfirmed: true,
        confirmedAt: new Date(),
        confirmedBy: confirmedBy.trim()
      }));

      alert('✅ Документот е успешно потврден!');
    } catch (error) {
      console.error('Error confirming document:', error);
      alert(error.message || 'Грешка при потврдување на документот');
    } finally {
      setConfirming(false);
    }
  };

  /**
   * Submit comment
   */
  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!commentForm.name.trim() || !commentForm.comment.trim()) {
      alert('Името и коментарот се задолжителни полиња');
      return;
    }

    try {
      setCommenting(true);

      await ApiService.addCommentToSharedDocument(shareToken, {
        name: commentForm.name.trim(),
        email: commentForm.email.trim(),
        comment: commentForm.comment.trim()
      });

      // Update local state with new comment
      setDocument(prev => ({
        ...prev,
        comments: [
          ...prev.comments,
          {
            name: commentForm.name.trim(),
            email: commentForm.email.trim(),
            comment: commentForm.comment.trim(),
            createdAt: new Date()
          }
        ]
      }));

      // Reset form
      setCommentForm({ name: '', email: '', comment: '' });
      alert('✅ Коментарот е успешно додаден!');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert(error.message || 'Грешка при додавање на коментар');
    } finally {
      setCommenting(false);
    }
  };

  /**
   * Format date in Macedonian locale
   */
  const formatDate = (date) => {
    if (!date) return 'Непознато';

    const d = new Date(date);
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    try {
      return d.toLocaleDateString('mk-MK', options);
    } catch (error) {
      // Fallback if mk-MK locale not available
      return d.toLocaleDateString('en-US', options);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Се вчитува документот...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2>Грешка</h2>
          <p className={styles.errorMessage}>{error}</p>
          <button
            onClick={() => navigate('/')}
            className={styles.homeButton}
          >
            Оди на почетна
          </button>
        </div>
      </div>
    );
  }

  // No document found
  if (!document) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <div className={styles.errorIcon}>📄</div>
          <h2>Документот не е пронајден</h2>
          <p className={styles.errorMessage}>Овој документ не постои или е избришан.</p>
          <button
            onClick={() => navigate('/')}
            className={styles.homeButton}
          >
            Оди на почетна
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>

        {/* Header Section */}
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <div className={styles.documentIcon}>📄</div>
          </div>
          <h1 className={styles.fileName}>{document.fileName}</h1>
          <p className={styles.documentType}>{document.documentType}</p>
        </div>

        {/* Metadata */}
        <div className={styles.metadata}>
          <div className={styles.metadataItem}>
            <span className={styles.metadataLabel}>Креирано:</span>
            <span className={styles.metadataValue}>{formatDate(document.createdAt)}</span>
          </div>
          <div className={styles.metadataItem}>
            <span className={styles.metadataLabel}>Истекува:</span>
            <span className={styles.metadataValue}>{formatDate(document.expiresAt)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button
            onClick={handleDownload}
            className={styles.downloadButton}
          >
            <span className={styles.buttonIcon}>⬇️</span>
            Симни документ
          </button>

          <button
            onClick={handleConfirm}
            disabled={document.isConfirmed || confirming}
            className={`${styles.confirmButton} ${document.isConfirmed ? styles.confirmed : ''}`}
          >
            <span className={styles.buttonIcon}>
              {document.isConfirmed ? '✓' : '✅'}
            </span>
            {document.isConfirmed ? 'Потврдено' : confirming ? 'Се потврдува...' : 'Потврди документ'}
          </button>
        </div>

        {/* Confirmation Status */}
        {document.isConfirmed && (
          <div className={styles.confirmationBanner}>
            <span className={styles.confirmationIcon}>✓</span>
            <div className={styles.confirmationText}>
              <strong>Документот е потврден</strong>
              {document.confirmedBy && (
                <span className={styles.confirmedBy}> од {document.confirmedBy}</span>
              )}
              {document.confirmedAt && (
                <span className={styles.confirmedDate}> на {formatDate(document.confirmedAt)}</span>
              )}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statIcon}>👁️</span>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{document.viewCount}</span>
              <span className={styles.statLabel}>Прегледи</span>
            </div>
          </div>
          <div className={styles.stat}>
            <span className={styles.statIcon}>⬇️</span>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{document.downloadCount}</span>
              <span className={styles.statLabel}>Симнувања</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className={styles.commentsSection}>
          <h2 className={styles.commentsTitle}>
            💬 Коментари
            <span className={styles.commentsCount}>({document.comments.length})</span>
          </h2>

          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.formLabel}>
                Вашето име <span className={styles.required}>*</span>
              </label>
              <input
                id="name"
                type="text"
                placeholder="Внесете го вашето име"
                value={commentForm.name}
                onChange={(e) => setCommentForm({ ...commentForm, name: e.target.value })}
                required
                disabled={commenting}
                className={styles.input}
                maxLength={100}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.formLabel}>
                Email (опционално)
              </label>
              <input
                id="email"
                type="email"
                placeholder="vasiot@email.com"
                value={commentForm.email}
                onChange={(e) => setCommentForm({ ...commentForm, email: e.target.value })}
                disabled={commenting}
                className={styles.input}
                maxLength={200}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="comment" className={styles.formLabel}>
                Коментар или сугестија <span className={styles.required}>*</span>
              </label>
              <textarea
                id="comment"
                placeholder="Внесете го вашиот коментар или сугестија..."
                value={commentForm.comment}
                onChange={(e) => setCommentForm({ ...commentForm, comment: e.target.value })}
                required
                disabled={commenting}
                rows={4}
                className={styles.textarea}
                maxLength={1000}
              />
            </div>

            <button
              type="submit"
              disabled={commenting}
              className={styles.submitButton}
            >
              {commenting ? 'Се праќа...' : 'Испрати коментар'}
            </button>
          </form>

          {/* Comments List */}
          <div className={styles.commentsList}>
            {document.comments.length === 0 ? (
              <div className={styles.noComments}>
                <p>Сè уште нема коментари. Бидете прв што ќе остави коментар!</p>
              </div>
            ) : (
              document.comments.map((comment, index) => (
                <div key={index} className={styles.comment}>
                  <div className={styles.commentHeader}>
                    <div className={styles.commentAuthor}>
                      <strong className={styles.commentName}>{comment.name}</strong>
                      {comment.email && (
                        <span className={styles.commentEmail}>({comment.email})</span>
                      )}
                    </div>
                    <span className={styles.commentDate}>
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className={styles.commentText}>{comment.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SharedDocument;
