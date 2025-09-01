import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/terminal/UserProfile.module.css';

const UserProfile = ({ 
  isEditable = true, 
  showCompanyInfo = true, 
  compact = false,
  onProfileUpdate 
}) => {
  const { t } = useTranslation();
  const { currentUser, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    bio: currentUser?.bio || '',
    role: currentUser?.role || '',
    phone: currentUser?.phone || '',
    profileImage: currentUser?.profileImage || null,
    companyInfo: {
      companyName: currentUser?.companyInfo?.companyName || '',
      position: currentUser?.companyInfo?.position || '',
      address: currentUser?.companyInfo?.address || '',
      taxNumber: currentUser?.companyInfo?.taxNumber || ''
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('companyInfo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        companyInfo: {
          ...prev.companyInfo,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError(t('profile.imageTooLarge'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          profileImage: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await updateProfile(formData);
      if (response.success) {
        setSuccess(t('profile.updateSuccess'));
        setIsEditing(false);
        onProfileUpdate && onProfileUpdate(response.user);
      }
    } catch (err) {
      setError(err.message || t('profile.updateError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to current user data
    setFormData({
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      email: currentUser?.email || '',
      bio: currentUser?.bio || '',
      role: currentUser?.role || '',
      phone: currentUser?.phone || '',
      profileImage: currentUser?.profileImage || null,
      companyInfo: {
        companyName: currentUser?.companyInfo?.companyName || '',
        position: currentUser?.companyInfo?.position || '',
        address: currentUser?.companyInfo?.address || '',
        taxNumber: currentUser?.companyInfo?.taxNumber || ''
      }
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const getInitials = () => {
    const firstName = formData.firstName || currentUser?.firstName || '';
    const lastName = formData.lastName || currentUser?.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getDisplayName = () => {
    const firstName = formData.firstName || currentUser?.firstName;
    const lastName = formData.lastName || currentUser?.lastName;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return currentUser?.username || currentUser?.email || t('profile.unnamed');
  };

  const isVerified = currentUser?.isVerified || false;
  const hasCompanyInfo = currentUser?.companyInfo?.companyName;

  if (!currentUser) {
    return (
      <div className={`${styles.profileCard} ${compact ? styles.compact : ''}`}>
        <div className={styles.loading}>
          {t('common.loading')}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.profileCard} ${compact ? styles.compact : ''}`}>
      {/* Profile Header */}
      <div className={styles.profileHeader}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarContainer}>
            {formData.profileImage || currentUser?.profileImage ? (
              <img 
                src={formData.profileImage || currentUser.profileImage} 
                alt={t('profile.profileImage')}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {getInitials()}
              </div>
            )}
            {isEditing && (
              <button
                type="button"
                className={styles.imageUploadBtn}
                onClick={() => fileInputRef.current?.click()}
                aria-label={t('profile.changePhoto')}
              >
                <span className={styles.cameraIcon}>📷</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className={styles.hiddenInput}
          />
        </div>

        <div className={styles.basicInfo}>
          <div className={styles.nameSection}>
            {isEditing ? (
              <div className={styles.nameInputs}>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder={t('profile.firstName')}
                  className={styles.nameInput}
                />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder={t('profile.lastName')}
                  className={styles.nameInput}
                />
              </div>
            ) : (
              <h2 className={styles.userName}>{getDisplayName()}</h2>
            )}
          </div>

          <div className={styles.statusSection}>
            {isVerified && (
              <span className={`${styles.badge} ${styles.verifiedBadge}`}>
                <span className={styles.badgeIcon}>✓</span>
                {t('profile.verified')}
              </span>
            )}
            {currentUser?.role && (
              <span className={`${styles.badge} ${styles.roleBadge}`}>
                {currentUser.role}
              </span>
            )}
          </div>
        </div>

        {isEditable && !compact && (
          <div className={styles.actionSection}>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className={styles.editBtn}
                aria-label={t('profile.editProfile')}
              >
                <span className={styles.editIcon}>✏️</span>
                {t('profile.edit')}
              </button>
            ) : (
              <div className={styles.editActions}>
                <button
                  onClick={handleCancel}
                  className={`${styles.btn} ${styles.cancelBtn}`}
                  disabled={isLoading}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSubmit}
                  className={`${styles.btn} ${styles.saveBtn}`}
                  disabled={isLoading}
                >
                  {isLoading ? t('common.saving') : t('common.save')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
      {success && (
        <div className={styles.successMessage}>
          {success}
        </div>
      )}

      {/* Contact Information */}
      {!compact && (
        <div className={styles.contactSection}>
          <h3 className={styles.sectionTitle}>
            {t('profile.contactInformation')}
          </h3>
          
          <div className={styles.contactGrid}>
            <div className={styles.contactItem}>
              <label className={styles.contactLabel}>
                {t('profile.email')}
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={styles.contactInput}
                />
              ) : (
                <span className={styles.contactValue}>
                  {currentUser.email}
                </span>
              )}
            </div>

            <div className={styles.contactItem}>
              <label className={styles.contactLabel}>
                {t('profile.phone')}
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={t('profile.phonePlaceholder')}
                  className={styles.contactInput}
                />
              ) : (
                <span className={styles.contactValue}>
                  {currentUser.phone || t('profile.notProvided')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bio Section */}
      {!compact && (
        <div className={styles.bioSection}>
          <h3 className={styles.sectionTitle}>
            {t('profile.about')}
          </h3>
          
          {isEditing ? (
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder={t('profile.bioPlaceholder')}
              className={styles.bioInput}
              rows="4"
            />
          ) : (
            <p className={styles.bioText}>
              {currentUser.bio || t('profile.noBio')}
            </p>
          )}
        </div>
      )}

      {/* Company Information */}
      {showCompanyInfo && hasCompanyInfo && !compact && (
        <div className={styles.companySection}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.companyIcon}>🏢</span>
            {t('profile.companyInformation')}
          </h3>

          <div className={styles.companyGrid}>
            <div className={styles.companyItem}>
              <label className={styles.companyLabel}>
                {t('profile.companyName')}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="companyInfo.companyName"
                  value={formData.companyInfo.companyName}
                  onChange={handleInputChange}
                  className={styles.companyInput}
                />
              ) : (
                <span className={styles.companyValue}>
                  {currentUser.companyInfo.companyName}
                </span>
              )}
            </div>

            <div className={styles.companyItem}>
              <label className={styles.companyLabel}>
                {t('profile.position')}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="companyInfo.position"
                  value={formData.companyInfo.position}
                  onChange={handleInputChange}
                  className={styles.companyInput}
                />
              ) : (
                <span className={styles.companyValue}>
                  {currentUser.companyInfo.position || t('profile.notProvided')}
                </span>
              )}
            </div>

            <div className={styles.companyItem}>
              <label className={styles.companyLabel}>
                {t('profile.address')}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="companyInfo.address"
                  value={formData.companyInfo.address}
                  onChange={handleInputChange}
                  className={styles.companyInput}
                />
              ) : (
                <span className={styles.companyValue}>
                  {currentUser.companyInfo.address || t('profile.notProvided')}
                </span>
              )}
            </div>

            <div className={styles.companyItem}>
              <label className={styles.companyLabel}>
                {t('profile.taxNumber')}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="companyInfo.taxNumber"
                  value={formData.companyInfo.taxNumber}
                  onChange={handleInputChange}
                  className={styles.companyInput}
                />
              ) : (
                <span className={styles.companyValue}>
                  {currentUser.companyInfo.taxNumber || t('profile.notProvided')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save/Cancel buttons for mobile */}
      {isEditing && compact && (
        <div className={styles.mobileActions}>
          <button
            onClick={handleCancel}
            className={`${styles.btn} ${styles.cancelBtn}`}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            className={`${styles.btn} ${styles.saveBtn}`}
            disabled={isLoading}
          >
            {isLoading ? t('common.saving') : t('common.save')}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;