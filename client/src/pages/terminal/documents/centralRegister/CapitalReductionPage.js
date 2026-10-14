import React, { useEffect, useRef, useState } from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import { useAuth } from '../../../../contexts/AuthContext';
import { capitalReductionConfig, getStepFields } from '../../../../config/documents/capitalReduction';
import { extractAct } from '../../../../services/companyChangesApi';
import { usePublicMode } from '../../../../contexts/PublicModeContext';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * „Намалување на основна главнина" — Централен регистар.
 * Two-phase capital-reduction pack (чл. 261–263 ЗТД). Phase I (намера, today) +
 * Phase II (спроведување, today + 91 days) assembled into one .docx by the backend.
 */
/**
 * Step renderer — exported so the public share flow (/dokument/:token) can reuse the
 * exact same bespoke step UI as the authenticated page. ActUpload self-hides in public
 * mode (it hits an authenticated endpoint).
 */
export const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
  switch (currentStep) {
    case 1:
      return (
        <>
          <ReductionGuide />
          <ActUpload onChange={handleInputChange} disabled={isGenerating} />
          <CompanyAndManager formData={formData} onChange={handleInputChange} errors={errors} disabled={isGenerating} />
        </>
      );
    case 2:
      return <PersonList listConfig={capitalReductionConfig.shareholdersList} value={formData.shareholdersList || []} formData={formData} onChange={handleInputChange} disabled={isGenerating} />;
    case 3:
      return <PlainFields step={3} formData={formData} onChange={handleInputChange} errors={errors} disabled={isGenerating} />;
    case 4:
      return <Dates formData={formData} onChange={handleInputChange} errors={errors} disabled={isGenerating} />;
    case 5:
      return <ReviewSummary formData={formData} />;
    default:
      return null;
  }
};

export const config = capitalReductionConfig;

/** Right-panel renderer — exported for the public share flow too. */
export const renderPreview = ({ formData }) => <PackOverview formData={formData} />;

const CapitalReductionPage = () => {
  return (
    <BaseDocumentPage
      config={capitalReductionConfig}
      renderStepContent={renderStepContent}
      customPreviewComponent={renderPreview}
      title="Намалување на основна главнина"
      description="Двофазна постапка за намалување на основната главнина (чл. 261–263 ЗТД). Изберете фаза: Фаза I (намера) или Фаза II (спроведување) — се генерираат документите само за избраната фаза."
    />
  );
};

/** Parse a user-entered MKD amount ("1.500.000,00" or "1500000") to an integer. */
const parseMKD = (v) => parseInt(String(v == null ? '' : v).split(',')[0].replace(/\D/g, '') || '0', 10) || 0;
const fmtMKD = (n) => Number(n || 0).toLocaleString('de-DE') + ',00';

/**
 * Practical, law-derived intro (чл. 261–264 ЗТД): explains the two-phase procedure
 * step by step, what the user fills now, and what is intentionally left blank in
 * Phase I (the „Службен весник" number/date, known only after publication).
 */
const ReductionGuide = () => (
  <details className={styles['info-box']}>
    <summary>
      <strong>📘 Практичен водич: како функционира намалувањето (чл. 261–264 ЗТД)</strong>
    </summary>
    <p>
      Намалувањето на основната главнина е <strong>двофазна постапка</strong>. Помеѓу двете фази тече
      законски рок од <strong>најмалку 90 дена</strong> за заштита на доверителите. Затоа документите се
      генерираат <strong>фаза по фаза</strong> — изберете ја фазата горе: прво <strong>Фаза I</strong>, а
      по истекот на рокот вратете се и изберете <strong>Фаза II</strong>.
    </p>

    <p><strong>Фаза I — Намера:</strong></p>
    <ol>
      <li>Се донесува <strong>Одлука за намера</strong> за намалување (чл. 261) — во неа се определуваат обемот, целта и начинот на намалувањето.</li>
      <li>Управителот поднесува пријава во Трговскиот регистар за упис на намерата (чл. 262 ст.1).</li>
      <li>По уписот се објавува <strong>оглас во „Службен весник"</strong> и писмено се известуваат познатите доверители (чл. 262 ст.2 и 3).</li>
    </ol>

    <p><strong>Чекање — најмалку 90 дена (чл. 262 ст.2):</strong> ако во тој рок ниту еден доверител не побара исплата, се смета дека сите се согласни со намалувањето.</p>

    <p><strong>Фаза II — Спроведување (по истекот на рокот):</strong></p>
    <ol>
      <li><strong>Одлука за намалување</strong> на основната главнина (чл. 263 ст.1) — со карактер на измена на Актот.</li>
      <li><strong>Изјава на управителот</strong> за доверителите (чл. 263 ст.3) — нема пријавени / сите намирени.</li>
      <li>Пречистен текст на Актот, Одлука за измена на Актот, Книга на удели, Изјави за потписи и Полномошна.</li>
    </ol>

    <p><strong>✍️ Што пополнувате сега:</strong> друштвото, содружниците со <strong>тековниот влог</strong> (и новиот, намален, само кај соодветниот содружник), управителот, причината за намалувањето и регистрациониот агент.</p>

    <p><strong>⏳ Што намерно останува празно во Фаза I:</strong> <strong>бројот и датумот на „Службен весник"</strong> се познати дури по објавата на намерата. Ги внесувате во чекор 3 кога ќе ги имате; до тогаш во документите од Фаза II се прикажуваат како <strong>[број]</strong> / <strong>[датум]</strong> и ги дополнувате рачно.</p>

    <p><strong>⚖️ Законски прагови (чл. 261 ст.3):</strong> основната главнина не смее да падне под <strong>5.000 ЕУР</strong> во денарска противвредност; ако намалувањето е со враќање на влогови или ослободување од обврска за уплата, преостанатите влогови не смеат да паднат под <strong>2.500 ЕУР</strong> (со истовремена одлука за зголемување најмалку до 5.000 ЕУР).</p>
  </details>
);

/** Renders the plain (getStepFields) fields for a step via FormField. */
const PlainFields = ({ step, formData, onChange, errors, disabled }) => {
  const stepConfig = capitalReductionConfig.steps.find((s) => s.id === step);
  const fields = getStepFields(step);
  return (
    <div className={styles['form-section']}>
      <h3>{stepConfig.title}</h3>
      {stepConfig.description && <p>{stepConfig.description}</p>}
      {fields.map((field) => (
        <FormField key={field.name} field={field} value={formData[field.name]} onChange={onChange} error={errors[field.name]} disabled={disabled} formData={formData} />
      ))}
    </div>
  );
};

/**
 * Normalizes an extracted shareholder to our list shape. The act carries the
 * CURRENT влог (in денари) — prefill both current and new from it (new defaults to
 * unchanged; the user lowers it only for the owner(s) whose stake is reduced).
 */
const normalizeShareholder = (s) => {
  const current = String(s.contributionMKD || '').replace(/\D/g, '');
  return {
    entityType: s.entityType === 'legal' ? 'legal' : 'physical',
    name: s.name || '',
    isForeign: s.isForeign === 'да' || s.isForeign === true ? 'да' : 'не',
    citizenship: s.citizenship || '',
    address: s.address || '',
    idType: s.idType || (s.isForeign === 'да' ? 'пасош' : 'ЕМБГ'),
    idNumber: s.idNumber || '',
    currentContributionMKD: current,
    newContributionMKD: current
  };
};

/**
 * Step 1 — „Прикачи постоен акт" (drag & drop). Uploads the company's real Акт за
 * основање (.docx), extracts a structured snapshot via AI and prefills the form
 * (company identity + shareholders + manager). All values stay editable; the user
 * fills the MKD влогови (not present in the act). Mirrors the companyChanges upload.
 */
const ActUpload = ({ onChange, disabled }) => {
  const isPublic = usePublicMode();
  const [mode, setMode] = useState(null);       // null | 'upload' | 'standard'
  const [status, setStatus] = useState('idle');  // idle | loading | done | error
  const [error, setError] = useState('');
  const [filledCount, setFilledCount] = useState(0);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  // The act extractor hits an authenticated endpoint — not available to public visitors.
  if (isPublic) return null;

  const COMPANY_SCALARS = ['companyFullName', 'companyShortName', 'companyAddress', 'companyEMBS', 'companyEDB', 'companyActivityCode', 'companyActivityText'];

  const applyExtracted = (ex) => {
    const c = ex.company || {};
    let count = 0;
    if (ex.companyForm) onChange('companyForm', ex.companyForm);
    COMPANY_SCALARS.forEach((k) => { if (c[k]) { onChange(k, c[k]); count += 1; } });
    if (Array.isArray(ex.shareholders) && ex.shareholders.length) {
      onChange('shareholdersList', ex.shareholders.map(normalizeShareholder));
      count += 1;
    }
    const mgr = Array.isArray(ex.managers) && ex.managers[0];
    if (mgr) {
      onChange('managerName', mgr.name || '');
      onChange('managerAddress', mgr.address || '');
      onChange('managerForeign', mgr.isForeign === 'да' ? 'да' : 'не');
      onChange('managerCitizenship', mgr.citizenship || '');
      onChange('managerIdNumber', mgr.idNumber || '');
      count += 1;
    }
    setFilledCount(count);
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setStatus('error'); setError('Поддржани се само .docx датотеки.');
      return;
    }
    setStatus('loading'); setError('');
    try {
      const { extracted } = await extractAct(file);
      applyExtracted(extracted);
      setStatus('done');
    } catch (err) {
      setError(err.message || 'Грешка при обработка.'); setStatus('error');
    }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    if (disabled) return;
    const f = e.dataTransfer?.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <div className={styles['form-section']}>
      <h3>Како сакате да започнете?</h3>
      <div className={styles['radio-group']}>
        <div className={styles['radio-option']}>
          <input type="radio" id="cr_mode_upload" name="crActMode" checked={mode === 'upload'} onChange={() => setMode('upload')} disabled={disabled} />
          <label htmlFor="cr_mode_upload" className={styles['radio-label']}>
            <div className={styles['radio-content']}>
              <strong>📄 Прикачи постоен акт</strong>
              <div className={styles['radio-description']}>Прикачете го реалниот Акт за основање (.docx) — системот ги пополнува друштвото, содружниците и управителот автоматски.</div>
            </div>
          </label>
        </div>
        <div className={styles['radio-option']}>
          <input type="radio" id="cr_mode_standard" name="crActMode" checked={mode === 'standard'} onChange={() => setMode('standard')} disabled={disabled} />
          <label htmlFor="cr_mode_standard" className={styles['radio-label']}>
            <div className={styles['radio-content']}>
              <strong>📝 Стандарден образец</strong>
              <div className={styles['radio-description']}>Внесете ги податоците рачно користејќи го стандардниот образец.</div>
            </div>
          </label>
        </div>
      </div>

      {mode === 'upload' && (
        <div className={styles['form-group']}>
          <div
            className={`${styles['drop-zone']} ${drag ? styles.active : ''}`}
            onDragOver={(e) => { e.preventDefault(); if (!disabled) setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            onClick={() => !disabled && status !== 'loading' && inputRef.current && inputRef.current.click()}
            role="button"
            tabIndex={0}
          >
            {status === 'loading'
              ? '⏳ Се анализира документот...'
              : '⬆️ Довлечете го Актот за основање (.docx) тука, или кликнете за да изберете датотека.'}
          </div>
          <input ref={inputRef} type="file" accept=".docx" hidden onChange={(e) => handleFile(e.target.files && e.target.files[0])} disabled={disabled || status === 'loading'} />
          {status === 'error' && <span className={styles['error-message']}>{error}</span>}
          {status === 'done' && (
            <p>✅ Податоците се извлечени и пополнети ({filledCount} групи полиња). Влоговите (МКД) се преземени од актот каде се наведени — во чекор 2 намалете го само новиот влог на соодветниот содружник. Сите вредности се менливи.</p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Step 1 — company identity + manager fields. Prefills from the active company
 * source: the user's own company by default, or the selected client (Pro) — so a
 * lawyer can draft for a client. Re-prefills when the client selection changes.
 */
const CompanyAndManager = ({ formData, onChange, errors, disabled }) => {
  const { currentUser } = useAuth();
  const prevClient = useRef(undefined);

  useEffect(() => {
    const cid = formData.clientId || '';
    const seedFromOwn = (guard) => {
      const ci = currentUser?.companyInfo || {};
      const set = (name, val) => { if (val && (!guard || !formData[name])) onChange(name, val); };
      set('companyFullName', ci.companyName);
      set('companyShortName', ci.companyName);
      set('companyAddress', ci.companyAddress || ci.address);
      set('companyEDB', ci.companyTaxNumber || ci.taxNumber);
      set('managerName', ci.companyManager || ci.manager || ci.role);
    };
    // Map the generic fields the client selector just populated into our fields.
    const mapFromClient = () => {
      onChange('companyFullName', formData.companyName || '');
      onChange('companyShortName', formData.companyName || '');
      onChange('companyEDB', formData.companyTaxNumber || '');
      onChange('managerName', formData.companyManager || '');
      onChange('companyEMBS', '');            // client-specific — not stored, user enters it
      // companyAddress is already set by the shared client selector (same field name)
    };

    if (prevClient.current === undefined) {
      // Initial mount: seed from own company only if empty (don't clobber a resumed draft).
      prevClient.current = cid;
      if (!cid) seedFromOwn(true);
      else mapFromClient();
      return;
    }
    if (cid === prevClient.current) return;
    prevClient.current = cid;
    if (cid) mapFromClient();     // switched to a client → prefill from it
    else seedFromOwn(false);      // back to „Мојата фирма" → re-seed own company
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.clientId]);

  return <PlainFields step={1} formData={formData} onChange={onChange} errors={errors} disabled={disabled} />;
};

/** Step 4 — agent + date; seeds the active phase's date to today. */
const Dates = ({ formData, onChange, errors, disabled }) => {
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if ((formData.phase || '1') === '2') { if (!formData.phase2Date) onChange('phase2Date', today); }
    else if (!formData.phase1Date) { onChange('phase1Date', today); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.phase]);
  return <PlainFields step={4} formData={formData} onChange={onChange} errors={errors} disabled={disabled} />;
};

/**
 * Repeating shareholders list. Supports text/select columns; a column with
 * `condition(item, formData)` is hidden when it returns false.
 */
const PersonList = ({ listConfig, value, formData, onChange, disabled }) => {
  const items = value || [];
  const update = (index, field, fieldValue) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: fieldValue };
    onChange(listConfig.name, next);
  };
  const addItem = () => {
    const blank = {};
    listConfig.arrayFields.forEach((f) => { blank[f.name] = f.type === 'select' && f.options?.length ? f.options[0].value : ''; });
    onChange(listConfig.name, [...items, blank]);
  };
  const removeItem = (index) => onChange(listConfig.name, items.filter((_, i) => i !== index));

  // Running totals so the user sees the derived reduction as they type.
  const totalCurrent = items.reduce((a, s) => a + parseMKD(s.currentContributionMKD), 0);
  const totalNew = items.reduce((a, s) => a + parseMKD(s.newContributionMKD), 0);
  const reduction = Math.max(totalCurrent - totalNew, 0);

  return (
    <div className={styles['form-section']}>
      <h3>{listConfig.label}</h3>
      {listConfig.helpText && <p>{listConfig.helpText}</p>}

      <div className={styles['shareholders-list']}>
        {items.map((item, index) => (
          <div key={index} className={styles['shareholder-row']}>
            <div className={styles['shareholder-number']}>{index + 1}</div>
            <div className={styles['shareholder-fields']}>
              {listConfig.arrayFields.map((field) => {
                if (field.condition && !field.condition(item, formData)) return null;
                const id = `${listConfig.name}_${field.name}_${index}`;
                return (
                  <div key={field.name} className={styles['form-group']}>
                    <label htmlFor={id}>
                      {field.label}
                      {field.helpText && <span className={styles['help-tooltip']} data-tooltip={field.helpText}>❓</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select id={id} value={item[field.name] || ''} onChange={(e) => update(index, field.name, e.target.value)} disabled={disabled}>
                        {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <input type="text" id={id} inputMode={field.inputMode} placeholder={field.placeholder} value={item[field.name] || ''} onChange={(e) => update(index, field.name, e.target.value)} disabled={disabled} maxLength={field.maxLength} />
                    )}
                  </div>
                );
              })}
            </div>
            {!disabled && (
              <button type="button" onClick={() => removeItem(index)} className={styles['remove-btn']} title="Отстрани">✕</button>
            )}
          </div>
        ))}

        {!disabled && (
          <button type="button" onClick={addItem} className={styles['add-btn']}>{listConfig.addLabel || '+ Додади'}</button>
        )}
      </div>

      {items.length > 0 && (
        <div className={styles['info-box']}>
          <p>Тековна основна главнина: <strong>{fmtMKD(totalCurrent)} денари</strong></p>
          <p>Нова основна главнина: <strong>{fmtMKD(totalNew)} денари</strong></p>
          <p>Намалување: <strong>{fmtMKD(reduction)} денари</strong></p>
          {totalNew >= totalCurrent && <p className={styles['error-message']}>⚠️ Новата главнина мора да биде помала од тековната.</p>}
        </div>
      )}
    </div>
  );
};

/** Computes the document list for the CHOSEN phase (mirrors backend assembleChildren). */
const computePackDocs = (formData) => {
  const phase = formData.phase === '2' ? 2 : 1;
  const shareholders = (formData.shareholdersList || []).filter((s) => s && s.name);
  const isDooel = (formData.companyForm || 'doo') === 'dooel';

  // Signatories: shareholders + manager (deduped).
  const names = new Map();
  shareholders.forEach((s) => s.name && names.set(s.name.trim().toLowerCase(), s.name.trim()));
  if (formData.managerName) names.set(formData.managerName.trim().toLowerCase(), formData.managerName.trim());
  const signatories = Array.from(names.values());

  const docs = [];
  if (phase === 1) {
    docs.push('Одлука за намера за намалување на основната главнина');
    signatories.forEach((n) => docs.push(`Изјава за потписи (чл. 7) — ${n}`));
    signatories.forEach((n) => docs.push(`Полномошно — ${n}`));
  } else {
    docs.push('Одлука за намалување на основната главнина');
    docs.push('Изјава (Управител) по чл. 263 ст.3 (доверители)');
    docs.push('Изјава по член 32');
    docs.push(isDooel ? 'Изјава за основање — пречистен текст' : 'Договор за основање — пречистен текст');
    docs.push('Одлука за измена на Актот за основање (чл. 252/253)');
    docs.push('Книга на удели');
    signatories.forEach((n) => docs.push(`Изјава за потписи (чл. 7) — ${n}`));
    signatories.forEach((n) => docs.push(`Полномошно — ${n}`));
  }
  return { phase, docs };
};

const fmtDate = (iso) => { const d = iso ? new Date(iso) : null; return d && !isNaN(d) ? d.toLocaleDateString('mk-MK') : ''; };
const phaseLabel = (phase) => (phase === 1 ? 'Фаза I — Намера' : 'Фаза II — Спроведување');

/** Step 5 — review of the documents for the chosen phase. */
const ReviewSummary = ({ formData }) => {
  const stepConfig = capitalReductionConfig.steps.find((s) => s.id === 5);
  const { phase, docs } = computePackDocs(formData);
  const dateStr = fmtDate(phase === 2 ? formData.phase2Date : formData.phase1Date);

  return (
    <div className={styles['form-section']}>
      <h3>{stepConfig.title}</h3>
      {stepConfig.description && <p>{stepConfig.description}</p>}

      <p>ℹ️ Намалувањето е двофазна постапка. {phase === 1
        ? 'Сега ги генерирате документите за Фаза I (намера). По истекот на законскиот рок (најмалку 90 дена од објавата), вратете се и изберете Фаза II.'
        : 'Ги генерирате документите за Фаза II (спроведување) — по истекот на рокот за доверители од Фаза I.'}</p>

      <p><strong>{phaseLabel(phase)} {dateStr ? `(${dateStr})` : ''} — {docs.length} документи:</strong></p>
      <ol>{docs.map((d, i) => <li key={i}>{d}</li>)}</ol>

      <p>Сите документи се составуваат во еден .docx фајл, секој на нова страница.</p>
    </div>
  );
};

/** Right panel — document list for the chosen phase (replaces the live preview). */
const PackOverview = ({ formData }) => {
  const shareholders = (formData.shareholdersList || []).filter((s) => s && s.name);
  const { phase, docs } = computePackDocs(formData);
  const dateStr = fmtDate(phase === 2 ? formData.phase2Date : formData.phase1Date);
  return (
    <div className={styles['preview-changes']}>
      <h3>Документи — {phaseLabel(phase)}</h3>
      {shareholders.length === 0 ? (
        <p>Внесете ги содружниците за да го видите списокот документи.</p>
      ) : (
        <>
          <div className={styles['compare-label']}>{phaseLabel(phase)} {dateStr ? `· ${dateStr}` : ''}</div>
          <ol className={styles['preview-changes-list']}>{docs.map((d, i) => <li key={i}>{d}</li>)}</ol>
        </>
      )}
      <p className={styles['preview-hint']}>Документите се составуваат во еден .docx фајл, секој на нова страница.</p>
    </div>
  );
};

export default CapitalReductionPage;
