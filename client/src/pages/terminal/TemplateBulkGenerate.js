import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import { getTemplate, bulkGenerate } from '../../services/customTemplateApi';
import styles from '../../styles/terminal/TemplateBulkGenerate.module.css';

const TemplateBulkGenerate = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const data = await getTemplate(templateId);
      setTemplate(data);
    } catch (err) {
      setError('Шаблонот не е пронајден');
    } finally {
      setLoading(false);
    }
  };

  const processFile = async (f) => {
    if (!f) return;

    const ext = f.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      setError('Дозволени се само .csv, .xlsx или .xls датотеки');
      return;
    }

    setFile(f);
    setError('');

    // Parse preview client-side (first 5 rows)
    try {
      const XLSX = await import('xlsx');
      const buffer = await f.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (rows.length === 0) {
        setError('Датотеката е празна');
        setFile(null);
        return;
      }

      setPreviewData({
        headers: Object.keys(rows[0]),
        rows: rows.slice(0, 5),
        totalRows: rows.length
      });
    } catch (err) {
      setError('Грешка при читање на датотеката');
      setFile(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    processFile(e.dataTransfer?.files?.[0]);
  };

  const handleGenerate = async () => {
    if (!file || !template) return;

    setGenerating(true);
    setError('');

    try {
      const blob = await bulkGenerate(templateId, file);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name}_масовно.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Грешка при масовно генерирање');
    } finally {
      setGenerating(false);
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

          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Масовно генерирање</h1>
            <p className={styles.pageSubtitle}>
              Шаблон: <strong>{template.name}</strong>
            </p>
          </div>

          {error && (
            <div className={styles.errorBanner}>
              {error}
              <button onClick={() => setError('')} className={styles.errorDismiss}>×</button>
            </div>
          )}

          {/* Expected fields reference */}
          <div className={styles.fieldsReference}>
            <h3 className={styles.fieldsReferenceTitle}>Потребни колони во датотеката</h3>
            <div className={styles.fieldsRefList}>
              {(template.fields || []).map(f => (
                <span key={f.name} className={styles.fieldRefTag}>{f.name}</span>
              ))}
            </div>
          </div>

          {/* Upload zone */}
          <div
            className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? (
              <div className={styles.fileInfo}>
                <span className={styles.fileIcon}>📄</span>
                <span className={styles.fileName}>{file.name}</span>
                <button
                  className={styles.fileClear}
                  onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewData(null); }}
                >
                  ×
                </button>
              </div>
            ) : (
              <>
                <p className={styles.dropTitle}>Повлечете CSV или Excel датотека</p>
                <p className={styles.dropSubtitle}>или кликнете за да изберете</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={e => processFile(e.target.files?.[0])}
            style={{ display: 'none' }}
          />

          {/* Preview table */}
          {previewData && (
            <div className={styles.previewSection}>
              <div className={styles.previewHeader}>
                <h3>Преглед (првите {Math.min(5, previewData.totalRows)} од {previewData.totalRows} редови)</h3>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {previewData.headers.map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.map((row, i) => (
                      <tr key={i}>
                        {previewData.headers.map(h => (
                          <td key={h}>{row[h]?.toString() || ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.generateSection}>
                <div className={styles.costInfo}>
                  <span>Вкупно документи: <strong>{previewData.totalRows}</strong></span>
                  <span>Кредити: <strong>{previewData.totalRows}</strong></span>
                </div>
                <button
                  className={styles.generateButton}
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <span className={styles.buttonSpinner} />
                      Се генерира...
                    </>
                  ) : (
                    `Генерирај ${previewData.totalRows} документи`
                  )}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TemplateBulkGenerate;
