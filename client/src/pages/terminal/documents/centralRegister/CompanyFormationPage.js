import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import { companyIncorporationConfig, getStepFields } from '../../../../config/documents/companyIncorporation';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * „Основање на фирма" — Централен регистар.
 * Incorporation pack: company + capital → founders → managers → agent → review.
 * The backend assembles the constitutive act + statements + POAs + ЗП into one .docx.
 */
/**
 * Step + preview renderers — exported so the public share flow (/dokument/:token)
 * reuses the exact same bespoke UI as the authenticated page.
 */
export const renderStepContent = ({ currentStep, formData, handleInputChange, errors, isGenerating }) => {
  switch (currentStep) {
    case 1:
      return (
        <>
          <FormationGuide />
          <PlainFields step={1} formData={formData} onChange={handleInputChange} errors={errors} disabled={isGenerating} />
        </>
      );
    case 2:
      return <PersonList listConfig={companyIncorporationConfig.foundersList} value={formData.foundersList || []} formData={formData} onChange={handleInputChange} disabled={isGenerating} />;
    case 3:
      return <PersonList listConfig={companyIncorporationConfig.managersList} value={formData.managersList || []} formData={formData} onChange={handleInputChange} disabled={isGenerating} />;
    case 4:
      return <PlainFields step={4} formData={formData} onChange={handleInputChange} errors={errors} disabled={isGenerating} />;
    case 5:
      return <ReviewSummary formData={formData} />;
    default:
      return null;
  }
};

export const renderPreview = ({ formData }) => <PackOverview formData={formData} />;
export const config = companyIncorporationConfig;

const CompanyFormationPage = () => {
  return (
    <BaseDocumentPage
      config={companyIncorporationConfig}
      renderStepContent={renderStepContent}
      customPreviewComponent={renderPreview}
      title="Основање на фирма"
      description="Пакет документи за основање на ДОО/ДООЕЛ и упис во Трговскiот регистар при Централниот регистар на РСМ."
    />
  );
};

/**
 * Practical, law-derived intro for incorporation (ЗТД, глава за ДОО). Grounded in
 * чл. 167 (1–50 content), 169 (ДОО/ДООЕЛ ознака), 170 (Договор/Изјава), 171
 * (содржина), 172 (главнина ≥ 5.000 ЕУР), 183 (прилози кон пријавата).
 */
const FormationGuide = () => (
  <details className={styles['info-box']}>
    <summary>
      <strong>📘 Практичен водич: основање на друштво (ДОО/ДООЕЛ)</strong>
    </summary>
    <p>
      ДОО се основа со <strong>Договор за основање</strong> од сите основачи; кога друштвото го основа
      <strong> едно лице</strong>, Договорот се заменува со <strong>Изјава за основање</strong> (чл. 170).
      Фирмата задолжително ја содржи ознаката <strong>ДОО</strong>, односно <strong>ДООЕЛ</strong> за едно
      лице (чл. 169). Друштвото може да има од 1 до 50 содружници (чл. 167).
    </p>
    <p><strong>Што содржи конститутивниот акт (чл. 171):</strong> податоци за содружниците (ЕМБГ/пасош/ЕМБС), фирма и седиште, предмет на работење, времетраење, основна главнина и поединечен влог на секој содружник, управител и застапување, права и обврски, распределба на добивката.</p>
    <p><strong>Основна главнина (чл. 172):</strong> најмалку <strong>5.000 ЕУР</strong> во денарска противвредност, изразена со цел број делив со 100. Влогот може да биде паричен или непаричен (кај непаричен — проценка од овластен проценувач).</p>
    <p><strong>Што се приложува кон пријавата (чл. 183):</strong> конститутивниот акт, документи за идентитет, одлука/изјава за избор и прифаќање на управител, <strong>изјава по чл. 29</strong> (нема пречки за основач), <strong>изјава по чл. 32</strong> и заверени потписи (ЗП образец).</p>
    <p><strong>📦 Што се генерира:</strong> Изјава/Договор за основање, изјави по чл. 29/32/183/231, полномошна за регистрациониот агент, изјави за потписи (чл. 7 од Правилникот) и ЗП образец.</p>
    <p><strong>✍️ Што пополнувате:</strong> формата (ДОО/ДООЕЛ), називите и седиштето, НКД дејноста, основната главнина и влоговите, основачите и управителите, и регистрациониот агент.</p>
    <p><strong>ℹ️ Напомена:</strong> НКД шифрата не се проверува — мора да постои во официјалниот НКД список. <strong>ЕМБС и ЕДБ ги доделува Регистарот</strong>, па при основање остануваат празни.</p>
  </details>
);

/** Renders the plain (getStepFields) fields for a step via FormField. */
const PlainFields = ({ step, formData, onChange, errors, disabled }) => {
  const stepConfig = companyIncorporationConfig.steps.find((s) => s.id === step);
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

/**
 * Generic repeating person list (founders / managers). Supports text/select/textarea
 * columns; a column with `condition(item, formData)` is hidden when it returns false.
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
    listConfig.arrayFields.forEach((f) => {
      blank[f.name] = f.type === 'select' && f.options?.length ? f.options[0].value : '';
    });
    onChange(listConfig.name, [...items, blank]);
  };

  const removeItem = (index) => onChange(listConfig.name, items.filter((_, i) => i !== index));

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
                    ) : field.type === 'textarea' ? (
                      <textarea id={id} rows={field.rows || 3} placeholder={field.placeholder} value={item[field.name] || ''} onChange={(e) => update(index, field.name, e.target.value)} disabled={disabled} />
                    ) : (
                      <input type="text" id={id} placeholder={field.placeholder} value={item[field.name] || ''} onChange={(e) => update(index, field.name, e.target.value)} disabled={disabled} />
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
    </div>
  );
};

/** Mirrors the backend assemblePack — lists the documents the pack will generate. */
const computePackDocs = (formData) => {
  const isDooel = (formData.companyForm || 'dooel') === 'dooel';
  const founders = (formData.foundersList || []).filter((f) => f && f.name);
  const managers = (formData.managersList || []).filter((m) => m && m.name);
  const effManagers = managers.length ? managers : (founders[0] ? [founders[0]] : []);
  const nonMon = formData.contributionType === 'non_monetary';
  const ext = nonMon ? ' (+ чл. 35)' : '';
  const docs = [];

  docs.push(isDooel ? 'Изјава за основање на ДООЕЛ' : 'Договор за основање на ДОО');

  if (isDooel) {
    const sole = founders[0];
    const soleIsMgr = effManagers.length === 1 && sole && (effManagers[0].name || '').trim().toLowerCase() === (sole.name || '').trim().toLowerCase();
    if (soleIsMgr) {
      docs.push(`Изјава по чл. 29, 32, 183, 231 ст.4${ext}`);
    } else {
      docs.push('Изјава по чл. 29 и 32 (основач)');
      effManagers.forEach((m) => docs.push(`Изјава по чл. 32, 183, 231 — ${m.name}`));
    }
  } else {
    docs.push('Изјава по чл. 29 и 32 (сите основачи)');
    effManagers.forEach((m) => docs.push(`Изјава по чл. 32, 183, 231 — ${m.name}`));
  }

  if (nonMon) {
    founders.forEach((f) => docs.push(`Изјава по чл. 34/35/172/176/177 — ${f.name}`));
    docs.push('Договор за непаричен влог (чл. 183 ст.3)');
  }
  founders.forEach((f) => docs.push(`Полномошно — ${f.name}`));
  founders.forEach((f) => docs.push(`Изјава по чл. 7 ст.1 ал.4 — ${f.name}`));
  docs.push('ЗП образец (заверен потпис)');
  return docs;
};

/** Step 5 — review of the documents that will be generated. */
const ReviewSummary = ({ formData }) => {
  const stepConfig = companyIncorporationConfig.steps.find((s) => s.id === 5);
  const docs = computePackDocs(formData);
  const isDooel = (formData.companyForm || 'dooel') === 'dooel';
  const founders = (formData.foundersList || []).filter((f) => f && f.name);

  return (
    <div className={styles['form-section']}>
      <h3>{stepConfig.title}</h3>
      {stepConfig.description && <p>{stepConfig.description}</p>}

      {isDooel && founders.length > 1 && <p>⚠️ ДООЕЛ може да има само еден основач — изберете ДОО за повеќе основачи.</p>}
      {!isDooel && founders.length === 1 && <p>⚠️ ДОО бара двајца или повеќе основачи.</p>}

      <p><strong>Документи што ќе се генерираат ({docs.length}):</strong></p>
      <ol>{docs.map((d, i) => <li key={i}>{d}</li>)}</ol>
      <p>Сите документи се составуваат во еден .docx фајл, секој на нова страница. Напомена: НКД шифрата не се проверува — мора да постои во официјалниот НКД список. ЕМБС и даночниот број ги доделува Регистарот.</p>
    </div>
  );
};

/** Right panel — pack overview (replaces the live document preview). */
const PackOverview = ({ formData }) => {
  const docs = computePackDocs(formData);
  const founders = (formData.foundersList || []).filter((f) => f && f.name);
  return (
    <div className={styles['preview-changes']}>
      <h3>Пакет документи</h3>
      {founders.length === 0 ? (
        <p>Внесете ги основачите за да го видите пакетот документи.</p>
      ) : (
        <ol className={styles['preview-changes-list']}>
          {docs.map((d, i) => <li key={i}>{d}</li>)}
        </ol>
      )}
      <p className={styles['preview-hint']}>Пакетот се составува во еден .docx фајл, секој документ на нова страница.</p>
    </div>
  );
};

export default CompanyFormationPage;
