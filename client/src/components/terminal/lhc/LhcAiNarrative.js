import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../../../services/api';
import styles from '../../../styles/terminal/lhc/ComplianceCheck.module.css';

// Lazily generates (and server-side caches) a plain-language AI advisory for a
// stored LHC assessment. Fail-quiet: renders nothing if it can't be produced,
// so the report is always fully usable without it. Shared by every LHC report.
export default function LhcAiNarrative({ assessmentId }) {
  const [narrative, setNarrative] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!assessmentId) return;
    let active = true;
    setLoading(true);
    api.post(`/lhc/narrative/${assessmentId}`)
      .then((r) => { if (active && r && r.success) setNarrative(r.narrative); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [assessmentId]);

  if (!loading && !narrative) return null;

  return (
    <div className={styles['ai-narrative-section']}>
      <div className={styles['ai-narrative-header']}>
        <h2>🧠 Резиме и препораки</h2>
        <span className={styles['ai-narrative-badge']}>генерирано од АИ</span>
      </div>
      {loading && !narrative ? (
        <p className={styles['ai-narrative-loading']}>Се генерира резиме прилагодено на вашиот извештај…</p>
      ) : (
        <div className={styles['ai-narrative-body']}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{narrative}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
