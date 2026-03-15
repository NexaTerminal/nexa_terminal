import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mammoth from 'mammoth';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import { uploadTemplateFile, createTemplate, suggestFields } from '../../services/customTemplateApi';
import styles from '../../styles/terminal/MyTemplateBuilder.module.css';

const MyTemplateBuilder = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);

  // Steps: upload -> suggestions -> preview -> save
  const [step, setStep] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Upload state
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');

  // Preview & fields state
  const [htmlPreview, setHtmlPreview] = useState('');
  const [plainText, setPlainText] = useState('');
  const [originalFileId, setOriginalFileId] = useState('');
  const [originalFileName, setOriginalFileName] = useState('');
  const [fields, setFields] = useState([]);

  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState(new Set());
  const [dismissedSuggestions, setDismissedSuggestions] = useState(new Set());

  // Field popup state
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [newField, setNewField] = useState({ label: '', type: 'text', required: false, options: '', companyField: '', formula: '' });

  // Save state
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');

  // --- UPLOAD HANDLERS ---

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processFile = async (file) => {
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'docx') {
      const formatHints = {
        doc: 'Отворете го во Word → File → Save As → изберете .docx',
        odt: 'Отворете го во LibreOffice → File → Save As → изберете .docx',
        pdf: 'Отворете го во Word или Google Docs и зачувајте како .docx',
      };
      const hint = formatHints[ext] || 'Конвертирајте го документот во .docx формат';
      setError(`Дозволени се само .docx датотеки. ${hint}`);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Датотеката е преголема (максимум 5MB)');
      return;
    }

    setError('');
    setLoading(true);
    setFileName(file.name);

    try {
      // Client-side preview with mammoth
      const arrayBuffer = await file.arrayBuffer();
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
      setHtmlPreview(htmlResult.value);

      // Also extract plain text for AI analysis
      const textResult = await mammoth.extractRawText({ arrayBuffer });
      setPlainText(textResult.value);

      // Upload to server for GridFS storage
      const uploadResult = await uploadTemplateFile(file);
      setOriginalFileId(uploadResult.originalFileId);
      setOriginalFileName(uploadResult.originalFileName);

      // Move to AI suggestions step
      setStep('suggestions');

      // Start AI analysis in background
      setAiLoading(true);
      try {
        const suggestions = await suggestFields(textResult.value);
        setAiSuggestions(suggestions);
      } catch (aiErr) {
        // AI failure is non-blocking — user can still proceed manually
        console.warn('AI suggestion failed:', aiErr);
      } finally {
        setAiLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Грешка при обработка на датотеката');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    processFile(file);
  }, []);

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  // --- AI SUGGESTION HANDLERS ---

  const toggleSuggestion = (index) => {
    const newAccepted = new Set(acceptedSuggestions);
    const newDismissed = new Set(dismissedSuggestions);

    if (newAccepted.has(index)) {
      newAccepted.delete(index);
    } else {
      newAccepted.add(index);
      newDismissed.delete(index);
    }

    setAcceptedSuggestions(newAccepted);
    setDismissedSuggestions(newDismissed);
  };

  const dismissSuggestion = (index) => {
    const newDismissed = new Set(dismissedSuggestions);
    const newAccepted = new Set(acceptedSuggestions);
    newDismissed.add(index);
    newAccepted.delete(index);
    setDismissedSuggestions(newDismissed);
    setAcceptedSuggestions(newAccepted);
  };

  const acceptAllSuggestions = () => {
    const all = new Set(aiSuggestions.map((_, i) => i));
    setAcceptedSuggestions(all);
    setDismissedSuggestions(new Set());
  };

  const dismissAllSuggestions = () => {
    setAcceptedSuggestions(new Set());
    setDismissedSuggestions(new Set(aiSuggestions.map((_, i) => i)));
  };

  const proceedFromSuggestions = () => {
    // Convert accepted AI suggestions to fields
    const acceptedFields = [];
    acceptedSuggestions.forEach(index => {
      const s = aiSuggestions[index];
      if (!s) return;

      const safeName = s.name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+|_+$/g, '') || `field_${index}`;

      const field = {
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 5)}_${index}`,
        name: safeName,
        label: s.label,
        type: s.type || 'text',
        required: !!s.required,
        originalText: s.originalText
      };

      if (s.type === 'companyData' && s.companyField) {
        field.companyField = s.companyField;
      }

      acceptedFields.push(field);
    });

    setFields(acceptedFields);
    setStep('preview');
  };

  const skipSuggestions = () => {
    setStep('preview');
  };

  // --- TEXT SELECTION HANDLER ---

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (!text || text.length < 2) {
      setShowPopup(false);
      return;
    }

    // Check if selection is inside the preview container
    if (!previewRef.current?.contains(selection.anchorNode)) {
      return;
    }

    // Check if this text is already marked as a field
    const alreadyMarked = fields.some(f => f.originalText === text);
    if (alreadyMarked) {
      setError('Овој текст е веќе означен како поле');
      setTimeout(() => setError(''), 2000);
      return;
    }

    setSelectedText(text);

    // Position popup near selection
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const previewRect = previewRef.current.getBoundingClientRect();

    setPopupPosition({
      top: rect.bottom - previewRect.top + 8,
      left: rect.left - previewRect.left
    });

    // Auto-generate a field name from the selected text
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

    // Generate a safe tag name
    const tagName = newField.autoName ||
      `field_${Date.now()}`;

    // Sanitize: only allow a-z, A-Z, 0-9, underscore
    const safeName = tagName.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+|_+$/g, '') || `field_${fields.length + 1}`;

    const field = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: safeName,
      label: newField.label,
      type: newField.type,
      required: newField.required,
      originalText: selectedText
    };

    // Add select options if type is select
    if (newField.type === 'select' && newField.options) {
      field.options = newField.options.split(',').map(o => o.trim()).filter(Boolean);
    }

    // Add company field mapping if type is companyData
    if (newField.type === 'companyData' && newField.companyField) {
      field.companyField = newField.companyField;
    }

    // Add formula if type is calculated
    if (newField.type === 'calculated' && newField.formula) {
      field.formula = newField.formula;
    }

    setFields(prev => [...prev, field]);

    // Highlight the selected text in the preview
    highlightText(selectedText, safeName);

    setShowPopup(false);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
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

  // After switching to preview step, highlight all pre-accepted fields
  const previewContentRef = useCallback((node) => {
    previewRef.current = node;
    if (node && fields.length > 0) {
      // Small delay to allow DOM rendering
      setTimeout(() => {
        fields.forEach(f => highlightText(f.originalText, f.name));
      }, 50);
    }
  }, [fields]);

  const removeField = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    setFields(prev => prev.filter(f => f.id !== fieldId));

    // Remove highlight from preview
    if (field && previewRef.current) {
      const highlighted = previewRef.current.querySelector(`[data-field="${field.name}"]`);
      if (highlighted) {
        const parent = highlighted.parentNode;
        parent.replaceChild(document.createTextNode(highlighted.textContent), highlighted);
        parent.normalize();
      }
    }
  };

  // --- SAVE HANDLER ---

  const handleSave = async () => {
    if (!templateName.trim()) {
      setError('Внесете име за шаблонот');
      return;
    }

    if (fields.length === 0) {
      setError('Означете барем едно динамично поле');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createTemplate({
        name: templateName.trim(),
        description: templateDescription.trim(),
        originalFileId,
        originalFileName,
        fields,
        htmlPreview,
        category: templateCategory
      });

      navigate('/terminal/my-templates');
    } catch (err) {
      setError(err.message || 'Грешка при зачувување');
    } finally {
      setLoading(false);
    }
  };

  // --- HELPERS ---

  const TYPE_LABELS = {
    text: 'Текст',
    number: 'Број',
    date: 'Датум',
    textarea: 'Долг текст',
    companyData: 'Компанија',
    select: 'Мени',
    checkbox: 'Чекбокс',
    calculated: 'Пресметано'
  };

  // --- RENDER ---

  return (
    <div>
      <Header isTerminal={true} />

      <div className={styles.dashboardLayout}>
        <Sidebar />

        <main className={styles.dashboardMain}>
          {/* Steps indicator */}
          <div className={styles.steps}>
            <div className={`${styles.step} ${step === 'upload' ? styles.stepActive : ''} ${step !== 'upload' ? styles.stepDone : ''}`}>
              <span className={styles.stepNumber}>1</span>
              Прикачи документ
            </div>
            <div className={styles.stepLine} />
            <div className={`${styles.step} ${step === 'suggestions' ? styles.stepActive : ''} ${(step === 'preview' || step === 'save') ? styles.stepDone : ''}`}>
              <span className={styles.stepNumber}>2</span>
              AI предлози
            </div>
            <div className={styles.stepLine} />
            <div className={`${styles.step} ${step === 'preview' ? styles.stepActive : ''} ${step === 'save' ? styles.stepDone : ''}`}>
              <span className={styles.stepNumber}>3</span>
              Означи полиња
            </div>
            <div className={styles.stepLine} />
            <div className={`${styles.step} ${step === 'save' ? styles.stepActive : ''}`}>
              <span className={styles.stepNumber}>4</span>
              Зачувај
            </div>
          </div>

          {error && (
            <div className={styles.errorBanner}>
              {error}
              <button onClick={() => setError('')} className={styles.errorDismiss}>×</button>
            </div>
          )}

          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div className={styles.uploadSection}>
              <div
                className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {loading ? (
                  <div className={styles.uploadLoading}>
                    <div className={styles.spinner} />
                    <p>Се обработува {fileName}...</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.dropIcon}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <h3 className={styles.dropTitle}>
                      Повлечете и пуштете .docx датотека
                    </h3>
                    <p className={styles.dropSubtitle}>
                      или кликнете за да изберете датотека (максимум 5MB)
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* STEP 2: AI Suggestions */}
          {step === 'suggestions' && (
            <div className={styles.suggestionsSection}>
              <div className={styles.suggestionsCard}>
                <div className={styles.suggestionsHeader}>
                  <div className={styles.suggestionsHeaderIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                      <line x1="9" y1="21" x2="15" y2="21" />
                    </svg>
                  </div>
                  <div>
                    <h2 className={styles.suggestionsTitle}>AI анализа на документот</h2>
                    <p className={styles.suggestionsSubtitle}>
                      {aiLoading
                        ? 'AI го анализира вашиот документ и ги идентификува динамичните полиња...'
                        : aiSuggestions.length > 0
                          ? `Пронајдени се ${aiSuggestions.length} потенцијални динамични полиња. Прифатете ги, отстранете ги, или продолжете рачно.`
                          : 'Не се пронајдени предлози. Продолжете рачно да означите полиња.'}
                    </p>
                  </div>
                </div>

                {aiLoading ? (
                  <div className={styles.suggestionsLoading}>
                    <div className={styles.aiSpinner}>
                      <div className={styles.aiSpinnerDot} />
                      <div className={styles.aiSpinnerDot} />
                      <div className={styles.aiSpinnerDot} />
                    </div>
                    <p>AI анализира...</p>
                  </div>
                ) : aiSuggestions.length > 0 ? (
                  <>
                    <div className={styles.suggestionsToolbar}>
                      <button className={styles.toolbarBtn} onClick={acceptAllSuggestions}>
                        Прифати сите
                      </button>
                      <button className={styles.toolbarBtn} onClick={dismissAllSuggestions}>
                        Отстрани сите
                      </button>
                      <span className={styles.toolbarCount}>
                        {acceptedSuggestions.size} од {aiSuggestions.length} прифатени
                      </span>
                    </div>

                    <div className={styles.suggestionsList}>
                      {aiSuggestions.map((suggestion, index) => {
                        const isAccepted = acceptedSuggestions.has(index);
                        const isDismissed = dismissedSuggestions.has(index);

                        return (
                          <div
                            key={index}
                            className={`${styles.suggestionItem} ${isAccepted ? styles.suggestionAccepted : ''} ${isDismissed ? styles.suggestionDismissed : ''}`}
                          >
                            <div className={styles.suggestionMain} onClick={() => toggleSuggestion(index)}>
                              <div className={styles.suggestionCheckbox}>
                                {isAccepted ? (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#22c55e" stroke="white" strokeWidth="2">
                                    <rect x="2" y="2" width="20" height="20" rx="4" />
                                    <polyline points="7 13 10 16 17 9" />
                                  </svg>
                                ) : (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2">
                                    <rect x="2" y="2" width="20" height="20" rx="4" />
                                  </svg>
                                )}
                              </div>
                              <div className={styles.suggestionContent}>
                                <div className={styles.suggestionLabel}>{suggestion.label}</div>
                                <div className={styles.suggestionOriginal}>
                                  <span className={styles.suggestionQuote}>"{suggestion.originalText}"</span>
                                </div>
                                <div className={styles.suggestionMeta}>
                                  <span className={styles.suggestionType}>{TYPE_LABELS[suggestion.type] || suggestion.type}</span>
                                  <span className={styles.suggestionName}>{`{${suggestion.name}}`}</span>
                                  {suggestion.required && <span className={styles.suggestionRequired}>задолжително</span>}
                                  {suggestion.type === 'companyData' && suggestion.companyField && (
                                    <span className={styles.suggestionCompany}>{suggestion.companyField}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              className={styles.suggestionDismissBtn}
                              onClick={(e) => { e.stopPropagation(); dismissSuggestion(index); }}
                              title="Отстрани"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : null}

                <div className={styles.suggestionsActions}>
                  {aiSuggestions.length > 0 && acceptedSuggestions.size > 0 && (
                    <button className={styles.suggestionsConfirm} onClick={proceedFromSuggestions}>
                      Потврди {acceptedSuggestions.size} полиња и продолжи
                    </button>
                  )}
                  <button className={styles.suggestionsSkip} onClick={skipSuggestions}>
                    {aiSuggestions.length > 0 && acceptedSuggestions.size > 0 ? 'Прескокни AI предлози' : 'Продолжи рачно'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Preview & Mark Fields */}
          {step === 'preview' && (
            <div className={styles.builderLayout}>
              <div className={styles.previewPanel}>
                <div className={styles.panelHeader}>
                  <h2 className={styles.panelTitle}>Преглед на документот</h2>
                  <p className={styles.panelHint}>
                    Селектирајте (означете) текст кој сакате да биде динамично поле
                  </p>
                </div>
                <div
                  ref={previewContentRef}
                  className={styles.previewContent}
                  onMouseUp={handleTextSelection}
                  dangerouslySetInnerHTML={{ __html: htmlPreview }}
                />

                {/* Field definition popup */}
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
                        <option value="text">Текст</option>
                        <option value="number">Број</option>
                        <option value="date">Датум</option>
                        <option value="textarea">Долг текст</option>
                        <option value="select">Паѓачко мени</option>
                        <option value="companyData">Податоци од компанија</option>
                        <option value="checkbox">Чекбокс (условен параграф)</option>
                        <option value="calculated">Пресметано поле</option>
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
                          <option value="companyName">Име на компанија</option>
                          <option value="companyAddress">Адреса</option>
                          <option value="companyTaxNumber">Даночен број</option>
                          <option value="companyManager">Управител</option>
                          <option value="crnNumber">Матичен број</option>
                          <option value="companyPIN">ЕМБС</option>
                          <option value="phone">Телефон</option>
                          <option value="email">Е-пошта</option>
                          <option value="industry">Дејност</option>
                          <option value="website">Веб страна</option>
                        </select>
                      </div>
                    )}

                    {newField.type === 'calculated' && (
                      <div className={styles.popupField}>
                        <label className={styles.popupLabel}>Формула (пр. {'{firstName}'} {'{lastName}'})</label>
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
                        id="fieldRequired"
                        checked={newField.required}
                        onChange={e => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                      />
                      <label htmlFor="fieldRequired">Задолжително поле</label>
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

              {/* Fields sidebar */}
              <div className={styles.fieldsPanel}>
                <div className={styles.panelHeader}>
                  <h2 className={styles.panelTitle}>Динамични полиња ({fields.length})</h2>
                </div>

                {fields.length === 0 ? (
                  <div className={styles.fieldsEmpty}>
                    <p>Означете текст од документот за да додадете динамични полиња</p>
                  </div>
                ) : (
                  <div className={styles.fieldsList}>
                    {fields.map((field, index) => (
                      <div key={field.id} className={styles.fieldItem}>
                        <div className={styles.fieldItemHeader}>
                          <span className={styles.fieldIndex}>{index + 1}</span>
                          <span className={styles.fieldLabel}>{field.label}</span>
                          <button
                            className={styles.fieldRemove}
                            onClick={() => removeField(field.id)}
                            title="Отстрани"
                          >
                            ×
                          </button>
                        </div>
                        <div className={styles.fieldItemMeta}>
                          <span className={styles.fieldTag}>{`{${field.name}}`}</span>
                          <span className={styles.fieldType}>
                            {field.type === 'companyData' ? `компанија: ${field.companyField}` : field.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.fieldsPanelFooter}>
                  <button
                    className={styles.nextButton}
                    onClick={() => setStep('save')}
                    disabled={fields.length === 0}
                  >
                    Продолжи
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Save */}
          {step === 'save' && (
            <div className={styles.saveSection}>
              <div className={styles.saveCard}>
                <h2 className={styles.saveTitle}>Зачувај шаблон</h2>

                <div className={styles.saveField}>
                  <label className={styles.saveLabel}>Име на шаблонот *</label>
                  <input
                    type="text"
                    className={styles.saveInput}
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    placeholder="пр. Договор за вработување"
                  />
                </div>

                <div className={styles.saveField}>
                  <label className={styles.saveLabel}>Опис (опционално)</label>
                  <textarea
                    className={styles.saveTextarea}
                    value={templateDescription}
                    onChange={e => setTemplateDescription(e.target.value)}
                    placeholder="Краток опис на шаблонот..."
                    rows={3}
                  />
                </div>

                <div className={styles.saveField}>
                  <label className={styles.saveLabel}>Категорија (опционално)</label>
                  <select
                    className={styles.saveInput}
                    value={templateCategory}
                    onChange={e => setTemplateCategory(e.target.value)}
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

                <div className={styles.saveSummary}>
                  <h3>Резиме</h3>
                  <p>Датотека: <strong>{originalFileName}</strong></p>
                  <p>Број на полиња: <strong>{fields.length}</strong></p>
                  <div className={styles.saveSummaryFields}>
                    {fields.map(f => (
                      <span key={f.id} className={styles.saveSummaryTag}>
                        {f.label} ({f.type})
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.saveActions}>
                  <button
                    className={styles.backButton}
                    onClick={() => setStep('preview')}
                  >
                    Назад
                  </button>
                  <button
                    className={styles.saveButton}
                    onClick={handleSave}
                    disabled={loading || !templateName.trim()}
                  >
                    {loading ? 'Се зачувува...' : 'Зачувај шаблон'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MyTemplateBuilder;
