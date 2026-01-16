import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from '../../../styles/terminal/admin/CreateNewsletter.module.css';
import axios from 'axios';
import ApiService from '../../../services/api';

const CreateNewsletter = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    selectedBlogIds: []
  });

  // Available blogs
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  // Recent campaigns
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);

  // Fetch recent blogs
  useEffect(() => {
    fetchRecentBlogs();
    fetchCampaigns();
  }, []);

  const fetchRecentBlogs = async () => {
    try {
      const response = await axios.get('/api/newsletter/blogs/recent', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setRecentBlogs(response.data.blogs);
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setLoadingBlogs(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get('/api/newsletter/campaigns', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCampaigns(response.data.campaigns);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  // Toggle blog selection
  const toggleBlogSelection = (blogId) => {
    setFormData(prev => {
      const isSelected = prev.selectedBlogIds.includes(blogId);

      if (isSelected) {
        return {
          ...prev,
          selectedBlogIds: prev.selectedBlogIds.filter(id => id !== blogId)
        };
      } else {
        // Limit to 4 blogs
        if (prev.selectedBlogIds.length >= 4) {
          setError('Можете да изберете максимум 4 блога');
          setTimeout(() => setError(''), 3000);
          return prev;
        }
        return {
          ...prev,
          selectedBlogIds: [...prev.selectedBlogIds, blogId]
        };
      }
    });
  };

  // Create campaign
  const handleCreateCampaign = async () => {
    if (!formData.name || !formData.subject) {
      setError('Ве молиме пополнете ги сите задолжителни полиња');
      return;
    }

    if (formData.selectedBlogIds.length === 0) {
      setError('Ве молиме изберете најмалку еден блог');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const csrfToken = await ApiService.getCSRFToken();
      const headers = {
        Authorization: `Bearer ${token}`
      };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await axios.post('/api/newsletter/campaigns', formData, {
        headers
      });

      if (response.data.success) {
        setSuccess('Кампањата е успешно креирана');
        setFormData({ name: '', subject: '', selectedBlogIds: [] });
        fetchCampaigns();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при креирање на кампања');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Send campaign immediately
  const handleSendNow = async () => {
    if (!formData.name || !formData.subject || formData.selectedBlogIds.length === 0) {
      setError('Ве молиме пополнете ги сите полиња и изберете блогови');
      return;
    }

    if (!window.confirm('Дали сте сигурни дека сакате да го испратите билтенот веднаш до сите активни претплатници?')) {
      return;
    }

    setSending(true);
    setError('');

    try {
      const csrfToken = await ApiService.getCSRFToken();
      const headers = {
        Authorization: `Bearer ${token}`
      };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      // First create the campaign
      const createResponse = await axios.post('/api/newsletter/campaigns', formData, {
        headers
      });

      if (createResponse.data.success) {
        const campaignId = createResponse.data.campaign._id;

        // Then send it
        const sendResponse = await axios.post(
          `/api/newsletter/campaigns/${campaignId}/send`,
          {},
          { headers }
        );

        if (sendResponse.data.success) {
          setSuccess('Билтенот се испраќа до сите претплатници...');
          setFormData({ name: '', subject: '', selectedBlogIds: [] });
          fetchCampaigns();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при испраќање на билтен');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSending(false);
    }
  };

  // Schedule campaign
  const handleSchedule = async (e) => {
    e.preventDefault();

    if (!scheduleDate) {
      setError('Ве молиме изберете датум и време');
      return;
    }

    setSending(true);
    setError('');

    try {
      const csrfToken = await ApiService.getCSRFToken();
      const headers = {
        Authorization: `Bearer ${token}`
      };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      // First create the campaign
      const createResponse = await axios.post('/api/newsletter/campaigns', formData, {
        headers
      });

      if (createResponse.data.success) {
        const campaignId = createResponse.data.campaign._id;

        // Then schedule it
        const scheduleResponse = await axios.post(
          `/api/newsletter/campaigns/${campaignId}/schedule`,
          { scheduledFor: new Date(scheduleDate).toISOString() },
          { headers }
        );

        if (scheduleResponse.data.success) {
          setSuccess('Билтенот е успешно закажан');
          setFormData({ name: '', subject: '', selectedBlogIds: [] });
          setShowScheduleModal(false);
          setScheduleDate('');
          fetchCampaigns();
          setTimeout(() => setSuccess(''), 3000);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при закажување на билтен');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSending(false);
    }
  };

  // Send test email
  const handleSendTest = async (e) => {
    e.preventDefault();

    if (!testEmail) {
      setError('Ве молиме внесете email адреса');
      return;
    }

    setSending(true);
    setError('');

    try {
      const csrfToken = await ApiService.getCSRFToken();
      const headers = {
        Authorization: `Bearer ${token}`
      };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      // First create the campaign
      const createResponse = await axios.post('/api/newsletter/campaigns', formData, {
        headers
      });

      if (createResponse.data.success) {
        const campaignId = createResponse.data.campaign._id;

        // Then send test
        const testResponse = await axios.post(
          `/api/newsletter/campaigns/${campaignId}/test`,
          { testEmail },
          { headers }
        );

        if (testResponse.data.success) {
          setSuccess(`Тест email е испратен до ${testEmail}`);
          setShowTestModal(false);
          setTestEmail('');
          setTimeout(() => setSuccess(''), 3000);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при испраќање на тест email');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSending(false);
    }
  };

  // Delete campaign
  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('Дали сте сигурни дека сакате да ја избришете кампањата?')) {
      return;
    }

    try {
      const csrfToken = await ApiService.getCSRFToken();
      const headers = {
        Authorization: `Bearer ${token}`
      };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await axios.delete(`/api/newsletter/campaigns/${campaignId}`, {
        headers
      });

      if (response.data.success) {
        setSuccess('Кампањата е успешно избришана');
        fetchCampaigns();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при бришење на кампања');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      draft: { text: 'Нацрт', class: styles.draft },
      scheduled: { text: 'Закажано', class: styles.scheduled },
      sending: { text: 'Се испраќа', class: styles.sending },
      sent: { text: 'Испратено', class: styles.sent },
      failed: { text: 'Неуспешно', class: styles.failed }
    };

    const badge = badges[status] || badges.draft;
    return <span className={`${styles.badge} ${badge.class}`}>{badge.text}</span>;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Креирај билтен</h1>
          <p>Креирајте и испратете билтен до вашите претплатници</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div className={styles.successMessage}>
          <span className={styles.successIcon}>✅</span>
          {success}
        </div>
      )}

      {/* Campaign Form */}
      <div className={styles.formSection}>
        <h2>Детали за билтен</h2>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Име на кампања *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Билтен за декември 2024"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Наслов на email *</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Најновите вести од Nexa Terminal"
            />
          </div>
        </div>
      </div>

      {/* Blog Selection */}
      <div className={styles.blogSection}>
        <h2>Изберете блогови (максимум 4)</h2>
        <p className={styles.sectionDescription}>
          Изберете до 4 блогови кои ќе бидат прикажани во билтенот
        </p>

        {loadingBlogs ? (
          <div className={styles.loadingState}>Вчитување на блогови...</div>
        ) : (
          <div className={styles.blogGrid}>
            {recentBlogs.map(blog => (
              <div
                key={blog._id}
                className={`${styles.blogCard} ${
                  formData.selectedBlogIds.includes(blog._id) ? styles.selected : ''
                }`}
                onClick={() => toggleBlogSelection(blog._id)}
              >
                {blog.featuredImage && (
                  <img
                    src={blog.featuredImage}
                    alt={blog.title}
                    className={styles.blogImage}
                  />
                )}
                <div className={styles.blogContent}>
                  <h3>{blog.title}</h3>
                  <p>{blog.excerpt}</p>
                  <div className={styles.blogMeta}>
                    {new Date(blog.createdAt).toLocaleDateString('mk-MK')}
                  </div>
                </div>
                {formData.selectedBlogIds.includes(blog._id) && (
                  <div className={styles.selectedBadge}>✓</div>
                )}
              </div>
            ))}
          </div>
        )}

        {formData.selectedBlogIds.length > 0 && (
          <div className={styles.selectionInfo}>
            Избрани: {formData.selectedBlogIds.length} од 4 блогови
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actionsSection}>
        <button
          onClick={handleCreateCampaign}
          className={styles.saveButton}
          disabled={loading}
        >
          {loading ? 'Зачувување...' : '💾 Зачувај нацрт'}
        </button>
        <button
          onClick={() => setShowTestModal(true)}
          className={styles.testButton}
          disabled={!formData.name || !formData.subject || formData.selectedBlogIds.length === 0}
        >
          ✉️ Испрати тест email
        </button>
        <button
          onClick={() => setShowScheduleModal(true)}
          className={styles.scheduleButton}
          disabled={!formData.name || !formData.subject || formData.selectedBlogIds.length === 0}
        >
          📅 Закажи испраќање
        </button>
        <button
          onClick={handleSendNow}
          className={styles.sendButton}
          disabled={sending || !formData.name || !formData.subject || formData.selectedBlogIds.length === 0}
        >
          {sending ? 'Се испраќа...' : '🚀 Испрати веднаш'}
        </button>
      </div>

      {/* Recent Campaigns */}
      <div className={styles.campaignsSection}>
        <h2>Скорешни кампањи</h2>

        {loadingCampaigns ? (
          <div className={styles.loadingState}>Вчитување на кампањи...</div>
        ) : campaigns.length === 0 ? (
          <div className={styles.emptyState}>Нема креирани кампањи</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Име</th>
                  <th>Наслов</th>
                  <th>Статус</th>
                  <th>Примачи</th>
                  <th>Датум</th>
                  <th>Акции</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(campaign => (
                  <tr key={campaign._id}>
                    <td>{campaign.name}</td>
                    <td>{campaign.subject}</td>
                    <td>{getStatusBadge(campaign.status)}</td>
                    <td>{campaign.recipientCount || 0}</td>
                    <td>
                      {campaign.sentAt
                        ? new Date(campaign.sentAt).toLocaleDateString('mk-MK')
                        : campaign.scheduledFor
                        ? new Date(campaign.scheduledFor).toLocaleDateString('mk-MK')
                        : '-'}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteCampaign(campaign._id)}
                        className={styles.deleteButton}
                        title="Избриши"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className={styles.modalOverlay} onClick={() => setShowScheduleModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Закажи испраќање</h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSchedule} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Изберете датум и време</label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className={styles.cancelButton}
                >
                  Откажи
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={sending}
                >
                  {sending ? 'Закажување...' : 'Закажи'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Email Modal */}
      {showTestModal && (
        <div className={styles.modalOverlay} onClick={() => setShowTestModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Испрати тест email</h2>
              <button
                onClick={() => setShowTestModal(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSendTest} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Email адреса</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className={styles.cancelButton}
                >
                  Откажи
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={sending}
                >
                  {sending ? 'Испраќање...' : 'Испрати'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateNewsletter;
