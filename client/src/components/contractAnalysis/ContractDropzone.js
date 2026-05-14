import React, { useRef, useState } from 'react';
import styles from '../../styles/terminal/ContractAnalysis.module.css';

const ACCEPT = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export default function ContractDropzone({ onFile, disabled }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.pdf') && !lower.endsWith('.docx')) {
      alert('Поддржани се само .pdf и .docx датотеки.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Датотеката е поголема од 10MB.');
      return;
    }
    onFile(file);
  };

  return (
    <div
      className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''} ${disabled ? styles.dropzoneDisabled : ''}`}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />
      <div className={styles.dropzoneIcon}>📄</div>
      <div className={styles.dropzoneTitle}>Прикачете договор</div>
      <div className={styles.dropzoneHint}>
        Влечете .pdf или .docx овде, или кликнете за избор.<br/>
        Максимум 10MB.
      </div>
    </div>
  );
}
