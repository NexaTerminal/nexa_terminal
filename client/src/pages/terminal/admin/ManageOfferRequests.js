import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/terminal/Sidebar';
import styles from '../../../styles/terminal/admin/ManageOfferRequests.module.css';

const ManageOfferRequests = () => {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [providerResponses, setProviderResponses] = useState(null);
  const [loadingResponses, setLoadingResponses] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    serviceType: '',
    requestCategory: '',
    qualityFilter: '',
    page: 1
  });

  // Statistics
  const [statistics, setStatistics] = useState(null);

  // Status options
  const statusOptions = [
    { value: '', label: 'Сите статуси' },
    { value: 'неверифицирано', label: 'Неверифицирано' },
    { value: 'верифицирано', label: 'Верифицирано' },
    { value: 'испратено', label: 'Испратено' },
    { value: 'одбиено', label: 'Одбиено' }
  ];

  // Quality filter options
  const qualityFilterOptions = [
    { value: '', label: 'Сите барања' },
    { value: 'low-quality', label: 'Ниско квалитет' },
    { value: 'high-quality', label: 'Високо квалитет' },
    { value: 'potential-duplicates', label: 'Можни дупликати' }
  ];

  // Request category options
  const requestCategoryOptions = [
    { value: '', label: 'Сите категории' },
    { value: 'legal', label: 'Правни услуги' },
    { value: 'other', label: 'Други услуги' }
  ];

  // Load requests
  useEffect(() => {
    loadRequests();
  }, [filters]);

  // Load statistics on mount
  useEffect(() => {
    loadStatistics();
  }, []);

  const loadRequests = async () => {
    console.log('🔍 [FRONTEND] Starting loadRequests...');
    console.log('🔍 [FRONTEND] Token exists:', !!token);
    console.log('🔍 [FRONTEND] Filters:', filters);

    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });

      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/admin/offer-requests?${queryParams}`;
      console.log('🔍 [FRONTEND] Making request to:', url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 [FRONTEND] Response status:', response.status);
      console.log('🔍 [FRONTEND] Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [FRONTEND] Response data:', data);
        console.log('🔍 [FRONTEND] Requests count:', data.requests?.length || 0);
        setRequests(data.requests || []);
      } else {
        const errorText = await response.text();
        console.log('🔍 [FRONTEND] Error response:', errorText);
        throw new Error(`Failed to load requests: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('🔍 [FRONTEND] Error loading requests:', error);
      setError('Грешка при вчитување на барањата');
    } finally {
      setLoading(false);
      console.log('🔍 [FRONTEND] loadRequests finished');
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/admin/offer-requests/statistics`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleVerifyRequest = async (requestId) => {
    try {
      const notes = prompt('Додај забелешки (опционално):');

      // Get CSRF token first
      const csrfResponse = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/csrf-token`,
        {
          method: 'GET',
          credentials: 'include'
        }
      );

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const { csrfToken } = await csrfResponse.json();

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/admin/offer-requests/${requestId}/verify`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
          },
          credentials: 'include',
          body: JSON.stringify({ notes: notes || '' })
        }
      );

      if (response.ok) {
        await loadRequests();
        setShowDetails(false);
        alert('Барањето е успешно верифицирано и проследено до провајдери!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
    } catch (error) {
      console.error('Error verifying request:', error);
      alert(`Грешка при верификација: ${error.message}`);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const reason = prompt('Причина за одбивање (задолжително):');
      if (!reason) return;

      // Get CSRF token first
      const csrfResponse = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/csrf-token`,
        {
          method: 'GET',
          credentials: 'include'
        }
      );

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const { csrfToken } = await csrfResponse.json();

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/admin/offer-requests/${requestId}/reject`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
          },
          credentials: 'include',
          body: JSON.stringify({ reason })
        }
      );

      if (response.ok) {
        await loadRequests();
        setShowDetails(false);
        alert('Барањето е одбиено и корисникот е известен.');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert(`Грешка при одбивање: ${error.message}`);
    }
  };

  const showRequestDetails = async (requestId) => {
    try {
      // Fetch request details
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/admin/offer-requests/${requestId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedRequest(data.request);
        setShowDetails(true);

        // Fetch provider responses
        await loadProviderResponses(requestId);
      } else {
        throw new Error('Failed to load request details');
      }
    } catch (error) {
      console.error('Error loading request details:', error);
      alert('Грешка при вчитување на детали за барањето');
    }
  };

  const loadProviderResponses = async (requestId) => {
    try {
      setLoadingResponses(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/admin/offer-requests/${requestId}/responses`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProviderResponses(data.responses);
      } else {
        console.error('Failed to load provider responses');
        setProviderResponses(null);
      }
    } catch (error) {
      console.error('Error loading provider responses:', error);
      setProviderResponses(null);
    } finally {
      setLoadingResponses(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'неверифицирано': return styles.statusPending;
      case 'верифицирано': return styles.statusVerified;
      case 'испратено': return styles.statusSent;
      case 'одбиено': return styles.statusRejected;
      default: return styles.statusDefault;
    }
  };

  const getQualityBadgeClass = (score) => {
    if (score >= 70) return styles.qualityHigh;
    if (score >= 50) return styles.qualityMedium;
    return styles.qualityLow;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('mk-MK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <Header isTerminal={true} />

      <div className={styles.dashboardLayout}>
        <Sidebar />

        <main className={styles.dashboardMain}>
          <div className={styles.pageHeader}>
            <h1>Управување со барања за понуди</h1>
            <p>Прегледајте, верификувајте и управувајте со барањата од корисниците</p>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className={styles.statisticsGrid}>
              <div className={styles.statCard}>
                <h3>Вкупно барања</h3>
                <div className={styles.statNumber}>
                  {statistics.statusStats?.reduce((sum, stat) => sum + stat.count, 0) || 0}
                </div>
              </div>
              <div className={styles.statCard}>
                <h3>Неверифицирани</h3>
                <div className={styles.statNumber}>
                  {statistics.statusStats?.find(s => s._id === 'неверифицирано')?.count || 0}
                </div>
              </div>
              <div className={styles.statCard}>
                <h3>Просечно квалитет</h3>
                <div className={styles.statNumber}>
                  {Math.round(statistics.statusStats?.reduce((sum, stat) => sum + (stat.avgQualityScore || 0), 0) / (statistics.statusStats?.length || 1))}%
                </div>
              </div>
              <div className={styles.statCard}>
                <h3>Најпопуларна категорија</h3>
                <div className={styles.statText}>
                  {statistics.categoryStats?.[0]?._id || 'Нема'}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className={styles.filtersSection}>
            <div className={styles.filterGrid}>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
                className={styles.filterSelect}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <select
                value={filters.requestCategory}
                onChange={(e) => setFilters({...filters, requestCategory: e.target.value, page: 1})}
                className={styles.filterSelect}
              >
                {requestCategoryOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <select
                value={filters.qualityFilter}
                onChange={(e) => setFilters({...filters, qualityFilter: e.target.value, page: 1})}
                className={styles.filterSelect}
              >
                {qualityFilterOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <button
                onClick={() => setFilters({status: '', serviceType: '', requestCategory: '', qualityFilter: '', page: 1})}
                className={styles.clearFiltersBtn}
              >
                Ресетирај филтри
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>{error}</div>
          )}

          {/* Requests Table */}
          <div className={styles.tableContainer}>
            {loading ? (
              <div className={styles.loading}>Се вчитуваат барањата...</div>
            ) : requests.length === 0 ? (
              <div className={styles.noRequests}>Нема барања што се совпаѓаат со филтрите</div>
            ) : (
              <table className={styles.requestsTable}>
                <thead>
                  <tr>
                    <th>Компанија</th>
                    <th>Категорија</th>
                    <th>Услуга</th>
                    <th>Буџет</th>
                    <th>Статус</th>
                    <th>Квалитет</th>
                    <th>Интереси</th>
                    <th>Дата</th>
                    <th>Акции</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(request => (
                    <tr key={request._id}>
                      <td>
                        <div className={styles.companyInfo}>
                          <strong>{request.user?.companyInfo?.companyName || 'Непознато'}</strong>
                          <small>{request.user?.email}</small>
                        </div>
                      </td>
                      <td>
                        <span className={styles.categoryBadge}>
                          {request.requestCategory === 'legal' ? 'Правни' : 'Други'}
                        </span>
                      </td>
                      <td>
                        <span className={styles.serviceType}>{request.serviceType}</span>
                      </td>
                      <td>{request.budgetRange}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusBadgeClass(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.qualityBadge} ${getQualityBadgeClass(request.qualityIndicators?.qualityScore)}`}>
                          {request.qualityIndicators?.qualityScore}%
                        </span>
                      </td>
                      <td>{request.interestCount || 0}</td>
                      <td>{formatDate(request.createdAt)}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            onClick={() => showRequestDetails(request._id)}
                            className={styles.viewBtn}
                          >
                            Детали
                          </button>
                          {request.status === 'неверифицирано' && (
                            <>
                              <button
                                onClick={() => handleVerifyRequest(request._id)}
                                className={styles.verifyBtn}
                              >
                                Верификувај
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request._id)}
                                className={styles.rejectBtn}
                              >
                                Одбиј
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* Request Details Modal */}
      {showDetails && selectedRequest && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Детали за барање</h2>
              <button
                onClick={() => setShowDetails(false)}
                className={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.requestDetails}>
                <div className={styles.detailSection}>
                  <h3>Основни информации</h3>
                  <p><strong>Компанија:</strong> {selectedRequest.user?.companyInfo?.companyName}</p>
                  <p><strong>Email:</strong> {selectedRequest.user?.email}</p>
                  <p><strong>Услуга:</strong> {selectedRequest.serviceType}</p>
                  <p><strong>Буџет:</strong> {selectedRequest.budgetRange}</p>
                  <p><strong>Тип:</strong> {selectedRequest.projectType}</p>
                  <p><strong>Рок:</strong> {selectedRequest.timeline}</p>
                  <p><strong>Статус:</strong> <span className={`${styles.statusBadge} ${getStatusBadgeClass(selectedRequest.status)}`}>{selectedRequest.status}</span></p>
                </div>

                <div className={styles.detailSection}>
                  <h3>Опис на барањето</h3>
                  <div className={styles.projectDescription}>
                    {selectedRequest.projectDescription}
                  </div>
                </div>

                {selectedRequest.serviceSpecificFields && Object.keys(selectedRequest.serviceSpecificFields).length > 0 && (
                  <div className={styles.detailSection}>
                    <h3>Дополнителни информации</h3>
                    {Object.entries(selectedRequest.serviceSpecificFields).map(([key, value]) => (
                      <p key={key}><strong>{key}:</strong> {value}</p>
                    ))}
                  </div>
                )}

                <div className={styles.detailSection}>
                  <h3>Показатели за квалитет</h3>
                  <div className={styles.qualityIndicators}>
                    <div className={styles.qualityItem}>
                      <span>Квалитет скор:</span>
                      <span className={`${styles.qualityBadge} ${getQualityBadgeClass(selectedRequest.qualityIndicators?.qualityScore)}`}>
                        {selectedRequest.qualityIndicators?.qualityScore}%
                      </span>
                    </div>
                    <div className={styles.qualityItem}>
                      <span>Спам скор:</span>
                      <span>{selectedRequest.qualityIndicators?.spamScore}%</span>
                    </div>
                    <div className={styles.qualityItem}>
                      <span>Број на зборови:</span>
                      <span>{selectedRequest.qualityIndicators?.wordCount}</span>
                    </div>
                  </div>
                </div>

                {selectedRequest.adminNotes && (
                  <div className={styles.detailSection}>
                    <h3>Админ забелешки</h3>
                    <p>{selectedRequest.adminNotes}</p>
                  </div>
                )}
              </div>

              {/* Provider Responses Section */}
              <div className={styles.responsesSection}>
                <h3>Одговори од давателите на услуги</h3>
                {loadingResponses ? (
                  <div className={styles.loadingResponses}>
                    <p>Се вчитуваат одговорите...</p>
                  </div>
                ) : providerResponses ? (
                  <div className={styles.responsesContainer}>
                    {/* Summary Statistics */}
                    <div className={styles.responsesSummary}>
                      <div className={styles.summaryCard}>
                        <span className={styles.summaryLabel}>Вкупно покани:</span>
                        <span className={styles.summaryValue}>{providerResponses.summary?.totalInvited || 0}</span>
                      </div>
                      <div className={styles.summaryCard}>
                        <span className={styles.summaryLabel}>Одговорени:</span>
                        <span className={styles.summaryValue}>{providerResponses.summary?.totalResponded || 0}</span>
                      </div>
                      <div className={styles.summaryCard}>
                        <span className={styles.summaryLabel}>Прифатени:</span>
                        <span className={styles.summaryValue}>{providerResponses.summary?.acceptedCount || 0}</span>
                      </div>
                      <div className={styles.summaryCard}>
                        <span className={styles.summaryLabel}>Одбиени:</span>
                        <span className={styles.summaryValue}>{providerResponses.summary?.declinedCount || 0}</span>
                      </div>
                      <div className={styles.summaryCard}>
                        <span className={styles.summaryLabel}>Отпишани:</span>
                        <span className={styles.summaryValue}>{providerResponses.summary?.unsubscribedCount || 0}</span>
                      </div>
                      <div className={styles.summaryCard}>
                        <span className={styles.summaryLabel}>Одговор-стапка:</span>
                        <span className={styles.summaryValue}>{providerResponses.summary?.responseRate?.toFixed(1) || 0}%</span>
                      </div>
                    </div>

                    {/* Accepted Responses */}
                    {providerResponses.responses?.accepted?.length > 0 && (
                      <div className={styles.responseCategory}>
                        <h4 className={styles.categoryTitle}>✅ Прифатени понуди ({providerResponses.responses.accepted.length})</h4>
                        {providerResponses.responses.accepted.map((response, index) => (
                          <div key={response._id} className={`${styles.responseCard} ${styles.acceptedResponse}`}>
                            <div className={styles.responseHeader}>
                              <h5>{response.provider.name}</h5>
                              <span className={styles.responseDate}>
                                {new Date(response.responseTimestamp).toLocaleDateString('mk-MK')}
                              </span>
                            </div>
                            <div className={styles.responseDetails}>
                              <p><strong>Email:</strong> {response.provider.email}</p>
                              <p><strong>Категорија:</strong> {response.provider.serviceCategory}</p>
                              <p><strong>Локација:</strong> {response.provider.location}</p>

                              <div className={styles.responseAnswers}>
                                <p><strong>Буџет прифатен:</strong>
                                  <span className={response.budgetAccepted === 'да' ? styles.positive : styles.warning}>
                                    {response.budgetAccepted === 'да' ? 'Да' : 'Потребна дискусија'}
                                  </span>
                                </p>
                                {response.priceDetails && (
                                  <p><strong>Детали за цена:</strong> {response.priceDetails}</p>
                                )}

                                <p><strong>Рок прифатлив:</strong>
                                  <span className={response.timelineAcceptable === 'да' ? styles.positive : styles.warning}>
                                    {response.timelineAcceptable === 'да' ? 'Да' : 'Потребно прилагодување'}
                                  </span>
                                </p>
                                {response.timelineComment && (
                                  <p><strong>Коментар за рок:</strong> {response.timelineComment}</p>
                                )}

                                <p><strong>Релевантно искуство:</strong>
                                  <span className={styles.experienceLevel}>
                                    {response.relevantExperience === 'да' ? 'Да' :
                                     response.relevantExperience === 'делумно' ? 'Делумно' : 'Не'}
                                  </span>
                                </p>
                                {response.experienceDetails && (
                                  <p><strong>Детали за искуство:</strong> {response.experienceDetails}</p>
                                )}

                                <div className={styles.approachSection}>
                                  <strong>Пристап кон проектот:</strong>
                                  <div className={styles.approachText}>{response.approachComment}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Declined Responses */}
                    {providerResponses.responses?.declined?.length > 0 && (
                      <div className={styles.responseCategory}>
                        <h4 className={styles.categoryTitle}>❌ Одбиени понуди ({providerResponses.responses.declined.length})</h4>
                        {providerResponses.responses.declined.map((response, index) => (
                          <div key={response._id} className={`${styles.responseCard} ${styles.declinedResponse}`}>
                            <div className={styles.responseHeader}>
                              <h5>{response.provider.name}</h5>
                              <span className={styles.responseDate}>
                                {new Date(response.responseTimestamp).toLocaleDateString('mk-MK')}
                              </span>
                            </div>
                            <div className={styles.responseDetails}>
                              <p><strong>Email:</strong> {response.provider.email}</p>
                              <p><strong>Причина:</strong> {response.declineReason}</p>
                              {response.declineComment && (
                                <p><strong>Коментар:</strong> {response.declineComment}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Unsubscribed Responses */}
                    {providerResponses.responses?.unsubscribed?.length > 0 && (
                      <div className={styles.responseCategory}>
                        <h4 className={styles.categoryTitle}>🚫 Отпишани ({providerResponses.responses.unsubscribed.length})</h4>
                        {providerResponses.responses.unsubscribed.map((response, index) => (
                          <div key={response._id} className={`${styles.responseCard} ${styles.unsubscribedResponse}`}>
                            <div className={styles.responseHeader}>
                              <h5>{response.provider.name}</h5>
                              <span className={styles.responseDate}>
                                {new Date(response.responseTimestamp).toLocaleDateString('mk-MK')}
                              </span>
                            </div>
                            <div className={styles.responseDetails}>
                              <p><strong>Email:</strong> {response.provider.email}</p>
                              <p><strong>Причина:</strong> {response.unsubscribeReason}</p>
                              {response.unsubscribeComment && (
                                <p><strong>Коментар:</strong> {response.unsubscribeComment}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pending Responses */}
                    {providerResponses.responses?.pending?.length > 0 && (
                      <div className={styles.responseCategory}>
                        <h4 className={styles.categoryTitle}>⏳ Чекаат одговор ({providerResponses.responses.pending.length})</h4>
                        {providerResponses.responses.pending.map((response, index) => (
                          <div key={response._id} className={`${styles.responseCard} ${styles.pendingResponse}`}>
                            <div className={styles.responseHeader}>
                              <h5>{response.provider.name}</h5>
                              <span className={styles.responseDate}>
                                Покана испратена: {new Date(response.createdAt).toLocaleDateString('mk-MK')}
                              </span>
                            </div>
                            <div className={styles.responseDetails}>
                              <p><strong>Email:</strong> {response.provider.email}</p>
                              <p><strong>Токен истекува:</strong> {new Date(response.tokenExpiry).toLocaleDateString('mk-MK')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Legacy Responses */}
                    {providerResponses.responses?.legacy?.length > 0 && (
                      <div className={styles.responseCategory}>
                        <h4 className={styles.categoryTitle}>📝 Стари одговори ({providerResponses.responses.legacy.length})</h4>
                        {providerResponses.responses.legacy.map((response, index) => (
                          <div key={response._id} className={`${styles.responseCard} ${styles.legacyResponse}`}>
                            <div className={styles.responseHeader}>
                              <h5>{response.provider.name}</h5>
                              <span className={styles.responseDate}>
                                {new Date(response.updatedAt).toLocaleDateString('mk-MK')}
                              </span>
                            </div>
                            <div className={styles.responseDetails}>
                              <p><strong>Email:</strong> {response.provider.email}</p>
                              <p><strong>Достапност:</strong> {response.availability}</p>
                              <p><strong>Буџет:</strong> {response.budgetAlignment}</p>
                              <div className={styles.proposalSection}>
                                <strong>Предлог:</strong>
                                <div className={styles.proposalText}>{response.proposal}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* No responses */}
                    {(!providerResponses.responses ||
                      (providerResponses.responses.accepted?.length === 0 &&
                       providerResponses.responses.declined?.length === 0 &&
                       providerResponses.responses.unsubscribed?.length === 0 &&
                       providerResponses.responses.legacy?.length === 0 &&
                       providerResponses.responses.pending?.length === 0)) && (
                      <div className={styles.noResponses}>
                        <p>Сè уште нема одговори од даватели на услуги.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.noResponsesData}>
                    <p>Не се достапни податоци за одговори.</p>
                  </div>
                )}
              </div>

              {selectedRequest.status === 'неверифицирано' && (
                <div className={styles.modalActions}>
                  <button
                    onClick={() => handleVerifyRequest(selectedRequest._id)}
                    className={styles.verifyBtn}
                  >
                    Верификувај барање
                  </button>
                  <button
                    onClick={() => handleRejectRequest(selectedRequest._id)}
                    className={styles.rejectBtn}
                  >
                    Одбиј барање
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOfferRequests;