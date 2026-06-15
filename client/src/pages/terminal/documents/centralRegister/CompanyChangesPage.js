import React, { useEffect, useState } from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import { useAuth } from '../../../../contexts/AuthContext';
import { companyChangesConfig, getStepFields, CHANGE_OPTIONS } from '../../../../config/documents/companyChanges';
import { extractAct, amendActDownload } from '../../../../services/companyChangesApi';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * „Промени во фирма" — Централен регистар.
 * Dynamic document package: choose changes → enter company/people → fill
 * per-change fields → agent/general → review. See config for the data model.
 */
const CompanyChangesPage = () => {
  const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
    switch (currentStep) {
      case 1:
        return <Step1 formData={formData} onChange={handleInputChange} disabled={isGenerating} />;
      case 2:
        return <CompanyAndPeople formData={formData} onChange={handleInputChange} errors={errors} disabled={isGenerating} />;
      case 3:
        return <ChangeWizardCurrent formData={formData} onChange={handleInputChange} disabled={isGenerating} />;
      case 4:
        return <PlainFields step={4} formData={formData} onChange={handleInputChange} errors={errors} disabled={isGenerating} />;
      case 5:
        return <ReviewSummary formData={formData} />;
      default:
        return null;
    }
  };

  // Right panel: a „Тековно → Ново" view instead of a rendered live preview.
  // On the per-change step it hosts the NEW-data inputs; elsewhere it shows a
  // running before/after overview of all selected changes.
  const renderPreview = ({ formData, currentStep, onChange }) => (
    <CompanyChangesPreview formData={formData} currentStep={currentStep} onChange={onChange} />
  );

  return (
    <BaseDocumentPage
      config={companyChangesConfig}
      renderStepContent={renderStepContent}
      customPreviewComponent={renderPreview}
      title="Промени во фирма"
      description="Пакет документи за упис на промени на основните податоци на друштвото во Трговскiот регистар при Централниот регистар на РСМ."
    />
  );
};

/**
 * Ordered selected changes (canonical module order), used by both the left
 * step (current data) and the right panel (new-data inputs).
 */
const MODULE_ORDER = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'];
const MODULE_LABEL = {
  M1: 'Назив', M2: 'Седиште', M3: 'Лични податоци',
  M4: 'Управител', M5: 'Пренос на удел', M6: 'Уплата на влог', M7: 'Подружница'
};

const selectedModules = (formData) => {
  const changes = Array.isArray(formData.changes) ? formData.changes : [];
  return MODULE_ORDER.filter((m) => changes.includes(m));
};

/**
 * Per-module field layout. Both columns are editable inputs:
 *  - `top`     full-width shared selectors that gate the rest (rendered above current)
 *  - `current` left column — current/registered values (prefilled, editable)
 *  - `next`    right column — new values (empty, the user fills them in)
 * (M5 is rendered by dedicated components — see M5Current / M5New.)
 */
const MODULE_PANELS = {
  M1: { current: ['companyFullName', 'companyShortName', 'companyForeignName'], next: ['newCompanyFullName', 'newCompanyShortName', 'newCompanyForeignName'] },
  M2: { current: ['companyAddress'], next: ['newSeatAddress', 'seatDecisionNumber'] },
  M3: { top: ['m3Capacity', 'm3SubjectName'], current: ['m3OldData'], next: ['m3NewData'] },
  M4: { top: ['m4ChangeType'], current: ['m4DismissedName'], next: ['m4NewManagerName', 'm4NewManagerForeign', 'm4NewManagerCitizenship', 'm4NewManagerAddress', 'm4NewManagerIdNumber', 'm4Mandate', 'm4MandateUntil', 'm4Powers', 'm4PowersText'] },
  M6: { current: ['companyCapitalEUR', 'companyContributionType'], next: ['m6AmountEUR', 'm6AmountMKD'] },
  M7: { top: ['m7Action', 'branchFullName', 'branchSubNumber'], current: ['m7OldBranchAddress', 'm7DismissedHeadName'], next: ['m7NewBranchAddress', 'm7NewHeadName'] }
};

/** Renders a list of config fields via FormField (conditions self-hide). */
const renderFields = (names, formData, onChange) =>
  (names || []).map((name) => {
    const field = companyChangesConfig.fields[name];
    if (!field) return null;
    return (
      <FormField key={name} field={field} value={formData[name]} onChange={onChange} formData={formData} />
    );
  });

const findPerson = (fd, name) => {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  const all = [...(fd.shareholdersList || []), ...(fd.managersList || [])];
  return all.find((p) => (p.name || '').trim().toLowerCase() === key) || null;
};

const personSummary = (p) => {
  if (!p || !p.name) return '—';
  const id = p.idNumber ? `, ${p.idType || 'ЕМБГ'} ${p.idNumber}` : '';
  const addr = p.address ? `, ${p.address}` : '';
  return `${p.name}${addr}${id}`;
};

/** Renders the plain (getStepFields) fields for a step via FormField. */
const PlainFields = ({ step, formData, onChange, errors, disabled }) => {
  const stepConfig = companyChangesConfig.steps.find((s) => s.id === step);
  const fields = getStepFields(step);
  return (
    <div className={styles['form-section']}>
      <h3>{stepConfig.title}</h3>
      {stepConfig.description && <p>{stepConfig.description}</p>}
      {fields.map((field) => (
        <FormField
          key={field.name}
          field={field}
          value={formData[field.name]}
          onChange={onChange}
          error={errors[field.name]}
          disabled={disabled}
          formData={formData}
        />
      ))}
    </div>
  );
};

/** Step 1 — start mode (upload act / standard) + change selection. */
const Step1 = ({ formData, onChange, disabled }) => {
  const { currentUser } = useAuth();
  return (
    <>
      <ActUpload onChange={onChange} currentUser={currentUser} disabled={disabled} />
      <ChangeSelector formData={formData} onChange={onChange} disabled={disabled} />
    </>
  );
};

const COMPANY_SCALARS = [
  'companyFullName', 'companyShortName', 'companyForeignName', 'companyAddress',
  'companyEMBS', 'companyEDB', 'companyCapitalEUR', 'companyContributionType',
  'companyActivityCode', 'companyActivityText'
];

const normalizePerson = (p, isShareholder) => ({
  name: p.name || '',
  entityType: p.entityType === 'legal' ? 'legal' : 'physical',
  isForeign: p.isForeign === 'да' || p.isForeign === true ? 'да' : 'не',
  citizenship: p.citizenship || '',
  address: p.address || '',
  idType: p.idType || (p.isForeign === 'да' ? 'пасош' : 'ЕМБГ'),
  idNumber: p.idNumber || '',
  ...(isShareholder ? { sharePercent: p.sharePercent || '', isAlsoManager: p.isAlsoManager === 'да' ? 'да' : 'не' } : {})
});

/**
 * Step 1 — „Прикачи постоен акт" mode. Uploads the user's real incorporation act,
 * extracts a structured snapshot via AI, auto-fills the form (editable values),
 * and reconciles conflicts against the verified company profile.
 */
const ActUpload = ({ onChange, currentUser, disabled }) => {
  const [mode, setMode] = useState(null); // null | 'upload' | 'standard'
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [error, setError] = useState('');
  const [conflicts, setConflicts] = useState([]);
  const [filledCount, setFilledCount] = useState(0);

  const ci = currentUser?.companyInfo || {};

  const applyExtracted = (ex) => {
    const c = ex.company || {};
    let count = 0;
    if (ex.companyForm) onChange('companyForm', ex.companyForm);
    COMPANY_SCALARS.forEach((k) => {
      if (c[k]) { onChange(k, c[k]); count += 1; }
    });
    if (Array.isArray(ex.shareholders) && ex.shareholders.length) {
      onChange('shareholdersList', ex.shareholders.map((s) => normalizePerson(s, true)));
      count += 1;
    }
    if (Array.isArray(ex.managers) && ex.managers.length) {
      onChange('managersList', ex.managers.map((m) => normalizePerson(m, false)));
      count += 1;
    }
    onChange('_actExtracted', true); // Phase 2 will carry the act server-side for in-place amendment
    setFilledCount(count);

    // Reconcile conflicts: extracted (current value, now in formData) vs profile.
    const profileFull = ci.companyName || '';
    const profileAddr = ci.companyAddress || ci.address || '';
    const profileEdb = ci.companyTaxNumber || ci.taxNumber || '';
    const rows = [];
    const addConflict = (field, label, actVal, profileVal, sensitive) => {
      if (actVal && profileVal && actVal.trim() !== profileVal.trim()) {
        rows.push({ field, label, actVal, profileVal, sensitive });
      }
    };
    addConflict('companyFullName', 'Назив на друштвото', c.companyFullName, profileFull);
    addConflict('companyAddress', 'Адреса на седиште', c.companyAddress, profileAddr);
    addConflict('companyEDB', 'ЕДБ (даночен број)', c.companyEDB, profileEdb, true);
    setConflicts(rows);
  };

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setStatus('loading');
    setError('');
    try {
      const { extracted, actId } = await extractAct(file);
      applyExtracted(extracted);
      if (actId) { onChange('_actId', actId); onChange('_uploadMode', true); }
      setStatus('done');
    } catch (err) {
      setError(err.message || 'Грешка при обработка.');
      setStatus('error');
    }
  };

  const chooseConflict = (field, value) => onChange(field, value);

  return (
    <div className={styles['form-section']}>
      <h3>Како сакате да започнете?</h3>
      <div className={styles['radio-group']}>
        <div className={styles['radio-option']}>
          <input type="radio" id="mode_upload" name="actMode" checked={mode === 'upload'}
            onChange={() => setMode('upload')} disabled={disabled} />
          <label htmlFor="mode_upload" className={styles['radio-label']}>
            <div className={styles['radio-content']}>
              <strong>📄 Прикачи постоен акт</strong>
              <div className={styles['radio-description']}>
                Прикачете го вашиот реален Акт за основање (.docx) — системот ги пополнува полињата автоматски.
              </div>
            </div>
          </label>
        </div>
        <div className={styles['radio-option']}>
          <input type="radio" id="mode_standard" name="actMode" checked={mode === 'standard'}
            onChange={() => setMode('standard')} disabled={disabled} />
          <label htmlFor="mode_standard" className={styles['radio-label']}>
            <div className={styles['radio-content']}>
              <strong>📝 Стандарден образец</strong>
              <div className={styles['radio-description']}>
                Внесете ги податоците рачно користејќи го стандардниот образец.
              </div>
            </div>
          </label>
        </div>
      </div>

      {mode === 'upload' && (
        <div className={styles['form-group']}>
          <label htmlFor="actFile">Акт за основање (.docx)</label>
          <input type="file" id="actFile" accept=".docx" onChange={handleFile} disabled={disabled || status === 'loading'} />
          {status === 'loading' && <p>⏳ Се анализира документот...</p>}
          {status === 'error' && <span className={styles['error-message']}>{error}</span>}
          {status === 'done' && (
            <p>✅ Податоците се извлечени и пополнети ({filledCount} полиња). Проверете ги во следните чекори — сите вредности се менливи.</p>
          )}
        </div>
      )}

      {conflicts.length > 0 && (
        <div className={styles['info-box']}>
          <strong>⚠️ Различни податоци — потврдете што е точно</strong>
          <p>Овие податоци се разликуваат меѓу вашиот профил и прикачениот акт. Ова е разлика во ТЕКОВНИТЕ податоци (не е промената што ја правите). Изберете ја точната вредност:</p>
          {conflicts.map((cf) => (
            <div key={cf.field} className={styles['form-group']}>
              <label>{cf.label}{cf.sensitive && ' ⚠️'}</label>
              <div className={styles['radio-option']}>
                <input type="radio" id={`cf_${cf.field}_act`} name={`cf_${cf.field}`} defaultChecked
                  onChange={() => chooseConflict(cf.field, cf.actVal)} disabled={disabled} />
                <label htmlFor={`cf_${cf.field}_act`}>📄 Од актот: {cf.actVal}</label>
              </div>
              <div className={styles['radio-option']}>
                <input type="radio" id={`cf_${cf.field}_profile`} name={`cf_${cf.field}`}
                  onChange={() => chooseConflict(cf.field, cf.profileVal)} disabled={disabled} />
                <label htmlFor={`cf_${cf.field}_profile`}>👤 Од профил: {cf.profileVal}</label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** Step 1 — checkbox group writing the selected modules into formData.changes. */
const ChangeSelector = ({ formData, onChange, disabled }) => {
  const stepConfig = companyChangesConfig.steps.find((s) => s.id === 1);
  const selected = Array.isArray(formData.changes) ? formData.changes : [];

  const toggle = (value, checked) => {
    const next = checked ? [...selected, value] : selected.filter((v) => v !== value);
    onChange('changes', next);
  };

  return (
    <div className={styles['form-section']}>
      <h3>{stepConfig.title}</h3>
      {stepConfig.description && <p>{stepConfig.description}</p>}

      {CHANGE_OPTIONS.map((opt) => (
        <div key={opt.value} className={styles['checkbox-group']}>
          <input
            type="checkbox"
            id={`change_${opt.value}`}
            checked={selected.includes(opt.value)}
            onChange={(e) => toggle(opt.value, e.target.checked)}
            disabled={disabled || opt.disabled}
          />
          <label htmlFor={`change_${opt.value}`}>
            {opt.label}
            {opt.helpText && (
              <span className={styles['help-tooltip']} data-tooltip={opt.helpText}>❓</span>
            )}
          </label>
        </div>
      ))}
    </div>
  );
};

/** Step 2 — company identity (prefilled from profile) + shareholder/manager lists. */
const CompanyAndPeople = ({ formData, onChange, errors, disabled }) => {
  const { currentUser } = useAuth();

  // Seed company identity from the verified profile (editable suggested values).
  useEffect(() => {
    const ci = currentUser?.companyInfo || {};
    const seed = (name, val) => { if (val && !formData[name]) onChange(name, val); };
    seed('companyFullName', ci.companyName);
    seed('companyShortName', ci.companyName);
    seed('companyAddress', ci.companyAddress || ci.address);
    seed('companyEDB', ci.companyTaxNumber || ci.taxNumber);
    seed('companyManager', ci.companyManager || ci.manager || ci.role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stepConfig = companyChangesConfig.steps.find((s) => s.id === 2);
  const fields = getStepFields(2);

  return (
    <div className={styles['form-section']}>
      <h3>{stepConfig.title}</h3>
      {stepConfig.description && <p>{stepConfig.description}</p>}

      {fields.map((field) => (
        <FormField
          key={field.name}
          field={field}
          value={formData[field.name]}
          onChange={onChange}
          error={errors[field.name]}
          disabled={disabled}
          formData={formData}
        />
      ))}

      <PersonList
        listKey="shareholdersList"
        listConfig={companyChangesConfig.shareholdersList}
        value={formData.shareholdersList || []}
        onChange={onChange}
        disabled={disabled}
      />

      <PersonList
        listKey="managersList"
        listConfig={companyChangesConfig.managersList}
        value={formData.managersList || []}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
};

/**
 * Step 3 (LEFT panel) — per-change sub-wizard. Renders the change chips + nav and
 * the CURRENT (registered) values as EDITABLE inputs (prefilled from profile/act).
 * The NEW-data inputs live in the right panel (CompanyChangesPreview), keyed to the
 * same active index (formData._changeStep).
 */
const ChangeWizardCurrent = ({ formData, onChange, disabled }) => {
  const stepConfig = companyChangesConfig.steps.find((s) => s.id === 3);
  const modules = selectedModules(formData);
  const active = Math.min(Number(formData._changeStep) || 0, Math.max(modules.length - 1, 0));
  const module = modules[active];

  // Keep the stored index in range when the selection changes.
  useEffect(() => {
    if ((Number(formData._changeStep) || 0) !== active) onChange('_changeStep', active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, modules.length]);

  if (modules.length === 0) {
    return (
      <div className={styles['form-section']}>
        <h3>{stepConfig.title}</h3>
        <p>Прво изберете промени во првиот чекор.</p>
      </div>
    );
  }

  const panel = MODULE_PANELS[module] || {};

  return (
    <div className={styles['form-section']}>
      <h3>{stepConfig.title}</h3>
      <p>Промена {active + 1} од {modules.length}. Лево се тековните податоци (преземени од профил/акт — менливи), десно ги внесувате новите.</p>

      {/* Change chips — each selected change is its own step. */}
      <div className={styles['change-chips']}>
        {modules.map((m, i) => (
          <button
            key={m}
            type="button"
            disabled={disabled}
            className={`${styles['change-chip']} ${i === active ? styles['change-chip-active'] : ''}`}
            onClick={() => onChange('_changeStep', i)}
          >
            {i + 1}. {MODULE_LABEL[m]}
          </button>
        ))}
      </div>

      {/* Shared selectors that gate the two columns (e.g. вид на промена). */}
      {renderFields(panel.top, formData, onChange)}

      <div className={styles['compare-current']}>
        <div className={styles['compare-label']}>Тековно (регистрирано) · менливо</div>
        <h4>{MODULE_LABEL[module]}</h4>
        {module === 'M5'
          ? <M5Current formData={formData} onChange={onChange} />
          : renderFields(panel.current, formData, onChange)}
      </div>

      {/* In-wizard navigation between changes. */}
      <div className={styles['change-nav']}>
        <button
          type="button"
          disabled={disabled || active === 0}
          className={`${styles.btn} ${styles['prev-btn']}`}
          onClick={() => onChange('_changeStep', active - 1)}
        >
          ← Претходна промена
        </button>
        <button
          type="button"
          disabled={disabled || active >= modules.length - 1}
          className={`${styles.btn} ${styles['next-btn']}`}
          onClick={() => onChange('_changeStep', active + 1)}
        >
          Следна промена →
        </button>
      </div>
    </div>
  );
};

/**
 * Right panel — replaces the live document preview with the NEW-data inputs for the
 * active change (Step 3); on the other steps it shows an overview of all changes.
 */
const CompanyChangesPreview = ({ formData, currentStep, onChange }) => {
  const modules = selectedModules(formData);

  if (currentStep !== 3) {
    return (
      <div className={styles['preview-changes']}>
        <h3>Преглед на промените</h3>
        {modules.length === 0 ? (
          <p>Изберете промени во првиот чекор за да го видите прегледот.</p>
        ) : (
          <ol className={styles['preview-changes-list']}>
            {modules.map((m) => <li key={m}>{MODULE_LABEL[m]}</li>)}
          </ol>
        )}
        {currentStep < 3 && <p className={styles['preview-hint']}>Новите податоци по промена ги внесувате во чекорот „Полиња по промена".</p>}
      </div>
    );
  }

  const active = Math.min(Number(formData._changeStep) || 0, Math.max(modules.length - 1, 0));
  const module = modules[active];
  if (!module) {
    return (
      <div className={styles['preview-changes']}>
        <h3>Нови податоци</h3>
        <p>Прво изберете промени во првиот чекор.</p>
      </div>
    );
  }

  const panel = MODULE_PANELS[module] || {};

  return (
    <div className={styles['preview-changes']}>
      <div className={styles['compare-label']}>Ново (по промената) · {MODULE_LABEL[module]}</div>
      {module === 'M5'
        ? <M5New formData={formData} onChange={onChange} />
        : renderFields(panel.next, formData, onChange)}
    </div>
  );
};

/**
 * M5 (пренос на удел) — split across the two columns.
 *  LEFT (M5Current):  the transferor (current owner) + how much is leaving.
 *  RIGHT (M5New):     the transferee (new owner) + compensation terms.
 * The transferor is SELECTED from the entered shareholders (no free-text matching);
 * the sole owner is auto-selected for ДООЕЛ. When the transferor's identity can't be
 * resolved from the list, inline fallback inputs appear so address/ЕМБГ never leak.
 */
const M5_CURRENT_FIELDS = ['m5TransferorWithdraws', 'm5TransferScope', 'm5PartialPercent', 'm5TransferAmountEUR', 'm5TotalCapitalEUR'];
const M5_NEW_FIELDS = [
  'm5TransfereeName', 'm5TransfereeIsNew', 'm5TransfereeForeign', 'm5TransfereeCitizenship',
  'm5TransfereeAddress', 'm5TransfereeIdType', 'm5TransfereeIdNumber', 'm5TransfereeIsManager',
  'm5WithCompensation', 'm5Price', 'm5Currency', 'm5PaymentTerms'
];
const M5_TRANSFEROR_FALLBACK = ['m5TransferorForeign', 'm5TransferorCitizenship', 'm5TransferorAddress', 'm5TransferorIdType', 'm5TransferorIdNumber'];

const M5Current = ({ formData, onChange }) => {
  const shareholders = (formData.shareholdersList || []).filter((s) => s && s.name);
  const noList = shareholders.length === 0;
  const manual = noList || formData.m5TransferorManual === 'да';

  // Auto-select the sole owner; seed amount/total capital from the company capital.
  useEffect(() => {
    if (!manual && !formData.m5TransferorName && shareholders.length === 1) onChange('m5TransferorName', shareholders[0].name);
    if (!formData.m5TransferAmountEUR && formData.companyCapitalEUR) onChange('m5TransferAmountEUR', formData.companyCapitalEUR);
    if (!formData.m5TotalCapitalEUR && formData.companyCapitalEUR) onChange('m5TotalCapitalEUR', formData.companyCapitalEUR);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareholders.length]);

  const transferor = findPerson(formData, formData.m5TransferorName);
  const resolved = !manual && transferor && transferor.address && transferor.idNumber;
  const showFallback = manual || (formData.m5TransferorName && !resolved);

  const handleSelect = (val) => {
    if (val === '__manual__') {
      onChange('m5TransferorManual', 'да');
      onChange('m5TransferorName', '');
    } else {
      onChange('m5TransferorManual', 'не');
      onChange('m5TransferorName', val);
    }
  };

  return (
    <>
      <div className={styles['form-group']}>
        <label htmlFor={manual ? 'm5TransferorName' : 'm5TransferorSelect'}>
          Отстапувач (содружникот кој го отстапува уделот)
          <span className={styles['help-tooltip']} data-tooltip="Изберете го содружникот кој го отстапува уделот, или внесете го рачно ако не е во листата. Кај ДООЕЛ единствениот содружник е автоматски избран.">❓</span>
        </label>

        {!noList && (
          <select
            id="m5TransferorSelect"
            value={manual ? '__manual__' : (formData.m5TransferorName || '')}
            onChange={(e) => handleSelect(e.target.value)}
          >
            <option value="">Изберете содружник…</option>
            {shareholders.map((s, i) => (
              <option key={i} value={s.name}>{s.name}{s.sharePercent ? ` (${s.sharePercent}%)` : ''}</option>
            ))}
            <option value="__manual__">➕ Друго лице (внеси рачно)…</option>
          </select>
        )}

        {manual && (
          <input
            type="text"
            id="m5TransferorName"
            placeholder="пр. Марко Марковски"
            value={formData.m5TransferorName || ''}
            onChange={(e) => onChange('m5TransferorName', e.target.value)}
          />
        )}

        {!manual && formData.m5TransferorName && resolved && (
          <p className={styles['preview-hint']}>✅ Податоци преземени: {personSummary(transferor)}</p>
        )}
        {!manual && formData.m5TransferorName && !resolved && (
          <p className={styles['preview-hint']}>⚠️ Податоците за отстапувачот не можат да се преземат целосно — внесете ги подолу.</p>
        )}
        {manual && (
          <p className={styles['preview-hint']}>Внесете ги целосните податоци за отстапувачот подолу.</p>
        )}
      </div>

      {/* Identity inputs — shown for manual entry or an unresolved selection. */}
      {showFallback && M5_TRANSFEROR_FALLBACK.map((name) => {
        const field = companyChangesConfig.fields[name];
        if (!field) return null;
        // Citizenship only for foreign transferor.
        if (name === 'm5TransferorCitizenship' && formData.m5TransferorForeign !== 'да') return null;
        return (
          <FormField key={name} field={field} value={formData[name]} onChange={onChange} formData={formData} />
        );
      })}

      {renderFields(M5_CURRENT_FIELDS, formData, onChange)}
    </>
  );
};

const M5New = ({ formData, onChange }) => (
  <>{renderFields(M5_NEW_FIELDS, formData, onChange)}</>
);

/** Step 5 — lists the documents the package will generate (mirrors backend §4). */
const ReviewSummary = ({ formData }) => {
  const stepConfig = companyChangesConfig.steps.find((s) => s.id === 5);
  const changes = Array.isArray(formData.changes) ? formData.changes : [];

  const DECISION_LABELS = {
    M1: 'Одлука за промена на назив',
    M2: 'Одлука за промена на седиште',
    M3: 'Одлука за промена на лични податоци',
    M4: 'Одлука за промена на управител',
    M6: 'Одлука за уплата на основачки влог',
    M7: 'Одлука кај подружница'
  };

  const isDoo = formData.companyForm === 'doo';
  const hasM5 = changes.includes('M5');
  const decisionChanges = changes.filter((c) => ['M1', 'M2', 'M3', 'M4', 'M6', 'M7'].includes(c));
  const hasActChange = hasM5 || decisionChanges.some((c) => ['M1', 'M2', 'M3', 'M4', 'M6'].includes(c));
  const hasNewManager = changes.includes('M4') && ['a', 'b'].includes(formData.m4ChangeType) && formData.m4NewManagerName;
  const transfereeIsNew = formData.m5TransfereeIsNew === 'да';

  // Unique signatories — mirrors backend deriveSignatories.
  const names = new Set();
  (formData.shareholdersList || []).forEach((s) => s?.name && names.add(s.name.trim()));
  (formData.managersList || []).forEach((m) => m?.name && names.add(m.name.trim()));
  if (hasNewManager) names.add(formData.m4NewManagerName.trim());
  if (hasM5) {
    if (formData.m5TransferorName) names.add(formData.m5TransferorName.trim());
    if (formData.m5TransfereeName) names.add(formData.m5TransfereeName.trim());
  }
  const signatories = Array.from(names);

  // Other shareholders (for per-shareholder offers/rejections) — exclude transferor/transferee.
  const others = (formData.shareholdersList || [])
    .map((s) => s?.name?.trim())
    .filter((n) => n && n !== formData.m5TransferorName?.trim() && (transfereeIsNew || n !== formData.m5TransfereeName?.trim()));

  const docs = [];
  if (hasM5) {
    docs.push('Договор за пренос на удел (нотарска заверка)');
    docs.push('Понуда за пренос — до Друштвото');
    others.forEach((n) => docs.push(`Понуда за пренос — до ${n}`));
    if (transfereeIsNew) docs.push('Понуда за пренос — до стекнувачот');
    docs.push('Изјава за прифаќање (стекнувач)');
    docs.push('Изјава за неприфаќање — Друштвото');
    others.forEach((n) => docs.push(`Изјава за неприфаќање — ${n}`));
  }
  ['M1', 'M2', 'M3', 'M4', 'M6', 'M7'].forEach((m) => {
    if (decisionChanges.includes(m) && DECISION_LABELS[m]) docs.push(DECISION_LABELS[m]);
  });
  if (hasM5) {
    docs.push('Одлука за пренос на удел, истапување и пристапување');
    docs.push('Пријава по член 200');
  }
  if (hasActChange) {
    docs.push('Одлука за измена на Актот за основање (чл. 252 и 253)');
    docs.push(isDoo ? 'Договор за основање — пречистен текст' : 'Изјава за основање — пречистен текст');
  }
  if (hasM5) docs.push('Книга на удели');
  docs.push('Изјава по член 32 (од управителот)');
  if (hasNewManager) docs.push('Изјава по член 29/183/231 (нов управител)');
  if (hasM5 && transfereeIsNew) docs.push('Изјава по член 29/183/231 (нов содружник)');
  signatories.forEach((n) => docs.push(`Изјава за потписи — ${n}`));
  signatories.forEach((n) => docs.push(`Полномошно — ${n}`));

  return (
    <div className={styles['form-section']}>
      <h3>{stepConfig.title}</h3>
      {stepConfig.description && <p>{stepConfig.description}</p>}

      {hasM5 && (
        <p>ℹ️ Преносот на удел задолжително се заверува кај нотар. Договорот за пренос е подготвен за нотарска заверка.</p>
      )}

      <p><strong>Документи што ќе се генерираат ({docs.length}):</strong></p>
      <ol>
        {docs.map((d, i) => <li key={i}>{d}</li>)}
      </ol>
      <p>Сите документи се составуваат во еден .docx фајл, секој на нова страница. Промените се впишуваат во Трговскiот регистар преку регистрациониот агент.</p>

      <ActAmendDownload formData={formData} />
    </div>
  );
};

/**
 * Upload-mode bonus: download the user's REAL act amended in place (formatting
 * preserved). Phase 2 covers name (M1) and seat (M2) changes.
 */
const ActAmendDownload = ({ formData }) => {
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [message, setMessage] = useState('');
  const changes = Array.isArray(formData.changes) ? formData.changes : [];
  const supported = changes.includes('M1') || changes.includes('M2');

  if (!formData._actId || !formData._uploadMode || !supported) return null;

  const handleDownload = async () => {
    setStatus('loading');
    setMessage('');
    try {
      const { unmatched } = await amendActDownload(formData._actId, formData);
      setStatus('done');
      setMessage(unmatched
        ? `Преземено. Внимание: старите вредности за „${unmatched}" не беа најдени дословно во актот — проверете рачно.`
        : 'Изменетиот акт е преземен.');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Грешка при изменување на актот.');
    }
  };

  return (
    <div className={styles['info-box']}>
      <strong>📄 Вашиот реален акт со применети промени</strong>
      <p>Преземете го вашиот прикачен Акт за основање, изменет на самото место (со зачувано форматирање) за промените на назив/седиште.</p>
      <button
        type="button"
        className={`${styles.btn} ${styles['next-btn']}`}
        onClick={handleDownload}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Се подготвува...' : 'Преземи изменет акт'}
      </button>
      {message && <p className={status === 'error' ? styles['error-message'] : undefined}>{message}</p>}
    </div>
  );
};

/**
 * Generic repeating person list (shareholders / managers). Renders text and
 * select fields from listConfig.arrayFields with add/remove rows.
 */
const PersonList = ({ listKey, listConfig, value, onChange, disabled }) => {
  const items = value || [];

  const update = (index, field, fieldValue) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: fieldValue };
    onChange(listKey, next);
  };

  const addItem = () => {
    const blank = {};
    listConfig.arrayFields.forEach((f) => {
      blank[f.name] = f.type === 'select' && f.options?.length ? f.options[0].value : '';
    });
    onChange(listKey, [...items, blank]);
  };

  const removeItem = (index) => onChange(listKey, items.filter((_, i) => i !== index));

  return (
    <div className={styles['form-group']}>
      <label>
        {listConfig.label}
        {listConfig.helpText && (
          <span className={styles['help-tooltip']} data-tooltip={listConfig.helpText}>❓</span>
        )}
      </label>

      <div className={styles['shareholders-list']}>
        {items.map((item, index) => (
          <div key={index} className={styles['shareholder-row']}>
            <div className={styles['shareholder-number']}>{index + 1}</div>
            <div className={styles['shareholder-fields']}>
              {listConfig.arrayFields.map((field) => (
                <div key={field.name} className={styles['form-group']}>
                  <label htmlFor={`${listKey}_${field.name}_${index}`}>
                    {field.label}
                    {field.helpText && (
                      <span className={styles['help-tooltip']} data-tooltip={field.helpText}>❓</span>
                    )}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      id={`${listKey}_${field.name}_${index}`}
                      value={item[field.name] || ''}
                      onChange={(e) => update(index, field.name, e.target.value)}
                      disabled={disabled}
                    >
                      {field.options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type || 'text'}
                      id={`${listKey}_${field.name}_${index}`}
                      placeholder={field.placeholder}
                      value={item[field.name] || ''}
                      onChange={(e) => update(index, field.name, e.target.value)}
                      disabled={disabled}
                      maxLength={field.maxLength}
                    />
                  )}
                </div>
              ))}
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeItem(index)}
                className={styles['remove-btn']}
                title="Отстрани"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {!disabled && (
          <button type="button" onClick={addItem} className={styles['add-btn']}>
            {listConfig.addLabel || '+ Додади'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CompanyChangesPage;
