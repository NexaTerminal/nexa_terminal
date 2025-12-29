import React, { useState, useRef } from 'react';
import ApiService from '../../../services/api';
import styles from '../../../styles/terminal/admin/ManageChatbot.module.css';

/**
 * Upload Document Modal Component
 * Handles PDF/DOCX file upload with drag-and-drop support
 */
const UploadDocumentModal = ({ onClose, onSuccess, showMessage }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const allowedExtensions = ['.pdf', '.docx'];

  const validateFile = (selectedFile) => {
    if (!selectedFile) return false;

    // Check file type
    if (!allowedTypes.includes(selectedFile.type)) {
      showMessage('error', 'Невалиден тип на фајл. Дозволени се само PDF и DOCX фајлови.');
      return false;
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (selectedFile.size > maxSize) {
      showMessage('error', 'Фајлот е преголем. Максимална големина е 50MB.');
      return false;
    }

    return true;
  };

  const handleFileSelect = (selectedFile) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showMessage('error', 'Изберете фајл за upload');
      return;
    }

    try {
      setUploading(true);
      setProgress(10);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await ApiService.uploadChatbotDocument(file);

      clearInterval(progressInterval);
      setProgress(100);

      if (response.success) {
        const chunkCount = response.data?.chunkCount || response.chunkCount || 0;
        setTimeout(() => {
          showMessage('success', `Документот е успешно процесиран! Креирани ${chunkCount} парчиња.`);
          onSuccess();
        }, 500);
      } else {
        showMessage('error', response.message || 'Неуспешен upload на документ');
        setUploading(false);
        setProgress(0);
      }
    } catch (error) {
      console.error('Upload error:', error);
      showMessage('error', error.message || 'Грешка при upload на документ');
      setUploading(false);
      setProgress(0);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>📤 Додади нов документ</h3>
          <button className={styles.closeButton} onClick={onClose} disabled={uploading}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {!file ? (
            <>
              <div
                className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={styles.dropzoneIcon}>📁</div>
                <p className={styles.dropzoneText}>
                  Повлечете документ овде или кликнете за да изберете
                </p>
                <p className={styles.dropzoneHint}>
                  Дозволени формати: PDF, DOCX (макс. 50MB)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={allowedExtensions.join(',')}
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </>
          ) : (
            <div className={styles.filePreview}>
              <div className={styles.fileInfo}>
                <div className={styles.fileIcon}>
                  {file.name.endsWith('.pdf') ? '📕' : '📘'}
                </div>
                <div className={styles.fileDetails}>
                  <div className={styles.fileName}>{file.name}</div>
                  <div className={styles.fileSize}>{formatFileSize(file.size)}</div>
                </div>
                {!uploading && (
                  <button
                    className={styles.removeFileButton}
                    onClick={() => setFile(null)}
                    title="Отстрани фајл"
                  >
                    ✕
                  </button>
                )}
              </div>

              {uploading && (
                <div className={styles.uploadProgress}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className={styles.progressText}>
                    {progress < 100 ? `Процесирање... ${progress}%` : 'Завршено! ✓'}
                  </div>
                </div>
              )}

              {!uploading && (
                <div className={styles.uploadInfo}>
                  <p className={styles.infoText}>
                    ℹ️ Документот ќе биде автоматски процесиран и додаден во chatbot базата.
                    Процесот вклучува екстракција на текст, интелигентно парчење и генерирање на embeddings.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.secondaryButton}
            onClick={onClose}
            disabled={uploading}
          >
            Откажи
          </button>
          <button
            className={styles.primaryButton}
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? 'Процесирање...' : '📤 Upload документ'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadDocumentModal;
