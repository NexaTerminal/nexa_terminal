import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import { getTemplate, updateTemplate, getVersions, rollbackVersion } from '../../services/customTemplateApi';
import styles from '../../styles/terminal/TemplateEdit.module.css';

const COMPANY_FIELD_LABELS = {
  companyName: 'Име на компанија',
  companyAddress: 'Адреса',
  companyTaxNumber: 'Даночен број',
  companyManager: 'Управител',
  crnNumber: 'Матичен број',
  companyPIN: 'ЕМБС',
  phone: 'Телефон',
  email: 'Е-пошта',
  industry: 'Дејност',
  website: 'Веб страна'
};

const TYPE_LABELS = {
  text: 'Текст',
  number: 'Број',
  date: 'Датум',
  textarea: 'Долг текст',
  select: 'Паѓачко мени',
  companyData: 'Податоци од компанија',
  checkbox: 'Чекбокс',
  calculated: 'Пресметано'
};

const TemplateEdit = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const previewRef = useRef(null);

  const [template, setTemplate] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [fields, setFields] = useState([]);
  const [versions, setVersions] = useState([]);
  const [showVersions, setShowVersions] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Field popup state (for adding new fields via text selection)
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [newField, setNewField] = useState({ label: '', type: 'text', required: false, options: '', companyField: '', formula: '' });

  // Editing existing field inline
  const [editingFieldIndex, setEditingFieldIndex] = useState(null);

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  // After template loads and preview renders, highlight existing fields
  useEffect(() => {
    if (template?.htmlPreview && previewRef.current && fields.length > 0) {
      // Small delay to ensure HTML is rendered
      setTimeout(() => highlightExistingFields(), 50);
    }
  }, [template?.htmlPreview]);

  const fetchTemplate = async () => {
    try {
      const data = await getTemplate(templateId);
      setTemplate(data);
      setName(data.name);
      setDescription(data.description || '');
      setCategory(data.category || '');
      setFields(data.fields || []);
    } catch (err) {
      setError('Шаблонот не е пронајден');
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const data = await getVersions(templateId);
      setVersions(data);
      setShowVersions(true);
    } catch (err) {
      setError('Грешка при вчитување на верзиите');
    }
  };

  const handleRollback = async (versionId) => {
    try {
      setRollingBack(true);
      await rollbackVersion(templateId, versionId);
      setShowVersions(false);
      await fetchTemplate();
      setSuccess('Шаблонот е вратен на претходна верзија');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setRollingBack(false);
    }
  };

  // --- HIGHLIGHT EXISTING FIELDS IN PREVIEW ---

  const highlightExistingFields = () => {
    if (!previewRef.current) return;
    fields.forEach(field => {
      if (field.originalText) {
        highlightText(field.originalText, field.name);
      }
    });
  };

  const highlightText = (text, fieldName) => {
    if (!previewRef.current) return;

    const walker = document.createTreeWalker(
      previewRef.current,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while ((node = walker.nextNode())) {
      const idx = node.textContent.indexOf(text);
      if (idx === -1) continue;

      // Skip if already inside a marked span
      if (node.parentElement?.classList?.contains(styles.markedField)) continue;

      const range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + text.length);

      const span = document.createElement('span');
      span.className = styles.markedField;
      span.setAttribute('data-field', fieldName);
      span.setAttribute('title', `{${fieldName}}`);
      range.surroundContents(span);
      break;
    }
  };

  const removeHighlight = (fieldName) => {
    if (!previewRef.current) return;
    const highlighted = previewRef.current.querySelector(`[data-field="${fieldName}"]`);
    if (highlighted) {
      const parent = highlighted.parentNode;
      parent.replaceChild(document.createTextNode(highlighted.textContent), highlighted);
      parent.normalize();
    }
  };

  // --- TEXT SELECTION (add new field) ---

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (!text || text.length < 2) {
      setShowPopup(false);
      return;
    }

    if (!previewRef.current?.contains(selection.anchorNode)) return;

    // Check if already marked
    const alreadyMarked = fields.some(f => f.originalText === text);
    if (alreadyMarked) {
      setError('Овој текст е веќе означен како поле');
      setTimeout(() => setError(''), 2000);
      return;
    }

    setSelectedText(text);

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const previewRect = previewRef.current.getBoundingClientRect();

    setPopupPosition({
      top: rect.bottom - previewRect.top + 8,
      left: Math.min(rect.left - previewRect.left, previewRect.width - 300)
    });

    const autoName = text
      .toLowerCase()
      .replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    setNewField({ label: text, type: 'text', required: false, autoName, options: '', companyField: '', formula: '' });
    setShowPopup(true);
  };

  const addField = () => {
    if (!selectedText || !newField.label) return;

    const tagName = newField.autoName || `field_${Date.now()}`;
    const safeName = tagName.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+|_+$/g, '') || `field_${fields.length + 1}`;

    const field = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: safeName,
      label: newField.label,
      type: newField.type,
      required: newField.required,
      originalText: selectedText
    };

    if (newField.type === 'select' && newField.options) {
      field.options = newField.options.split(',').map(o => o.trim()).filter(Boolean);
    }
    if (newField.type === 'companyData' && newField.companyField) {
      field.companyField = newField.companyField;
    }
    if (newField.type === 'calculated' && newField.formula) {
      field.formula = newField.formula;
    }

    setFields(prev => [...prev, field]);
    highlightText(selectedText, safeName);

    setShowPopup(false);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  };

  // --- FIELD EDITING ---

  const updateField = (index, key, value) => {
    setFields(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      if (key === 'type') {
        if (value !== 'select') updated[index].options = undefined;
        if (value !== 'companyData') updated[index].companyField = undefined;
      }
      return updated;
    });
  };

  const updateSelectOptions = (index, optionsStr) => {
    const options = optionsStr.split(',').map(o => o.trim()).filter(Boolean);
    updateField(index, 'options', options);
  };

  const removeField = (index) => {
    const field = fields[index];
    if (field) removeHighlight(field.name);
    setFields(prev => prev.filter((_, i) => i !== index));
    if (editingFieldIndex === index) setEditingFieldIndex(null);
  };

  // --- SAVE ---

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Внесете име за шаблонот');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateTemplate(templateId, {
        name: name.trim(),
        description: description.trim(),
        category,
        fields
      });
      setSuccess('Шаблонот е успешно ажуриран');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Грешка при зачувување');
    } finally {
      setSaving(false);
    }
  };

  // --- RENDER ---

  if (loading) {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles.dashboardLayout}>
          <Sidebar />
          <main className={styles.dashboardMain}>
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Вчитување...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles.dashboardLayout}>
          <Sidebar />
          <main className={styles.dashboardMain}>
            <div className={styles.errorState}>
              <p>{error || 'Шаблонот не е пронајден'}</p>
              <button onClick={() => navigate('/terminal/my-templates')} className={styles.backLink}>
                Назад кон шаблони
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header isTerminal={true} />

      <div className={styles.dashboardLayout}>
        <Sidebar />

        <main className={styles.dashboardMain}>
          <button
            className={styles.backLink}
            onClick={() => navigate('/terminal/my-templates')}
          >
            &larr; Назад кон шаблони
          </button>

          {error && (
            <div className={styles.errorBanner}>
              {error}
              <button onClick={() => setError('')} className={styles.errorDismiss}>&times;</button>
            </div>
          )}

          {success && (
            <div className={styles.successBanner}>{success}</div>
          )}

          {/* Template info bar */}
          <div className={styles.infoBar}>
            <div className={styles.infoBarFields}>
              <div className={styles.infoBarField}>
                <label className={styles.infoBarLabel}>Име на шаблонот</label>
                <input
                  type="text"
                  className={styles.infoBarInput}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Име на шаблонот"
                />
              </div>
              <div className={styles.infoBarField}>
                <label className={styles.infoBarLabel}>Опис</label>
                <input
                  type="text"
                  className={styles.infoBarInput}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Краток опис (опционално)"
                />
              </div>
              <div className={styles.infoBarField}>
                <label className={styles.infoBarLabel}>Категорија</label>
                <select
                  className={styles.infoBarInput}
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="">-- Без категорија --</option>
                  <option value="Вработување">Вработување</option>
                  <option value="Договори">Договори</option>
                  <option value="Лични податоци">Лични податоци</option>
                  <option value="Финансии">Финансии</option>
                  <option value="Администрација">Администрација</option>
                  <option value="Друго">Друго</option>
                </select>
              </div>
            </div>
            <div className={styles.infoBarActions}>
              <button className={styles.versionsButton} onClick={fetchVersions}>
                Верзии
              </button>
            </div>
          </div>

          {/* Versions panel */}
          {showVersions && (
            <div className={styles.versionsPanel}>
              <div className={styles.versionsPanelHeader}>
                <h3>Историја на верзии</h3>
                <button className={styles.versionsPanelClose} onClick={() => setShowVersions(false)}>×</button>
              </div>
              {versions.length === 0 ? (
                <p className={styles.versionsEmpty}>Нема претходни верзии</p>
              ) : (
                <div className={styles.versionsList}>
                  {versions.map(v => (
                    <div key={v._id} className={styles.versionItem}>
                      <div className={styles.versionInfo}>
                        <span className={styles.versionNumber}>v{v.version}</span>
                        <span className={styles.versionName}>{v.name}</span>
                        <span className={styles.versionDate}>
                          {new Date(v.createdAt).toLocaleDateString('mk-MK')}
                        </span>
                      </div>
                      <button
                        className={styles.rollbackButton}
                        onClick={() => handleRollback(v._id)}
                        disabled={rollingBack}
                      >
                        {rollingBack ? '...' : 'Врати'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Main editor: preview + fields panel */}
          <div className={styles.editorLayout}>
            {/* Document preview with text selection */}
            <div className={styles.previewPanel}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>Преглед на документот</h2>
                <p className={styles.panelHint}>
                  Селектирајте текст за да додадете ново динамично поле
                </p>
              </div>
              <div
                ref={previewRef}
                className={styles.previewContent}
                onMouseUp={handleTextSelection}
                dangerouslySetInnerHTML={{ __html: template.htmlPreview || '<p style="color:#94a3b8;text-align:center;padding:2rem">Прегледот не е достапен за овој шаблон</p>' }}
              />

              {/* Add field popup */}
              {showPopup && (
                <div
                  className={styles.fieldPopup}
                  style={{ top: popupPosition.top, left: popupPosition.left }}
                >
                  <div className={styles.popupHeader}>
                    <span className={styles.popupSelectedText}>"{selectedText}"</span>
                  </div>

                  <div className={styles.popupField}>
                    <label className={styles.popupLabel}>Име на полето</label>
                    <input
                      type="text"
                      className={styles.popupInput}
                      value={newField.label}
                      onChange={e => setNewField(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="пр. Име на вработен"
                    />
                  </div>

                  <div className={styles.popupField}>
                    <label className={styles.popupLabel}>Тип</label>
                    <select
                      className={styles.popupSelect}
                      value={newField.type}
                      onChange={e => setNewField(prev => ({ ...prev, type: e.target.value, options: '', companyField: '' }))}
                    >
                      {Object.entries(TYPE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {newField.type === 'select' && (
                    <div className={styles.popupField}>
                      <label className={styles.popupLabel}>Опции (одделени со запирка)</label>
                      <input
                        type="text"
                        className={styles.popupInput}
                        value={newField.options}
                        onChange={e => setNewField(prev => ({ ...prev, options: e.target.value }))}
                        placeholder="пр. маж, жена"
                      />
                    </div>
                  )}

                  {newField.type === 'companyData' && (
                    <div className={styles.popupField}>
                      <label className={styles.popupLabel}>Поле од компанија</label>
                      <select
                        className={styles.popupSelect}
                        value={newField.companyField}
                        onChange={e => setNewField(prev => ({ ...prev, companyField: e.target.value }))}
                      >
                        <option value="">-- Избери --</option>
                        {Object.entries(COMPANY_FIELD_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {newField.type === 'calculated' && (
                    <div className={styles.popupField}>
                      <label className={styles.popupLabel}>Формула</label>
                      <input
                        type="text"
                        className={styles.popupInput}
                        value={newField.formula}
                        onChange={e => setNewField(prev => ({ ...prev, formula: e.target.value }))}
                        placeholder="пр. {firstName} {lastName}"
                      />
                    </div>
                  )}

                  <div className={styles.popupCheckbox}>
                    <input
                      type="checkbox"
                      id="newFieldRequired"
                      checked={newField.required}
                      onChange={e => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                    />
                    <label htmlFor="newFieldRequired">Задолжително поле</label>
                  </div>

                  <div className={styles.popupActions}>
                    <button className={styles.popupCancel} onClick={() => setShowPopup(false)}>
                      Откажи
                    </button>
                    <button className={styles.popupConfirm} onClick={addField}>
                      Додај поле
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Fields panel */}
            <div className={styles.fieldsPanel}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>Полиња ({fields.length})</h2>
              </div>

              {fields.length === 0 ? (
                <div className={styles.fieldsEmpty}>
                  <p>Означете текст од документот за да додадете динамични полиња</p>
                </div>
              ) : (
                <div className={styles.fieldsList}>
                  {fields.map((field, index) => (
                    <div
                      key={field.id || index}
                      className={`${styles.fieldCard} ${editingFieldIndex === index ? styles.fieldCardEditing : ''}`}
                    >
                      <div className={styles.fieldCardHeader}>
                        <span className={styles.fieldIndex}>{index + 1}</span>
                        <span className={styles.fieldLabelText}>{field.label}</span>
                        <button
                          className={styles.fieldEditBtn}
                          onClick={() => setEditingFieldIndex(editingFieldIndex === index ? null : index)}
                          title="Уреди"
                        >
                          {editingFieldIndex === index ? '▼' : '▶'}
                        </button>
                        <button
                          className={styles.fieldRemove}
                          onClick={() => removeField(index)}
                          title="Отстрани"
                        >
                          &times;
                        </button>
                      </div>

                      <div className={styles.fieldCardMeta}>
                        <span className={styles.fieldTag}>{`{${field.name}}`}</span>
                        <span className={styles.fieldType}>
                          {field.type === 'companyData' ? `компанија` : TYPE_LABELS[field.type] || field.type}
                        </span>
                        {field.required && <span className={styles.fieldRequiredBadge}>*</span>}
                      </div>

                      {/* Expandable edit section */}
                      {editingFieldIndex === index && (
                        <div className={styles.fieldEditBody}>
                          <div className={styles.fieldEditRow}>
                            <div className={styles.fieldEditCol}>
                              <label className={styles.fieldEditLabel}>Име</label>
                              <input
                                type="text"
                                className={styles.fieldEditInput}
                                value={field.label}
                                onChange={e => updateField(index, 'label', e.target.value)}
                              />
                            </div>
                            <div className={styles.fieldEditCol}>
                              <label className={styles.fieldEditLabel}>Тип</label>
                              <select
                                className={styles.fieldEditInput}
                                value={field.type}
                                onChange={e => updateField(index, 'type', e.target.value)}
                              >
                                {Object.entries(TYPE_LABELS).map(([val, label]) => (
                                  <option key={val} value={val}>{label}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {field.type === 'select' && (
                            <div className={styles.fieldEditRow}>
                              <div className={styles.fieldEditColFull}>
                                <label className={styles.fieldEditLabel}>Опции (запирка)</label>
                                <input
                                  type="text"
                                  className={styles.fieldEditInput}
                                  value={(field.options || []).join(', ')}
                                  onChange={e => updateSelectOptions(index, e.target.value)}
                                  placeholder="пр. маж, жена"
                                />
                              </div>
                            </div>
                          )}

                          {field.type === 'companyData' && (
                            <div className={styles.fieldEditRow}>
                              <div className={styles.fieldEditColFull}>
                                <label className={styles.fieldEditLabel}>Поле од компанија</label>
                                <select
                                  className={styles.fieldEditInput}
                                  value={field.companyField || ''}
                                  onChange={e => updateField(index, 'companyField', e.target.value)}
                                >
                                  <option value="">-- Избери --</option>
                                  {Object.entries(COMPANY_FIELD_LABELS).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}

                          {field.type === 'calculated' && (
                            <div className={styles.fieldEditRow}>
                              <div className={styles.fieldEditColFull}>
                                <label className={styles.fieldEditLabel}>Формула</label>
                                <input
                                  type="text"
                                  className={styles.fieldEditInput}
                                  value={field.formula || ''}
                                  onChange={e => updateField(index, 'formula', e.target.value)}
                                  placeholder="пр. {firstName} {lastName}"
                                />
                              </div>
                            </div>
                          )}

                          <div className={styles.fieldEditCheckbox}>
                            <input
                              type="checkbox"
                              id={`req-edit-${index}`}
                              checked={field.required || false}
                              onChange={e => updateField(index, 'required', e.target.checked)}
                            />
                            <label htmlFor={`req-edit-${index}`}>Задолжително</label>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.fieldsPanelFooter}>
                <button
                  className={styles.saveButton}
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                >
                  {saving ? 'Се зачувува...' : 'Зачувај промени'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TemplateEdit;
