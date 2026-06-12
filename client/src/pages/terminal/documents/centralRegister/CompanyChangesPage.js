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
        return <ModuleFields formData={formData} onChange={handleInputChange} errors={errors} disabled={isGenerating} />;
      case 4:
        return <PlainFields step={4} formData={formData} onChange={handleInputChange} errors={errors} disabled={isGenerating} />;
      case 5:
        return <ReviewSummary formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <BaseDocumentPage
      config={companyChangesConfig}
      renderStepContent={renderStepContent}
      title="Промени во фирма"
      description="Пакет документи за упис на промени на основните податоци на друштвото во Трговскiот регистар при Централниот регистар на РСМ."
    />
  );
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

/** Step 3 — per-change fields (FormField self-hides via each field's condition). */
const ModuleFields = ({ formData, onChange, errors, disabled }) => {
  const stepConfig = companyChangesConfig.steps.find((s) => s.id === 3);
  const fields = getStepFields(3);
  const selected = Array.isArray(formData.changes) ? formData.changes : [];
  // Fields whose condition currently matches (so we can show an empty-state hint).
  const visible = fields.filter((f) => !f.condition || f.condition(formData));

  return (
    <div className={styles['form-section']}>
      <h3>{stepConfig.title}</h3>
      {stepConfig.description && <p>{stepConfig.description}</p>}

      {selected.length === 0 && (
        <p>Прво изберете промени во првиот чекор.</p>
      )}
      {selected.length > 0 && visible.length === 0 && (
        <p>За избраните промени нема дополнителни полиња во овој чекор.</p>
      )}

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
