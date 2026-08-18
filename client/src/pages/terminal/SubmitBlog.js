import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import TrialDisabledNotice from '../../components/terminal/TrialDisabledNotice';
import SubmitConsent from '../../components/terminal/SubmitConsent';
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
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('id') || null;

  const [id, setId] = useState(editId);
  const [title, setTitle] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [authorDisplayName, setAuthorDisplayName] = useState('');
  const [authorContactEmail, setAuthorContactEmail] = useState('');
  const [authorLinkedin, setAuthorLinkedin] = useState('');
  const [authorWebsite, setAuthorWebsite] = useState('');
  const [authorBio, setAuthorBio] = useState('');
  const [authorTagline, setAuthorTagline] = useState('');
  const [authorExtendedBio, setAuthorExtendedBio] = useState('');
  const [authorCredentials, setAuthorCredentials] = useState([]); // string[]
  const [credentialDraft, setCredentialDraft] = useState('');
  const [authorPhotoUrl, setAuthorPhotoUrl] = useState(null);

  const [status, setStatus] = useState('draft');
  const [editorialNotes, setEditorialNotes] = useState('');

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!!editId);
  const [toast, setToast] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const trial = isTrial(currentUser);
  const allowed = canSubmitBlog(currentUser);

  // Prefill author fields from the logged-in user.
  useEffect(() => {
    if (!currentUser) return;
    setAuthorDisplayName((d) => d || currentUser.fullName || currentUser.username || '');
    setAuthorContactEmail((e) => e || currentUser.email || '');
  }, [currentUser]);

  // For a NEW draft, prefill from the remembered author profile so the author
  // only has to change (not re-enter) their details each time.
  useEffect(() => {
    if (editId) return;
    let cancelled = false;
    axios.get('/api/blogs/submissions/author-profile', auth)
      .then(res => {
        if (cancelled) return;
        const b = res.data?.authorBio || {};
        if (b.displayName)  setAuthorDisplayName(b.displayName);
        if (b.contactEmail) setAuthorContactEmail(b.contactEmail);
        if (b.linkedinUrl)  setAuthorLinkedin(b.linkedinUrl);
        if (b.website)      setAuthorWebsite(b.website);
        if (b.bio)          setAuthorBio(b.bio);
        if (b.tagline)      setAuthorTagline(b.tagline);
        if (b.extendedBio)  setAuthorExtendedBio(b.extendedBio);
        if (Array.isArray(b.credentials)) setAuthorCredentials(b.credentials);
        if (b.photoUrl)     setAuthorPhotoUrl(b.photoUrl);
      })
      .catch(() => { /* no saved profile yet */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

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
        if (bio.website)      setAuthorWebsite(bio.website);
        if (bio.bio)          setAuthorBio(bio.bio);
        if (bio.tagline)      setAuthorTagline(bio.tagline);
        if (bio.extendedBio)  setAuthorExtendedBio(bio.extendedBio);
        if (Array.isArray(bio.credentials)) setAuthorCredentials(bio.credentials);
        if (bio.photoUrl)     setAuthorPhotoUrl(bio.photoUrl);
      })
      .catch(err => setToast({ type: 'error', text: err.response?.data?.message || err.message }))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [editId]); // eslint-disable-line react-hooks/exhaustive-deps

  const bodyText = bodyHtml.replace(/<[^>]+>/g, '').trim();
  const lockedForEdit = !['draft', 'returned', 'ai_failed'].includes(status);
  // Author identity is required to publish under their name: full name + photo.
  const authorReady = !!authorDisplayName.trim() && !!authorPhotoUrl;
  const canSubmit = allowed.allowed && !lockedForEdit && !!title.trim() && !!bodyText && authorReady;

  const addCredential = () => {
    const v = credentialDraft.trim();
    if (!v || authorCredentials.length >= 6) return;
    setAuthorCredentials(prev => [...prev, v]);
    setCredentialDraft('');
  };
  const removeCredential = (idx) =>
    setAuthorCredentials(prev => prev.filter((_, i) => i !== idx));

  const payload = () => ({
    title: title.trim(),
    bodyHtml,
    authorBio: {
      displayName:  authorDisplayName.trim(),
      contactEmail: authorContactEmail.trim(),
      linkedinUrl:  authorLinkedin.trim(),
      website:      authorWebsite.trim(),
      photoUrl:     authorPhotoUrl,
      bio:          authorBio.trim(),
      tagline:      authorTagline.trim(),
      extendedBio:  authorExtendedBio.trim(),
      credentials:  authorCredentials
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
    if (!authorDisplayName.trim() || !authorPhotoUrl) {
      setToast({ type: 'error', text: 'Полето Автор бара име и фотографија пред поднесување.' });
      return;
    }
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
          <Link to="/terminal/blogs/submit"           className={`${styles.tab} ${styles.tabActive}`}>Поднеси прилог</Link>
          <Link to="/terminal/marketing-hub?tab=blog" className={styles.tab}>Мои прилози</Link>
        </nav>

        {trial && <TrialDisabledNotice />}
        {!allowed.allowed && allowed.reason === 'plan' && (
          <div className={styles.toastError} style={{ marginBottom: 16 }}>
            Поднесувањето на прилози е достапно за претплатници.
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
                <label className={styles.label}>Титула / потпис (опционално)</label>
                <input className={styles.input} value={authorTagline}
                       disabled={lockedForEdit}
                       onChange={e => setAuthorTagline(e.target.value.slice(0, 200))}
                       placeholder="На пр. Адвокат · магистер по право (LL.M.)" />
                <div className={styles.help}>Една линија под името во картичката на авторот.</div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Контакт е-пошта (опционално)</label>
                <input type="email" className={styles.input} value={authorContactEmail}
                       disabled={lockedForEdit}
                       onChange={e => setAuthorContactEmail(e.target.value.slice(0, 240))}
                       placeholder="vasa.email@firma.mk" />
                <div className={styles.help}>Се прикажува како линк за контакт под објавата.</div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>LinkedIn (опционално)</label>
                <input className={styles.input} value={authorLinkedin}
                       disabled={lockedForEdit}
                       onChange={e => setAuthorLinkedin(e.target.value.slice(0, 240))}
                       placeholder="https://www.linkedin.com/in/vase-ime" />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Веб-страница (опционално)</label>
                <input className={styles.input} value={authorWebsite}
                       disabled={lockedForEdit}
                       onChange={e => setAuthorWebsite(e.target.value.slice(0, 240))}
                       placeholder="https://vasa-firma.mk" />
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
                <label className={styles.label}>Проширена биографија (опционално)</label>
                <textarea className={styles.input}
                          rows={5}
                          maxLength={1200}
                          disabled={lockedForEdit}
                          value={authorExtendedBio}
                          onChange={e => setAuthorExtendedBio(e.target.value.slice(0, 1200))}
                          placeholder="Подетален опис — искуство, образование, фокус. Се крие зад „Повеќе за авторот“." />
                <div className={styles.help}>{authorExtendedBio.length}/1200</div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Квалификации (опционално)</label>
                <div className={styles.coverRow}>
                  <input className={styles.input} value={credentialDraft}
                         disabled={lockedForEdit || authorCredentials.length >= 6}
                         onChange={e => setCredentialDraft(e.target.value.slice(0, 160))}
                         onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCredential(); } }}
                         placeholder="На пр. LL.M. — граѓанско право" />
                  <button type="button" className={styles.btnSecondary}
                          disabled={lockedForEdit || !credentialDraft.trim() || authorCredentials.length >= 6}
                          onClick={addCredential}>
                    Додај
                  </button>
                </div>
                {authorCredentials.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {authorCredentials.map((c, i) => (
                      <span key={i} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: 999,
                        fontSize: 13, color: '#374151', background: '#fff'
                      }}>
                        {c}
                        {!lockedForEdit && (
                          <button type="button" onClick={() => removeCredential(i)}
                                  aria-label="Отстрани"
                                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 15, lineHeight: 1, padding: 0 }}>
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                <div className={styles.help}>До 6 значки, се прикажуваат како чипови во картичката.</div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Фотографија (линк) *</label>
                {authorPhotoUrl && (
                  <div className={styles.coverPreview} style={{ maxWidth: 120, marginBottom: 8 }}>
                    <img src={authorPhotoUrl} alt="author"
                         style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '50%' }}
                         onError={(ev) => { ev.currentTarget.style.display = 'none'; }} />
                  </div>
                )}
                <input className={styles.input} type="url"
                       value={authorPhotoUrl || ''}
                       disabled={lockedForEdit}
                       onChange={e => setAuthorPhotoUrl(e.target.value.trim().slice(0, 500) || null)}
                       placeholder="https://... (линк до Ваша фотографија)" />
                <div className={styles.help}>
                  Залепете директен линк до слика (JPG/PNG/WEBP) — на пр. од LinkedIn,
                  веб-страницата на фирмата или друг јавен извор.
                </div>
              </div>
            </div>

            {toast && (
              <div className={toast.type === 'ok' ? styles.toastOk : styles.toastError}>{toast.text}</div>
            )}

            {!lockedForEdit && (
              <>
                {!authorReady && (
                  <div className={styles.help} style={{ color: '#b45309', marginTop: 4 }}>
                    За да поднесете, пополнете го името и фотографијата во „За авторот“.
                  </div>
                )}
                <div className={styles.actionsRow}>
                  <button type="button" className={styles.btnSecondary}
                          disabled={busy}
                          onClick={saveDraft}>
                    Зачувај нацрт
                  </button>
                  <button type="button" className={styles.btnPrimary}
                          disabled={busy || !canSubmit}
                          onClick={submit}>
                    Поднеси на уреднички преглед
                  </button>
                </div>
                <SubmitConsent />
              </>
            )}
          </div>
        )}

        {showSuccessModal && (
          <SuccessModal
            contactEmail={authorContactEmail || currentUser?.email || ''}
            onClose={() => {
              setShowSuccessModal(false);
              navigate('/terminal/marketing-hub?tab=blog');
            }}
          />
        )}
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
