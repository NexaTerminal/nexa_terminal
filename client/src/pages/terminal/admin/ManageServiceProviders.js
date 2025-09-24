import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from '../../../styles/terminal/admin/ManageServiceProviders.module.css';
import ProfileRequired from '../../../components/common/ProfileRequired';
import Header from '../../../components/common/Header';

const ManageServiceProviders = () => {
  const { token } = useAuth();
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [filters, setFilters] = useState({
    active: '',
    category: '',
    search: ''
  });

  // Form state for adding/editing providers
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    serviceCategories: [],
    specializations: [],
    description: '',
    location: {
      city: '',
      region: '',
      country: 'Macedonia',
      servesRemote: false,
      serviceAreas: []
    },
    businessInfo: {
      registrationNumber: '',
      taxNumber: '',
      yearsInBusiness: 0,
      teamSize: '1',
      languagesSupported: ['mk', 'en']
    },
    contactPreferences: {
      preferredContactMethod: 'email',
      responseTimeCommitment: '48h',
      workingHours: {
        timezone: 'Europe/Skopje',
        availability: 'business_hours'
      }
    }
  });

  useEffect(() => {
    fetchProviders();
    fetchCategories();
  }, [filters]);

  const fetchProviders = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/admin/marketplace/providers?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Неуспешно вчитување на провајдери');
      }

      const result = await response.json();
      setProviders(result.data?.providers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/admin/marketplace/categories`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Неуспешно вчитување на категории');
      }

      const result = await response.json();
      setCategories(result.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Get CSRF token
      const csrfResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const { csrfToken } = await csrfResponse.json();

      const url = editingProvider
        ? `${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/admin/marketplace/providers/${editingProvider._id}`
        : `${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/admin/marketplace/providers`;

      const method = editingProvider ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Неуспешно снимање на провајдер');
      }

      setSuccess(editingProvider ? 'Провајдерот е успешно ажуриран.' : 'Провајдерот е успешно креиран.');
      setShowAddForm(false);
      setEditingProvider(null);
      resetForm();
      fetchProviders();

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  const handleStatusChange = async (providerId, newStatus) => {
    try {
      // Get CSRF token
      const csrfResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const { csrfToken } = await csrfResponse.json();

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/admin/marketplace/providers/${providerId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
            Authorization: `Bearer ${token}`
          },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (!response.ok) {
        throw new Error('Неуспешна промена на статус');
      }

      setSuccess(`Статусот е променет на ${newStatus}.`);
      fetchProviders();

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  const handleDelete = async (providerId) => {
    if (!window.confirm('Дали сте сигурни дека сакате да го избришете овој провајдер?')) {
      return;
    }

    try {
      // Get CSRF token
      const csrfResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const { csrfToken } = await csrfResponse.json();

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/admin/marketplace/providers/${providerId}`,
        {
          method: 'DELETE',
          headers: {
            'X-CSRF-Token': csrfToken,
            Authorization: `Bearer ${token}`
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Неуспешно бришење на провајдер');
      }

      setSuccess('Провајдерот е успешно избришан.');
      fetchProviders();

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  const handleEdit = (provider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name || '',
      email: provider.email || '',
      phone: provider.phone || '',
      website: provider.website || '',
      serviceCategories: provider.serviceCategories || [],
      specializations: provider.specializations || [],
      description: provider.description || '',
      location: {
        city: provider.location?.city || '',
        region: provider.location?.region || '',
        country: provider.location?.country || 'Macedonia',
        servesRemote: provider.location?.servesRemote || false,
        serviceAreas: provider.location?.serviceAreas || []
      },
      businessInfo: {
        registrationNumber: provider.businessInfo?.registrationNumber || '',
        taxNumber: provider.businessInfo?.taxNumber || '',
        yearsInBusiness: provider.businessInfo?.yearsInBusiness || 0,
        teamSize: provider.businessInfo?.teamSize || '1',
        languagesSupported: provider.businessInfo?.languagesSupported || ['mk', 'en']
      },
      contactPreferences: {
        preferredContactMethod: provider.contactPreferences?.preferredContactMethod || 'email',
        responseTimeCommitment: provider.contactPreferences?.responseTimeCommitment || '48h',
        workingHours: {
          timezone: provider.contactPreferences?.workingHours?.timezone || 'Europe/Skopje',
          availability: provider.contactPreferences?.workingHours?.availability || 'business_hours'
        }
      }
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      website: '',
      serviceCategories: [],
      specializations: [],
      description: '',
      location: {
        city: '',
        region: '',
        country: 'Macedonia',
        servesRemote: false,
        serviceAreas: []
      },
      businessInfo: {
        registrationNumber: '',
        taxNumber: '',
        yearsInBusiness: 0,
        teamSize: '1',
        languagesSupported: ['mk', 'en']
      },
      contactPreferences: {
        preferredContactMethod: 'email',
        responseTimeCommitment: '48h',
        workingHours: {
          timezone: 'Europe/Skopje',
          availability: 'business_hours'
        }
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      case 'suspended': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Одобрен';
      case 'pending': return 'Чека одобрување';
      case 'rejected': return 'Одбиен';
      case 'suspended': return 'Суспендиран';
      default: return status;
    }
  };

  if (loading) {
    return (
      <ProfileRequired>
        <div className={styles.container}>
          <div className={styles.loading}>Се вчитува...</div>
        </div>
      </ProfileRequired>
    );
  }

  return (
    <ProfileRequired>
      <Header isTerminal={true} />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Провајдери на услуги</h1>
          <button
            className={styles.addButton}
            onClick={() => {
              setShowAddForm(true);
              setEditingProvider(null);
              resetForm();
            }}
          >
            + Додај провајдер
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        {/* Filters */}
        <div className={styles.filters}>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Сите статуси</option>
            <option value="pending">Чека одобрување</option>
            <option value="approved">Одобрени</option>
            <option value="rejected">Одбиени</option>
            <option value="suspended">Суспендирани</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">Сите категории</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat.name}>
                {cat.displayName?.mk || cat.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Пребарај провајдери..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>{editingProvider ? 'Ажурирај провајдер' : 'Додај нов провајдер'}</h2>
                <button
                  className={styles.closeButton}
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingProvider(null);
                    resetForm();
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Име на провајдер *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Телефон</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Веб страна</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Категории на услуги *</label>
                  <div className={styles.checkboxGroup}>
                    {categories.map(cat => (
                      <label key={cat._id} className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={formData.serviceCategories.includes(cat.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                serviceCategories: [...formData.serviceCategories, cat.name]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                serviceCategories: formData.serviceCategories.filter(c => c !== cat.name)
                              });
                            }
                          }}
                        />
                        {cat.displayName?.mk || cat.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Опис</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Град *</label>
                    <input
                      type="text"
                      value={formData.location.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, city: e.target.value }
                      })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Регион</label>
                    <input
                      type="text"
                      value={formData.location.region}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, region: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.location.servesRemote}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, servesRemote: e.target.checked }
                      })}
                    />
                    Работи на далечина
                  </label>
                </div>

                <div className={styles.formActions}>
                  <button type="submit" className={styles.submitButton}>
                    {editingProvider ? 'Ажурирај' : 'Креирај'}
                  </button>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingProvider(null);
                      resetForm();
                    }}
                  >
                    Откажи
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Providers List */}
        <div className={styles.providersGrid}>
          {providers.length === 0 ? (
            <div className={styles.noProviders}>
              Нема пронајдени провајдери.
            </div>
          ) : (
            providers.map(provider => (
              <div key={provider._id} className={styles.providerCard}>
                <div className={styles.providerHeader}>
                  <h3>{provider.name}</h3>
                  <span
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(provider.status) }}
                  >
                    {getStatusText(provider.status)}
                  </span>
                </div>

                <div className={styles.providerInfo}>
                  <p><strong>Email:</strong> {provider.email}</p>
                  <p><strong>Телефон:</strong> {provider.phone || 'Не е внесен'}</p>
                  <p><strong>Локација:</strong> {provider.location?.city}, {provider.location?.region}</p>
                  <p><strong>Категории:</strong> {provider.serviceCategories?.join(', ')}</p>
                  {provider.description && (
                    <p><strong>Опис:</strong> {provider.description}</p>
                  )}
                </div>

                <div className={styles.providerActions}>
                  <button
                    className={styles.editButton}
                    onClick={() => handleEdit(provider)}
                  >
                    Ажурирај
                  </button>

                  {provider.status === 'pending' && (
                    <>
                      <button
                        className={styles.approveButton}
                        onClick={() => handleStatusChange(provider._id, 'approved')}
                      >
                        Одобри
                      </button>
                      <button
                        className={styles.rejectButton}
                        onClick={() => handleStatusChange(provider._id, 'rejected')}
                      >
                        Одбиј
                      </button>
                    </>
                  )}

                  {provider.status === 'approved' && (
                    <button
                      className={styles.suspendButton}
                      onClick={() => handleStatusChange(provider._id, 'suspended')}
                    >
                      Суспендирај
                    </button>
                  )}

                  {provider.status === 'suspended' && (
                    <button
                      className={styles.approveButton}
                      onClick={() => handleStatusChange(provider._id, 'approved')}
                    >
                      Активирај
                    </button>
                  )}

                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(provider._id)}
                  >
                    Избриши
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ProfileRequired>
  );
};

export default ManageServiceProviders;