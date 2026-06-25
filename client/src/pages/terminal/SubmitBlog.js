import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import TrialDisabledNotice from '../../components/terminal/TrialDisabledNotice';
import FeatureTermsModal from '../../components/terminal/FeatureTermsModal';
import useTermsGate from '../../hooks/useTermsGate';
import { canSubmitBlog, isTrial } from '../../lib/tier';
import styles from './BlogSubmissions.module.css';

const QUILL_MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'link'],
    ['clean']
  ]
};

const STATUS_LABEL_MK = {
  draft:        'Нацрт',
  submitted:    'Чека уреднички преглед',
  ai_passed:    'Чека уреднички преглед',
  ai_failed:    'Чека уреднички преглед',
  returned:     'Вратено на доработка',
  accepted:     'Прифатено',
  published:    'Објавено',
  rejected:     'Одбиено'
};

export default function SubmitBlogPage() {
  const { token, currentUser } = useAuth();
  const { requireTerms, termsModal } = useTermsGate();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('id') || null;

  const [id, setId] = useState(editId);
  const [title, setTitle] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [authorDisplayName, setAuthorDisplayName] = useState('');
  const [authorContactEmail, setAuthorContactEmail] = useState('');
  const [authorLinkedin, setAuthorLinkedin] = useState('');
  const [authorBio, setAuthorBio] = useState('');
  const [authorPhotoUrl, setAuthorPhotoUrl] = useState(null);

  const [status, setStatus] = useState('draft');
  const [editorialNotes, setEditorialNotes] = useState('');

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!!editId);
  const [toast, setToast] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const photoRef = useRef();

  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const trial = isTrial(currentUser);
  const allowed = canSubmitBlog(currentUser);

  // Prefill author fields from the logged-in user.
  useEffect(() => {
    if (!currentUser) return;
    setAuthorDisplayName((d) => d || currentUser.fullName || currentUser.username || '');
    setAuthorContactEmail((e) => e || currentUser.email || '');
  }, [currentUser]);

  // Load existing submission if editing.
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    axios.get(`/api/blogs/submissions/${editId}`, auth)
      .then(res => {
        if (cancelled) return;
        const s = res.data?.submission || {};
        setId(s._id);
        setTitle(s.title || '');
        setBodyHtml(s.bodyHtml || '');
        setStatus(s.status || 'draft');
        setEditorialNotes(s.editorialNotes || '');
        const bio = s.authorBio || {};
        if (bio.displayName)  setAuthorDisplayName(bio.displayName);
        if (bio.contactEmail) setAuthorContactEmail(bio.contactEmail);
        if (bio.linkedinUrl)  setAuthorLinkedin(bio.linkedinUrl);
        if (bio.bio)          setAuthorBio(bio.bio);
        if (bio.photoUrl)     setAuthorPhotoUrl(bio.photoUrl);
      })
      .catch(err => setToast({ type: 'error', text: err.response?.data?.message || err.message }))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [editId]); // eslint-disable-line react-hooks/exhaustive-deps

  const bodyText = bodyHtml.replace(/<[^>]+>/g, '').trim();
  const lockedForEdit = !['draft', 'returned', 'ai_failed'].includes(status);
  const canSubmit = allowed.allowed && !lockedForEdit && !!title.trim() && !!bodyText;

  const payload = () => ({
    title: title.trim(),
    bodyHtml,
    authorBio: {
      displayName:  authorDisplayName.trim(),
      contactEmail: authorContactEmail.trim(),
      linkedinUrl:  authorLinkedin.trim(),
      photoUrl:     authorPhotoUrl,
      bio:          authorBio.trim()
    }
  });

  const saveDraft = async () => {
    setBusy(true); setToast(null);
    try {
      if (!id) {
        const res = await axios.post('/api/blogs/submissions', payload(), auth);
        const s = res.data?.submission;
        setId(s._id);
        setStatus(s.status);
        navigate(`/terminal/blogs/submit?id=${s._id}`, { replace: true });
      } else {
        const res = await axios.put(`/api/blogs/submissions/${id}`, payload(), auth);
        const s = res.data?.submission;
        setStatus(s.status);
      }
      setToast({ type: 'ok', text: 'Нацртот е зачуван.' });
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.message || err.message });
    } finally { setBusy(false); }
  };

  const submit = async () => {
    setBusy(true); setToast(null);
    try {
      // Persist the latest edits + author info, then transition.
      let targetId = id;
      if (!targetId) {
        const res = await axios.post('/api/blogs/submissions', payload(), auth);
        targetId = res.data?.submission?._id;
        if (!targetId) throw new Error('Не успеа зачувување на нацртот.');
        setId(targetId);
      } else {
        await axios.put(`/api/blogs/submissions/${targetId}`, payload(), auth);
      }
      const res = await axios.post(`/api/blogs/submissions/${targetId}/submit`, {}, auth);
      const s = res.data?.submission;
      setStatus(s.status);
      setShowSuccessModal(true);
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.message || err.message });
    } finally { setBusy(false); }
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append('image', file);
    setBusy(true);
    try {
      const res = await axios.post('/api/blogs/submissions/upload-image', fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setAuthorPhotoUrl(res.data?.imageUrl || null);
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.message || err.message });
    } finally { setBusy(false); if (photoRef.current) photoRef.current.value = ''; }
  };

  return (
    <TerminalShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Блогови</span>
          <h1 className={styles.title}>Поднеси експертски прилог</h1>
          <p className={styles.lead}>
            Напишете прилог од Вашата област. По поднесување, уредничкиот тим
            ќе го прегледа рачно. Доколку се потребни измени, ќе бидете
            контактирани на е-поштата подолу. Доколку сè е во ред, прилогот ќе
            биде објавен под Ваше име.
          </p>
        </header>

        <nav className={styles.tabs}>
          <Link to="/terminal/blogs/submit"          className={`${styles.tab} ${styles.tabActive}`}>Поднеси прилог</Link>
          <Link to="/terminal/blogs/my-submissions"  className={styles.tab}>Мои поднесувања</Link>
          <Link to="/terminal/blogs/published"       className={styles.tab}>Објавени</Link>
        </nav>

        {trial && <TrialDisabledNotice />}
        {!allowed.allowed && allowed.reason === 'plan' && (
          <div className={styles.toastError} style={{ marginBottom: 16 }}>
            Поднесувањето на прилози е достапно за Про корисници.
          </div>
        )}

        {loading ? (
          <div className={styles.spinner}>Се вчитува…</div>
        ) : (
          <div className={styles.formCol}>
            {/* Read-only banner when the submission is already submitted/accepted/published */}
            {lockedForEdit && (
              <div className={styles.toastInfo}>
                Статус: <strong>{STATUS_LABEL_MK[status] || status}</strong>.
                {status === 'submitted' && ' Уредничкиот тим ќе го прегледа рачно и ќе Ве контактира ако има потреба од измени.'}
                {status === 'accepted' && ' Прилогот е прифатен. Чека објавување.'}
                {status === 'published' && ' Прилогот е објавен на јавниот блог.'}
              </div>
            )}

            {editorialNotes && status === 'returned' && (
              <div>
                <div className={styles.label} style={{ marginBottom: 6 }}>Уреднички белешки</div>
                <div className={styles.editorialNotes}>{editorialNotes}</div>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>Наслов</label>
              <input
                className={styles.input}
                value={title}
                onChange={e => setTitle(e.target.value.slice(0, 140))}
                maxLength={140}
                disabled={lockedForEdit}
                placeholder="Краток, конкретен наслов"
              />
              <div className={styles.help}>{title.length}/140</div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Содржина</label>
              <div className={styles.editor}>
                <ReactQuill
                  value={bodyHtml}
                  onChange={setBodyHtml}
                  modules={QUILL_MODULES}
                  readOnly={lockedForEdit}
                />
              </div>
            </div>

            {/* ── author info ───────────────────────────────────────────── */}
            <div className={styles.sideCard} style={{ marginTop: 6 }}>
              <div className={styles.sideCardHead}>За авторот</div>

              <div className={styles.field}>
                <label className={styles.label}>Име за прикажување *</label>
                <input className={styles.input} value={authorDisplayName}
                       disabled={lockedForEdit}
                       onChange={e => setAuthorDisplayName(e.target.value.slice(0, 120))}
                       placeholder="На пр. Адв. Ана Петковска" />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Контакт е-пошта *</label>
                <input type="email" className={styles.input} value={authorContactEmail}
                       disabled={lockedForEdit}
                       onChange={e => setAuthorContactEmail(e.target.value.slice(0, 240))}
                       placeholder="vasa.email@firma.mk" />
                <div className={styles.help}>На оваа адреса ќе Ве контактираме ако има потреба од измени.</div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>LinkedIn (опционално)</label>
                <input className={styles.input} value={authorLinkedin}
                       disabled={lockedForEdit}
                       onChange={e => setAuthorLinkedin(e.target.value.slice(0, 240))}
                       placeholder="https://www.linkedin.com/in/vase-ime" />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Кратка биографија (опционално)</label>
                <textarea className={styles.input}
                          rows={3}
                          maxLength={320}
                          disabled={lockedForEdit}
                          value={authorBio}
                          onChange={e => setAuthorBio(e.target.value.slice(0, 320))}
                          placeholder="1–2 реченици — Ваша експертиза или фирма. Се прикажуваат под објавата." />
                <div className={styles.help}>{authorBio.length}/320</div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Фотографија (опционално)</label>
                {authorPhotoUrl && (
                  <div className={styles.coverPreview} style={{ maxWidth: 120, marginBottom: 8 }}>
                    <img src={authorPhotoUrl} alt="author" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '50%' }} />
                  </div>
                )}
                <div className={styles.coverRow}>
                  <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp"
                         onChange={uploadPhoto} disabled={lockedForEdit || busy} className={styles.fileInput} />
                  {authorPhotoUrl && (
                    <button type="button" className={styles.btnSecondary} onClick={() => setAuthorPhotoUrl(null)} disabled={lockedForEdit}>
                      Отстрани
                    </button>
                  )}
                </div>
              </div>
            </div>

            {toast && (
              <div className={toast.type === 'ok' ? styles.toastOk : styles.toastError}>{toast.text}</div>
            )}

            {!lockedForEdit && (
              <div className={styles.actionsRow}>
                <button type="button" className={styles.btnSecondary}
                        disabled={busy}
                        onClick={saveDraft}>
                  Зачувај нацрт
                </button>
                <button type="button" className={styles.btnPrimary}
                        disabled={busy || !canSubmit}
                        onClick={() => requireTerms('blog', submit)}>
                  Поднеси на уреднички преглед
                </button>
              </div>
            )}
          </div>
        )}

        {showSuccessModal && (
          <SuccessModal
            contactEmail={authorContactEmail || currentUser?.email || ''}
            onClose={() => {
              setShowSuccessModal(false);
              navigate('/terminal/blogs/my-submissions');
            }}
          />
        )}

        {termsModal && <FeatureTermsModal {...termsModal} />}
      </div>
    </TerminalShell>
  );
}

function SuccessModal({ contactEmail, onClose }) {
  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalIcon} aria-hidden>✓</div>
        <h2 className={styles.modalTitle}>Прилогот е примен</h2>
        <p className={styles.modalBody}>
          Текстот ќе биде <strong>рачно прегледан</strong> од уредничкиот тим.
          Ако се потребни измени, ќе бидете контактирани на{' '}
          <strong>{contactEmail || 'Вашата е-пошта'}</strong>. Ако сè е во ред,
          прилогот ќе биде објавен под Ваше име на јавниот блог.
        </p>
        <button type="button" className={styles.btnPrimary} onClick={onClose}>Во ред</button>
      </div>
    </div>
  );
}
