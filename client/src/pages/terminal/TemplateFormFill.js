import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { getTemplate, generateDocument } from '../../services/customTemplateApi';
import styles from '../../styles/terminal/TemplateFormFill.module.css';

const TemplateFormFill = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  // Auto-calculate fields when formData changes
  useEffect(() => {
    if (!template?.fields) return;

    const calculatedFields = template.fields.filter(f => f.type === 'calculated' && f.formula);
    if (calculatedFields.length === 0) return;

    const updates = {};
    let hasChanges = false;

    for (const field of calculatedFields) {
      let result = field.formula;
      // Replace {fieldName} placeholders with actual values
      result = result.replace(/\{(\w+)\}/g, (_, name) => formData[name] || '');
      if (formData[field.name] !== result) {
        updates[field.name] = result;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      setFormData(prev => ({ ...prev, ...updates }));
    }
  }, [formData, template?.fields]);

  const fetchTemplate = async () => {
    try {
      const data = await getTemplate(templateId);
      setTemplate(data);

      // Initialize form data — auto-fill companyData fields from user profile
      const companyInfo = currentUser?.companyInfo || {};
      const initial = {};
      (data.fields || []).forEach(field => {
        if (field.type === 'companyData' && field.companyField) {
          initial[field.name] = companyInfo[field.companyField] || companyInfo[field.companyField.replace('company', '').toLowerCase()] || '';
        } else if (field.type === 'checkbox') {
          initial[field.name] = true;
        } else {
          initial[field.name] = '';
        }
      });
      setFormData(initial);
    } catch (err) {
      setError('Шаблонот не е пронајден');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    // Validate required fields (skip checkbox and calculated)
    const missingFields = (template.fields || [])
      .filter(f => f.required && f.type !== 'checkbox' && f.type !== 'calculated' && !formData[f.name]?.toString().trim())
      .map(f => f.label);

    if (missingFields.length > 0) {
      setError(`Пополнете ги задолжителните полиња: ${missingFields.join(', ')}`);
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const blob = await generateDocument(templateId, formData);

      // Download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Грешка при генерирање на документот');
    } finally {
      setGenerating(false);
    }
  };

  // Live preview: replace field placeholders in HTML
  const previewHtml = useMemo(() => {
    if (!template?.htmlPreview) return '';

    let html = template.htmlPreview;
    (template.fields || []).forEach(field => {
      if (!field.originalText) return;

      const value = formData[field.name];
      let replacement;

      if (field.type === 'checkbox') {
        // For checkbox: show or hide the text
        if (value) {
          replacement = `<span class="${styles.previewFilled}">${field.originalText}</span>`;
        } else {
          replacement = `<span class="${styles.previewHidden}">${field.originalText}</span>`;
        }
      } else if (value && value.toString().trim()) {
        replacement = `<span class="${styles.previewFilled}">${value}</span>`;
      } else {
        replacement = `<span class="${styles.previewUnfilled}">${field.originalText}</span>`;
      }

      html = html.replace(field.originalText, replacement);
    });

    return html;
  }, [template, formData]);

  const renderField = (field) => {
    if (field.type === 'calculated') {
      return (
        <div className={styles.calculatedWrapper}>
          <input
            type="text"
            id={field.name}
            value={formData[field.name] || ''}
            readOnly
            className={`${styles.input} ${styles.calculatedInput}`}
          />
          <span className={styles.calculatedBadge}>пресметано</span>
        </div>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <div className={styles.checkboxWrapper}>
          <input
            type="checkbox"
            id={field.name}
            checked={!!formData[field.name]}
            onChange={(e) => handleChange(field.name, e.target.checked)}
            className={styles.checkbox}
          />
          <label htmlFor={field.name} className={styles.checkboxLabel}>
            Вклучи го овој параграф
          </label>
        </div>
      );
    }

    const commonProps = {
      id: field.name,
      value: formData[field.name] || '',
      onChange: (e) => handleChange(field.name, e.target.value),
      placeholder: field.placeholder || field.label,
      required: field.required,
      className: styles.input
    };

    switch (field.type) {
      case 'textarea':
        return <textarea {...commonProps} rows={4} className={styles.textarea} />;
      case 'date':
        return <input type="date" {...commonProps} />;
      case 'number':
        return <input type="number" {...commonProps} />;
      case 'select':
        return (
          <select {...commonProps} className={styles.input}>
            <option value="">-- Избери --</option>
            {(field.options || []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'companyData':
        return (
          <div className={styles.companyFieldWrapper}>
            <input type="text" {...commonProps} />
            {formData[field.name] && (
              <span className={styles.autoFillBadge}>auto</span>
            )}
          </div>
        );
      default:
        return <input type="text" {...commonProps} />;
    }
  };

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
            ← Назад кон шаблони
          </button>

          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>{template.name}</h1>
            {template.description && (
              <p className={styles.formDescription}>{template.description}</p>
            )}
            <p className={styles.formHint}>
              Пополнете ги полињата и генерирајте го документот
            </p>
          </div>

          {error && (
            <div className={styles.errorBanner}>
              {error}
              <button onClick={() => setError('')} className={styles.errorDismiss}>×</button>
            </div>
          )}

          <div className={styles.formPreviewLayout}>
            {/* Left: Form */}
            <div className={styles.formColumn}>
              <form onSubmit={handleGenerate}>
                <div className={styles.fieldsGrid}>
                  {(template.fields || []).map(field => (
                    <div key={field.id || field.name} className={styles.formField}>
                      <label htmlFor={field.name} className={styles.label}>
                        {field.label}
                        {field.required && <span className={styles.required}>*</span>}
                      </label>
                      {renderField(field)}
                    </div>
                  ))}
                </div>

                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className={styles.generateButton}
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <span className={styles.buttonSpinner} />
                        Се генерира...
                      </>
                    ) : (
                      'Генерирај документ'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Live Preview */}
            {template.htmlPreview && (
              <div className={styles.previewColumn}>
                <div className={styles.previewHeader}>
                  <h3 className={styles.previewTitle}>Преглед</h3>
                </div>
                <div
                  className={styles.previewContent}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TemplateFormFill;
