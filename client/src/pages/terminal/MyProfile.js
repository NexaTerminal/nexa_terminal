import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../../services/api';
import TerminalShell from '../../components/terminal/TerminalShell';
import FeatureTermsModal from '../../components/terminal/FeatureTermsModal';
import useTermsGate from '../../hooks/useTermsGate';
import ProfileCard from '../../components/profile/ProfileCard';
import { MK_CITIES } from '../../config/mkCities';
import styles from '../../styles/terminal/CompanyProfile.module.css';

/**
 * „Мој профил" — the OPTIONAL company profile editor. Nothing in the app needs
 * it; it is only how others in the network see the company. First visit is
 * prefilled from the company data (companyInfo) so it takes one click to start.
 */

const EMPTY = {
  displayName: '', headline: '', avatarUrl: '', coverUrl: '', city: '', website: '',
  links: { linkedin: '', facebook: '', instagram: '' },
  offers: [], lookingFor: [], contactEmail: '',
};

const fromProfile = (p) => ({
  ...EMPTY,
  ...Object.fromEntries(Object.keys(EMPTY).map(k => [k, p?.[k] ?? EMPTY[k]])),
  links: { ...EMPTY.links, ...(p?.links || {}) },
});

// Fill only the fields that are still empty.
const mergeEmpty = (form, suggested = {}) => {
  const next = { ...form };
  for (const [k, v] of Object.entries(suggested)) {
    const cur = next[k];
    const isEmpty = Array.isArray(cur) ? cur.length === 0 : !cur;
    if (isEmpty && (Array.isArray(v) ? v.length : v)) next[k] = v;
  }
  return next;
};

const TagInput = ({ value, onChange, placeholder, max = 5 }) => {
  const [draft, setDraft] = useState('');
  const add = () => {
    const t = draft.trim();
    if (!t || value.length >= max || value.some(x => x.toLowerCase() === t.toLowerCase())) { setDraft(''); return; }
    onChange([...value, t.slice(0, 60)]);
    setDraft('');
  };
  return (
    <div className={styles.tagInput}>
      {value.map(t => (
        <span key={t} className={styles.tagChip}>
          {t}
          <button type="button" aria-label={`Отстрани ${t}`} onClick={() => onChange(value.filter(x => x !== t))}>×</button>
        </span>
      ))}
      {value.length < max && (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
          onBlur={add}
          placeholder={value.length ? '' : placeholder}
        />
      )}
    </div>
  );
};

const MyProfile = () => {
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(null);       // server view of the saved profile
  const [suggested, setSuggested] = useState({});
  const [prefilled, setPrefilled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { requireTerms, termsModal } = useTermsGate();

  useEffect(() => {
    let cancelled = false;
    ApiService.request('/profile/me')
      .then((data) => {
        if (cancelled) return;
        setSuggested(data.suggested || {});
        if (data.profile) {
          setSaved(data.profile);
          setForm(fromProfile(data.profile));
        } else {
          setForm(mergeEmpty(EMPTY, data.suggested));
          setPrefilled(Object.values(data.suggested || {}).some(v => (Array.isArray(v) ? v.length : v)));
        }
      })
      .catch(() => !cancelled && setError('Профилот не можеше да се вчита.'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setLink = (k) => (e) => setForm(f => ({ ...f, links: { ...f.links, [k]: e.target.value } }));

  const fillFromCompany = () => {
    setForm(f => mergeEmpty(f, suggested));
    setSuccess('Празните полиња се пополнети од податоците за фирма.');
    setError('');
  };

  // Profiles are public → saving goes through the one-time „profile" terms.
  const save = (e) => {
    e.preventDefault();
    requireTerms('profile', doSave);
  };

  const doSave = async () => {
    setError(''); setSuccess('');
    setSaving(true);
    try {
      const data = await ApiService.put('/profile/me', form);
      setSaved(data.profile);
      setForm(fromProfile(data.profile));
      setPrefilled(false);
      setSuccess('Профилот е зачуван.');
    } catch (err) {
      setError(err?.message && !/status/i.test(err.message) ? err.message : 'Зачувувањето не успеа.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Да се избрише профилот? Можеш да направиш нов кога сакаш.')) return;
    try {
      await ApiService.delete('/profile/me');
      setSaved(null);
      setForm(mergeEmpty(EMPTY, suggested));
      setSuccess('Профилот е избришан.');
    } catch {
      setError('Бришењето не успеа.');
    }
  };

  // Live preview = the form as viewers would see it (badges come from the server).
  const preview = useMemo(() => ({
    ...form,
    links: form.links,
    badges: saved?.badges || [],
    memberSince: saved?.memberSince,
  }), [form, saved]);

  const pct = useMemo(() => {
    const checks = [
      form.displayName, form.headline, form.avatarUrl, form.city,
      form.offers.length, form.lookingFor.length,
      form.website || form.links.linkedin || form.links.facebook || form.links.instagram,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form]);

  const publicUrl = saved?.slug ? `${window.location.origin}/f/${saved.slug}` : '';

  return (
    <TerminalShell>
      <div className={styles.page}>
        <h1 className={styles.pageTitle}>Мој профил</h1>
        <p className={styles.pageSub}>
          Опционално, за 2 минути — јавна визиткарта на фирмата во мрежата на Nexa. Сè во апликацијата работи и без профил.
        </p>

        {loading ? <div className={styles.empty}>Се вчитува…</div> : (
          <div className={styles.editor}>
            <form className={styles.form} onSubmit={save}>
              {prefilled && !saved && (
                <div className={styles.notice}>
                  <span>Пополнето од податоците за фирма — провери, дополни и зачувај.</span>
                </div>
              )}
              {saved && (
                <div className={styles.notice}>
                  <span>
                    Профилот е активен.{' '}
                    <Link to={`/terminal/f/${saved.slug}`} className={styles.textLink}>Погледни го</Link>
                    {' · '}
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer" className={styles.textLink}>Јавен линк ↗</a>
                  </span>
                  <button type="button" className={styles.textLink} onClick={fillFromCompany}>Пополни празно од податоците за фирма</button>
                </div>
              )}

              <div className={styles.meter}>
                <span>Комплетност {pct}%</span>
                <span className={styles.meterBar}><span className={styles.meterFill} style={{ '--pct': `${pct}%` }} /></span>
              </div>

              <div className={styles.group}>
                <h2 className={styles.groupTitle}>Основно</h2>
                <div className={styles.row}>
                  <label className={styles.label}>Име на профилот *</label>
                  <input className={styles.input} value={form.displayName} onChange={set('displayName')} maxLength={80}
                    placeholder="пр. Пекара Здравје ДООЕЛ" />
                </div>
                <div className={styles.row}>
                  <label className={styles.label}>Што правите (една реченица)</label>
                  <input className={styles.input} value={form.headline} onChange={set('headline')} maxLength={120}
                    placeholder="пр. Свеж леб и пецива за кафулиња и хотели во Скопје" />
                </div>
                <div className={styles.row}>
                  <label className={styles.label}>Град</label>
                  <select className={styles.select} value={form.city} onChange={set('city')}>
                    <option value="">Избери град</option>
                    {MK_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    {/* Keep a prefilled/legacy value that isn't in the list selectable. */}
                    {form.city && !MK_CITIES.includes(form.city) && <option value={form.city}>{form.city}</option>}
                  </select>
                </div>
              </div>

              <div className={styles.group}>
                <h2 className={styles.groupTitle}>Слики (линкови)</h2>
                <div className={styles.row}>
                  <label className={styles.label}>Лого / слика — линк</label>
                  <input className={styles.input} value={form.avatarUrl} onChange={set('avatarUrl')} placeholder="https://…/logo.png" />
                </div>
                <div className={styles.row}>
                  <label className={styles.label}>Насловна слика — линк (опц.)</label>
                  <input className={styles.input} value={form.coverUrl} onChange={set('coverUrl')} placeholder="https://…/cover.jpg" />
                </div>
                <p className={styles.help}>
                  Залепи линк до слика (пр. од твојата веб-страница или десен клик на логото → „Copy image address").
                  Ако линкот не работи, се прикажуваат иницијалите.
                </p>
              </div>

              <div className={styles.group}>
                <h2 className={styles.groupTitle}>Нудиме и бараме</h2>
                <div className={styles.row}>
                  <label className={styles.label}>Нудиме (до 5)</label>
                  <TagInput value={form.offers} onChange={(v) => setForm(f => ({ ...f, offers: v }))} placeholder="Внеси услуга/производ и Enter" />
                </div>
                <div className={styles.row}>
                  <label className={styles.label}>Бараме (до 5)</label>
                  <TagInput value={form.lookingFor} onChange={(v) => setForm(f => ({ ...f, lookingFor: v }))} placeholder="пр. сметководител, добавувач за амбалажа" />
                </div>
                <p className={styles.help}>„Бараме" им кажува на другите фирми како можат да соработуваат со тебе.</p>
              </div>

              <div className={styles.group}>
                <h2 className={styles.groupTitle}>Контакт и линкови</h2>
                <div className={styles.row2}>
                  <div className={styles.row}>
                    <label className={styles.label}>Веб-страница</label>
                    <input className={styles.input} value={form.website} onChange={set('website')} placeholder="www.primer.mk" />
                  </div>
                  <div className={styles.row}>
                    <label className={styles.label}>Е-пошта за контакт (опц.)</label>
                    <input className={styles.input} value={form.contactEmail} onChange={set('contactEmail')} placeholder="info@primer.mk" />
                  </div>
                </div>
                <div className={styles.row2}>
                  <div className={styles.row}>
                    <label className={styles.label}>LinkedIn</label>
                    <input className={styles.input} value={form.links.linkedin} onChange={setLink('linkedin')} placeholder="linkedin.com/company/…" />
                  </div>
                  <div className={styles.row}>
                    <label className={styles.label}>Facebook</label>
                    <input className={styles.input} value={form.links.facebook} onChange={setLink('facebook')} placeholder="facebook.com/…" />
                  </div>
                </div>
                <div className={styles.row}>
                  <label className={styles.label}>Instagram</label>
                  <input className={styles.input} value={form.links.instagram} onChange={setLink('instagram')} placeholder="instagram.com/…" />
                </div>
                <p className={styles.help}>Телефон, адреса и даночен број никогаш не се прикажуваат на профилот.</p>
              </div>

              {error && <div className={styles.error}>{error}</div>}
              {success && <div className={styles.success}>{success}</div>}

              <div className={styles.actions}>
                <button type="submit" className={styles.saveBtn} disabled={saving || !form.displayName.trim()}>
                  {saving ? 'Се зачувува…' : saved ? 'Зачувај промени' : 'Зачувај профил'}
                </button>
                {saved && <button type="button" className={`${styles.textLink} ${styles.textLinkDanger}`} onClick={remove}>Избриши профил</button>}
              </div>
            </form>

            <div className={styles.previewCol}>
              <p className={styles.previewLabel}>Преглед</p>
              <ProfileCard profile={preview} preview />
            </div>
          </div>
        )}
      </div>
      {termsModal && <FeatureTermsModal {...termsModal} />}
    </TerminalShell>
  );
};

export default MyProfile;
