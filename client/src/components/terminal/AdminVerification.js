import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import styles from '../../styles/terminal/AdminVerification.module.css';
import ProfileRequired from '../common/ProfileRequired';

const AdminVerification = () => {
  const { t } = useTranslation();
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [reviewAction, setReviewAction] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [additionalInfoRequested, setAdditionalInfoRequested] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchVerifications();
  }, [filter]);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/verification/admin/requests?status=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVerifications(response.data.verifications);
    } catch (error) {
      setError(t('adminVerification.errors.fetchFailed'));
      console.error('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (verificationId) => {
    if (!reviewAction) {
      setError(t('adminVerification.errors.selectAction'));
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        action: reviewAction,
        reviewNotes,
        rejectionReason: reviewAction === 'reject' ? rejectionReason : '',
        additionalInfoRequested: reviewAction === 'request_info' ? additionalInfoRequested : ''
      };

      await axios.post(`/api/verification/admin/review/${verificationId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(t('adminVerification.success.reviewSuccess', { action: reviewAction }));
      setSelectedVerification(null);
      setReviewAction('');
      setReviewNotes('');
      setRejectionReason('');
      setAdditionalInfoRequested('');
      fetchVerifications(); // Refresh the list

    } catch (error) {
      setError(error.response?.data?.message || t('adminVerification.errors.reviewFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#00ff00';
      case 'rejected': return '#ff0000';
      case 'requires_additional_info': return '#ffaa00';
      case 'under_review': return '#0099ff';
      default: return '#ffff00';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return t('adminVerification.statusText.approved');
      case 'rejected': return t('adminVerification.statusText.rejected');
      case 'requires_additional_info': return t('adminVerification.statusText.requiresAdditionalInfo');
      case 'under_review': return t('adminVerification.statusText.underReview');
      case 'pending': return t('adminVerification.statusText.pending');
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openVerificationDetails = (verification) => {
    setSelectedVerification(verification);
    setReviewAction('');
    setReviewNotes('');
    setRejectionReason('');
    setAdditionalInfoRequested('');
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('adminVerification.loading')}</div>
      </div>
    );
  }

  return (
    <ProfileRequired>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>{t('adminVerification.title')}</h2>
          <p>{t('adminVerification.subtitle')}</p>
        </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.filters}>
        <button 
          className={`${styles.filterBtn} ${filter === 'pending' ? styles.active : ''}`}
          onClick={() => setFilter('pending')}
        >
          {t('adminVerification.filters.pending')} ({verifications.filter(v => v.status === 'pending').length})
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === 'under_review' ? styles.active : ''}`}
          onClick={() => setFilter('under_review')}
        >
          {t('adminVerification.filters.underReview')}
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === 'approved' ? styles.active : ''}`}
          onClick={() => setFilter('approved')}
        >
          {t('adminVerification.filters.approved')}
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === 'rejected' ? styles.active : ''}`}
          onClick={() => setFilter('rejected')}
        >
          {t('adminVerification.filters.rejected')}
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          {t('adminVerification.filters.all')}
        </button>
      </div>

      <div className={styles.verificationsList}>
        {verifications.length === 0 ? (
          <div className={styles.noResults}>
            {t('adminVerification.noResults', { filter })}
          </div>
        ) : (
          verifications.map((verification) => (
            <div key={verification._id} className={styles.verificationCard}>
              <div className={styles.cardHeader}>
                <div className={styles.companyInfo}>
                  <h3>{verification.companyInfo?.companyName || t('adminVerification.unknownCompany')}</h3>
                  <p>{verification.companyInfo?.industry}</p>
                </div>
                <div className={styles.cardStatus}>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(verification.status) }}
                  >
                    {getStatusText(verification.status)}
                  </span>
                  <div className={styles.score}>
                    {t('adminVerification.scoreLabel')} {verification.autoApprovalScore}/100
                  </div>
                </div>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.userInfo}>
                  <strong>{t('adminVerification.userLabel')}</strong> {verification.user?.email || t('adminVerification.unknownUser')}
                </div>
                <div className={styles.submittedDate}>
                  <strong>{t('adminVerification.submittedLabel')}</strong> {formatDate(verification.submittedAt)}
                </div>
                {verification.reviewedAt && (
                  <div className={styles.reviewedDate}>
                    <strong>{t('adminVerification.reviewedLabel')}</strong> {formatDate(verification.reviewedAt)}
                  </div>
                )}
              </div>

              <div className={styles.cardActions}>
                <button 
                  className={styles.viewBtn}
                  onClick={() => openVerificationDetails(verification)}
                >
                  {t('adminVerification.viewDetails')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Verification Details Modal */}
      {selectedVerification && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{t('adminVerification.modal.title')}</h3>
              <button 
                className={styles.closeBtn}
                onClick={() => setSelectedVerification(null)}
              >
                {t('adminVerification.modal.close')}
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.section}>
                <h4>{t('adminVerification.modal.companyInfo')}</h4>
                <div className={styles.infoGrid}>
                  <div><strong>{t('adminVerification.modal.nameLabel')}</strong> {selectedVerification.companyInfo?.companyName}</div>
                  <div><strong>{t('adminVerification.modal.industryLabel')}</strong> {selectedVerification.companyInfo?.industry}</div>
                  <div><strong>{t('adminVerification.modal.crnLabel')}</strong> {selectedVerification.companyInfo?.crnNumber || t('adminVerification.modal.notProvided')}</div>
                  <div><strong>{t('adminVerification.modal.websiteLabel')}</strong> 
                    {selectedVerification.companyInfo?.website ? (
                      <a href={selectedVerification.companyInfo.website} target="_blank" rel="noopener noreferrer">
                        {selectedVerification.companyInfo.website}
                      </a>
                    ) : t('adminVerification.modal.notProvided')}
                  </div>
                  <div><strong>{t('adminVerification.modal.emailLabel')}</strong> {selectedVerification.companyInfo?.email}</div>
                  <div><strong>{t('adminVerification.modal.phoneLabel')}</strong> {selectedVerification.companyInfo?.phone}</div>
                </div>
                
                <div className={styles.description}>
                  <strong>{t('adminVerification.modal.missionLabel')}</strong>
                  <p>{selectedVerification.companyInfo?.mission}</p>
                </div>
                
                <div className={styles.description}>
                  <strong>{t('adminVerification.modal.descriptionLabel')}</strong>
                  <p>{selectedVerification.companyInfo?.description}</p>
                </div>

                <div className={styles.description}>
                  <strong>{t('adminVerification.modal.addressLabel')}</strong>
                  <p>{selectedVerification.companyInfo?.address}</p>
                </div>
              </div>

              <div className={styles.section}>
                <h4>{t('adminVerification.modal.verificationStatus')}</h4>
                <div className={styles.statusInfo}>
                  <div><strong>{t('adminVerification.modal.statusLabel')}</strong> 
                    <span 
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(selectedVerification.status) }}
                    >
                      {getStatusText(selectedVerification.status)}
                    </span>
                  </div>
                  <div><strong>{t('adminVerification.modal.autoApprovalScore')}</strong> {selectedVerification.autoApprovalScore}/100</div>
                  <div><strong>{t('adminVerification.submittedLabel')}</strong> {formatDate(selectedVerification.submittedAt)}</div>
                </div>

                {selectedVerification.documents && selectedVerification.documents.length > 0 && (
                  <div className={styles.documents}>
                    <strong>{t('adminVerification.modal.uploadedDocuments')}</strong>
                    <ul>
                      {selectedVerification.documents.map((doc, index) => (
                        <li key={index}>
                          {doc.fileName} ({doc.type})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {selectedVerification.status === 'pending' && (
                <div className={styles.section}>
                  <h4>{t('adminVerification.modal.reviewAction')}</h4>
                  
                  <div className={styles.actionButtons}>
                    <button 
                      className={`${styles.actionBtn} ${styles.approve} ${reviewAction === 'approve' ? styles.active : ''}`}
                      onClick={() => setReviewAction('approve')}
                    >
                      {t('adminVerification.modal.approve')}
                    </button>
                    <button 
                      className={`${styles.actionBtn} ${styles.reject} ${reviewAction === 'reject' ? styles.active : ''}`}
                      onClick={() => setReviewAction('reject')}
                    >
                      {t('adminVerification.modal.reject')}
                    </button>
                    <button 
                      className={`${styles.actionBtn} ${styles.requestInfo} ${reviewAction === 'request_info' ? styles.active : ''}`}
                      onClick={() => setReviewAction('request_info')}
                    >
                      {t('adminVerification.modal.requestInfo')}
                    </button>
                  </div>

                  <div className={styles.reviewForm}>
                    <div className={styles.formGroup}>
                      <label>{t('adminVerification.modal.reviewNotesLabel')}</label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder={t('adminVerification.modal.reviewNotesPlaceholder')}
                        rows="3"
                      />
                    </div>

                    {reviewAction === 'reject' && (
                      <div className={styles.formGroup}>
                        <label>{t('adminVerification.modal.rejectionReasonLabel')}</label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder={t('adminVerification.modal.rejectionReasonPlaceholder')}
                          rows="3"
                          required
                        />
                      </div>
                    )}

                    {reviewAction === 'request_info' && (
                      <div className={styles.formGroup}>
                        <label>{t('adminVerification.modal.additionalInfoLabel')}</label>
                        <textarea
                          value={additionalInfoRequested}
                          onChange={(e) => setAdditionalInfoRequested(e.target.value)}
                          placeholder={t('adminVerification.modal.additionalInfoPlaceholder')}
                          rows="3"
                          required
                        />
                      </div>
                    )}

                    {reviewAction && (
                      <button 
                        className={styles.submitReviewBtn}
                        onClick={() => handleReview(selectedVerification._id)}
                        disabled={submitting}
                      >
                        {submitting ? t('adminVerification.modal.processing') : t('adminVerification.modal.submitReview', { action: reviewAction })}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {selectedVerification.reviewNotes && (
                <div className={styles.section}>
                  <h4>{t('adminVerification.modal.previousNotes')}</h4>
                  <p>{selectedVerification.reviewNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </ProfileRequired>
  );
};

export default AdminVerification;
