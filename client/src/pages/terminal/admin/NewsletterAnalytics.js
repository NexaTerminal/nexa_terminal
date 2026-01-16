import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from '../../../styles/terminal/admin/NewsletterAnalytics.module.css';
import axios from 'axios';

const NewsletterAnalytics = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Overview stats
  const [overviewStats, setOverviewStats] = useState({
    totalSubscribers: 0,
    activeSubscribers: 0,
    totalCampaigns: 0,
    campaignsSent: 0,
    averageOpenRate: 0,
    averageClickRate: 0
  });

  // Campaigns list
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Campaign details
  const [campaignAnalytics, setCampaignAnalytics] = useState(null);
  const [subscriberDetails, setSubscriberDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Pagination and filters for subscriber details
  const [detailsFilter, setDetailsFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch overview stats
  useEffect(() => {
    fetchOverviewStats();
    fetchCampaigns();
  }, []);

  const fetchOverviewStats = async () => {
    try {
      const response = await axios.get('/api/newsletter/analytics/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setOverviewStats(response.data.stats);
      }
    } catch (err) {
      console.error('Error fetching overview stats:', err);
      setError('Грешка при вчитување на статистика');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get('/api/newsletter/campaigns', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Filter to show only sent campaigns
        const sentCampaigns = response.data.campaigns.filter(c => c.status === 'sent');
        setCampaigns(sentCampaigns);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    }
  };

  // Fetch campaign analytics
  const fetchCampaignAnalytics = async (campaignId) => {
    setLoadingDetails(true);
    try {
      const response = await axios.get(`/api/newsletter/analytics/campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCampaignAnalytics(response.data.analytics);
      }
    } catch (err) {
      console.error('Error fetching campaign analytics:', err);
      setError('Грешка при вчитување на аналитика за кампања');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Fetch subscriber-level details
  const fetchSubscriberDetails = async (campaignId, filter = 'all', page = 1) => {
    setLoadingDetails(true);
    try {
      const params = new URLSearchParams({
        filter,
        page,
        limit: 20
      });

      const response = await axios.get(
        `/api/newsletter/analytics/campaigns/${campaignId}/subscribers?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSubscriberDetails(response.data.details);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching subscriber details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle campaign selection
  const handleCampaignClick = (campaign) => {
    setSelectedCampaign(campaign);
    setCurrentPage(1);
    setDetailsFilter('all');
    fetchCampaignAnalytics(campaign._id);
    fetchSubscriberDetails(campaign._id, 'all', 1);
  };

  // Handle filter change
  const handleFilterChange = (filter) => {
    setDetailsFilter(filter);
    setCurrentPage(1);
    if (selectedCampaign) {
      fetchSubscriberDetails(selectedCampaign._id, filter, 1);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (selectedCampaign) {
      fetchSubscriberDetails(selectedCampaign._id, detailsFilter, page);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('mk-MK');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Вчитување на аналитика...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Билтен - Аналитика</h1>
        <p>Преглед на перформанси на билтени и претплатници</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}

      {/* Overview Stats */}
      <div className={styles.statsSection}>
        <h2>Преглед</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{overviewStats.activeSubscribers}</div>
              <div className={styles.statLabel}>Активни претплатници</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📧</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{overviewStats.campaignsSent}</div>
              <div className={styles.statLabel}>Испратени кампањи</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{overviewStats.averageOpenRate.toFixed(1)}%</div>
              <div className={styles.statLabel}>Просечна отвореност</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🖱️</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{overviewStats.averageClickRate.toFixed(1)}%</div>
              <div className={styles.statLabel}>Просечна кликабилност</div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className={styles.campaignsSection}>
        <h2>Кампањи</h2>

        {campaigns.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Немате испратени кампањи</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Име</th>
                  <th>Наслов</th>
                  <th>Датум</th>
                  <th>Примачи</th>
                  <th>Отвореност</th>
                  <th>Кликабилност</th>
                  <th>Акции</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(campaign => (
                  <tr
                    key={campaign._id}
                    className={selectedCampaign?._id === campaign._id ? styles.selectedRow : ''}
                  >
                    <td>{campaign.name}</td>
                    <td>{campaign.subject}</td>
                    <td>{formatDate(campaign.sentAt)}</td>
                    <td>{campaign.recipientCount || 0}</td>
                    <td>
                      <div className={styles.rateCell}>
                        <span className={styles.rateValue}>
                          {campaign.analytics?.openRate?.toFixed(1) || '0.0'}%
                        </span>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{ width: `${campaign.analytics?.openRate || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.rateCell}>
                        <span className={styles.rateValue}>
                          {campaign.analytics?.clickRate?.toFixed(1) || '0.0'}%
                        </span>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{ width: `${campaign.analytics?.clickRate || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleCampaignClick(campaign)}
                        className={styles.viewButton}
                      >
                        👁️ Детали
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Campaign Details */}
      {selectedCampaign && campaignAnalytics && (
        <div className={styles.detailsSection}>
          <div className={styles.detailsHeader}>
            <div>
              <h2>Детали за кампања: {selectedCampaign.name}</h2>
              <p>{selectedCampaign.subject}</p>
            </div>
            <button
              onClick={() => {
                setSelectedCampaign(null);
                setCampaignAnalytics(null);
                setSubscriberDetails([]);
              }}
              className={styles.closeDetailsButton}
            >
              ✕ Затвори
            </button>
          </div>

          {/* Campaign Stats */}
          <div className={styles.campaignStats}>
            <div className={styles.campaignStatCard}>
              <div className={styles.campaignStatLabel}>Испратени</div>
              <div className={styles.campaignStatValue}>
                {campaignAnalytics.totalSent}
              </div>
            </div>
            <div className={styles.campaignStatCard}>
              <div className={styles.campaignStatLabel}>Отворени</div>
              <div className={styles.campaignStatValue}>
                {campaignAnalytics.totalOpened}
              </div>
            </div>
            <div className={styles.campaignStatCard}>
              <div className={styles.campaignStatLabel}>Кликнати</div>
              <div className={styles.campaignStatValue}>
                {campaignAnalytics.totalClicked}
              </div>
            </div>
            <div className={styles.campaignStatCard}>
              <div className={styles.campaignStatLabel}>Отвореност</div>
              <div className={styles.campaignStatValue}>
                {campaignAnalytics.openRate.toFixed(1)}%
              </div>
            </div>
            <div className={styles.campaignStatCard}>
              <div className={styles.campaignStatLabel}>Кликабилност</div>
              <div className={styles.campaignStatValue}>
                {campaignAnalytics.clickRate.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className={styles.detailsFilters}>
            <button
              className={`${styles.filterButton} ${detailsFilter === 'all' ? styles.active : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              Сите
            </button>
            <button
              className={`${styles.filterButton} ${detailsFilter === 'opened' ? styles.active : ''}`}
              onClick={() => handleFilterChange('opened')}
            >
              Отворени
            </button>
            <button
              className={`${styles.filterButton} ${detailsFilter === 'clicked' ? styles.active : ''}`}
              onClick={() => handleFilterChange('clicked')}
            >
              Кликнати
            </button>
            <button
              className={`${styles.filterButton} ${detailsFilter === 'not_opened' ? styles.active : ''}`}
              onClick={() => handleFilterChange('not_opened')}
            >
              Не отворени
            </button>
          </div>

          {/* Subscriber Details Table */}
          {loadingDetails ? (
            <div className={styles.loadingState}>Вчитување...</div>
          ) : (
            <>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Име</th>
                      <th>Отворено</th>
                      <th>Кликнато</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriberDetails.map((detail, idx) => (
                      <tr key={idx}>
                        <td>{detail.subscriberEmail}</td>
                        <td>
                          {detail.subscriberName
                            ? `${detail.subscriberName.firstName || ''} ${detail.subscriberName.lastName || ''}`
                            : '-'}
                        </td>
                        <td>
                          {detail.opened ? (
                            <div className={styles.eventInfo}>
                              <span className={styles.eventBadge}>✅ Да</span>
                              <span className={styles.eventTime}>
                                {formatDate(detail.openedAt)}
                              </span>
                            </div>
                          ) : (
                            <span className={styles.eventBadge}>❌ Не</span>
                          )}
                        </td>
                        <td>
                          {detail.clicked ? (
                            <div className={styles.eventInfo}>
                              <span className={styles.eventBadge}>✅ Да</span>
                              <span className={styles.eventTime}>
                                {formatDate(detail.clickedAt)}
                              </span>
                            </div>
                          ) : (
                            <span className={styles.eventBadge}>❌ Не</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={styles.pageButton}
                  >
                    ‹ Претходна
                  </button>
                  <span className={styles.pageInfo}>
                    Страница {currentPage} од {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={styles.pageButton}
                  >
                    Следна ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NewsletterAnalytics;
