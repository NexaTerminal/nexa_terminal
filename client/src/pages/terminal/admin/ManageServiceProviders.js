import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from '../../../styles/terminal/admin/ManageServiceProviders.module.css';
import ProfileRequired from '../../../components/common/ProfileRequired';
import Header from '../../../components/common/Header';

const ManageServiceProviders = () => {
  const { token } = useAuth();
  const [providers, setProviders] = useState([]);
  // Fixed service categories matching the backend schemas
  const serviceCategories = [
    { value: 'legal', label: 'Правни услуги' },
    { value: 'accounting', label: 'Сметководство' },
    { value: 'marketing', label: 'Маркетинг' },
    { value: 'realestate', label: 'Недвижности' },
    { value: 'itsupport', label: 'ИТ поддршка' },
    { value: 'insurance', label: 'Осигурување' },
    { value: 'other', label: 'Друго' }
  ];

  // Macedonian towns/cities for dropdown
  const macedonianTowns = [
    'Скопје', 'Битола', 'Куманово', 'Прилеп', 'Тетово', 'Велес', 'Штип',
    'Охрид', 'Гостивар', 'Струмица', 'Радовиш', 'Кавадарци', 'Кочани',
    'Свети Николе', 'Гевгелија', 'Дебар', 'Кичево', 'Виница', 'Неготино',
    'Берово', 'Делчево', 'Пехчево', 'Македонски Брод', 'Ресен', 'Крива Паланка',
    'Богданци', 'Демир Хисар', 'Македонска Каменица', 'Валандово', 'Кратово',
    'Росоман', 'Вевчани', 'Струга', 'Дојран', 'Старо Нагоричане', 'Конче',
    'Пробиштип', 'Крушево', 'Демир Капија'
  ].sort();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkJsonData, setBulkJsonData] = useState('');
  const [jsonValidation, setJsonValidation] = useState({ isValid: true, message: '', count: 0 });
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
    serviceCategory: '',
    specializations: [],
    description: '',
    location: '',
    servesRemote: false,
    businessInfo: {
      registrationNumber: '',
      taxNumber: '',
      languagesSupported: ['mk', 'en']
    }
  });

  useEffect(() => {
    fetchProviders();
    // No need to fetch categories - using fixed list
  }, [filters]);

  // Helper function to build correct API URLs
  const buildApiUrl = (endpoint) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
    console.log('[API URL Builder] Environment REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    console.log('[API URL Builder] Base URL:', baseUrl);

    // If baseUrl already ends with /api, don't add it again
    const cleanBaseUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    const fullUrl = `${cleanBaseUrl}${endpoint}`;
    console.log('[API URL Builder] Final URL:', fullUrl);
    return fullUrl;
  };

  const fetchProviders = async () => {
    console.log('🔄 [fetchProviders] Starting to fetch service providers...');
    console.log('[fetchProviders] Current filters:', filters);
    console.log('[fetchProviders] Auth token available:', !!token);

    try {
      const queryParams = new URLSearchParams();
      if (filters.active) queryParams.append('active', filters.active);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.search) queryParams.append('search', filters.search);

      console.log('[fetchProviders] Query params:', queryParams.toString());

      const apiUrl = buildApiUrl(`/marketplace/providers?${queryParams}`);
      console.log('[fetchProviders] Making request to:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        credentials: 'include'
      });

      console.log('[fetchProviders] Response status:', response.status);
      console.log('[fetchProviders] Response ok:', response.ok);

      if (!response.ok) {
        throw new Error('Неуспешно вчитување на провајдери');
      }

      const result = await response.json();
      console.log('[fetchProviders] Response data:', result);
      console.log('[fetchProviders] Providers array:', result.data?.providers);
      console.log('[fetchProviders] Number of providers:', result.data?.providers?.length || 0);

      const providersArray = result.data?.providers || [];
      setProviders(providersArray);
      console.log('[fetchProviders] ✅ Successfully set providers state with', providersArray.length, 'providers');

    } catch (err) {
      console.error('[fetchProviders] ❌ Error occurred:', err);
      console.error('[fetchProviders] Error message:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
      console.log('[fetchProviders] Loading set to false');
    }
  };

  // Removed fetchCategories - using fixed service categories list

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Get CSRF token
      const csrfUrl = buildApiUrl('/csrf-token');
      console.log('[API Call] Fetching CSRF token from:', csrfUrl);
      const csrfResponse = await fetch(csrfUrl, {
        method: 'GET',
        credentials: 'include'
      });

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const { csrfToken } = await csrfResponse.json();

      const endpoint = editingProvider
        ? `/marketplace/providers/${editingProvider._id}`
        : '/marketplace/providers';
      const url = buildApiUrl(endpoint);
      console.log('[handleSubmit] API URL:', url);

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

  const handleStatusChange = async (providerId, isActive) => {
    try {
      // Get CSRF token
      const csrfUrl = buildApiUrl('/csrf-token');
      console.log('[API Call] Fetching CSRF token from:', csrfUrl);
      const csrfResponse = await fetch(csrfUrl, {
        method: 'GET',
        credentials: 'include'
      });

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const { csrfToken } = await csrfResponse.json();

      const statusUrl = buildApiUrl(`/marketplace/providers/${providerId}/status`);
      console.log('[handleStatusChange] Status change URL:', statusUrl);
      const response = await fetch(statusUrl,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
            Authorization: `Bearer ${token}`
          },
          credentials: 'include',
          body: JSON.stringify({ isActive })
        }
      );

      if (!response.ok) {
        throw new Error('Неуспешна промена на статус');
      }

      setSuccess(`Провајдерот е успешно ${isActive ? 'активиран' : 'деактивиран'}.`);
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
      const csrfUrl = buildApiUrl('/csrf-token');
      console.log('[API Call] Fetching CSRF token from:', csrfUrl);
      const csrfResponse = await fetch(csrfUrl, {
        method: 'GET',
        credentials: 'include'
      });

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const { csrfToken } = await csrfResponse.json();

      const deleteUrl = buildApiUrl(`/marketplace/providers/${providerId}`);
      console.log('[handleDelete] Delete URL:', deleteUrl);
      const response = await fetch(deleteUrl,
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
      serviceCategory: provider.serviceCategory || '',
      specializations: provider.specializations || [],
      description: provider.description || '',
      location: typeof provider.location === 'string' ? provider.location : (provider.location?.city || provider.location?.town || ''),
      servesRemote: provider.servesRemote || false,
      businessInfo: {
        registrationNumber: provider.businessInfo?.registrationNumber || '',
        taxNumber: provider.businessInfo?.taxNumber || '',
        languagesSupported: provider.businessInfo?.languagesSupported || ['mk', 'en']
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
      serviceCategory: '',
      specializations: [],
      description: '',
      location: '',
      servesRemote: false,
      businessInfo: {
        registrationNumber: '',
        taxNumber: '',
        languagesSupported: ['mk', 'en']
      }
    });
  };

  // Real-time JSON validation function
  const validateJsonFormat = (jsonString) => {
    // Ensure jsonString is a string
    const str = typeof jsonString === 'string' ? jsonString : String(jsonString || '');

    if (!str.trim()) {
      setJsonValidation({ isValid: true, message: '', count: 0 });
      return;
    }

    try {
      const trimmedData = str.trim();

      // Check if it starts with [ (array format - preferred)
      if (trimmedData.startsWith('[') && trimmedData.endsWith(']')) {
        const parsed = JSON.parse(trimmedData);
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) {
            setJsonValidation({
              isValid: false,
              message: '⚠️ Низата е празна. Додајте најмалку еден провајдер.',
              count: 0
            });
          } else {
            setJsonValidation({
              isValid: true,
              message: `✅ Валиден формат. Ќе се увезат ${parsed.length} провајдер${parsed.length > 1 ? 'и' : ''}.`,
              count: parsed.length
            });
          }
        } else {
          setJsonValidation({
            isValid: false,
            message: '❌ Не е валидна низа. Користете [{...}, {...}] формат.',
            count: 0
          });
        }
      }
      // Check if it's a single object (allowed but not preferred)
      else if (trimmedData.startsWith('{') && trimmedData.endsWith('}')) {
        JSON.parse(trimmedData); // Just validate it's valid JSON
        setJsonValidation({
          isValid: true,
          message: '⚠️ Еден провајдер. Препорачуваме низа формат: [{...}]',
          count: 1
        });
      }
      // Invalid format
      else {
        setJsonValidation({
          isValid: false,
          message: '❌ JSON мора да започнува со [ за низа или { за објект.',
          count: 0
        });
      }
    } catch (error) {
      setJsonValidation({
        isValid: false,
        message: `❌ JSON синтакс грешка: ${error.message}`,
        count: 0
      });
    }
  };

  // Handle textarea change with validation
  const handleBulkJsonChange = (e) => {
    const value = e.target.value;
    setBulkJsonData(value);
    validateJsonFormat(value);
  };

  const handleBulkImport = async () => {
    setError('');
    setSuccess('');

    const jsonStr = typeof bulkJsonData === 'string' ? bulkJsonData : String(bulkJsonData || '');
    if (!jsonStr.trim()) {
      setError('Внесете JSON податоци за провајдерите.');
      return;
    }

    // Check frontend validation first
    if (!jsonValidation.isValid) {
      setError('Поправете го JSON форматот пред да продолжите.');
      return;
    }

    try {
      // Parse JSON data - support both single object and array
      let providersData;
      const trimmedData = jsonStr.trim();

      if (trimmedData.startsWith('[')) {
        // Array of providers
        providersData = JSON.parse(trimmedData);
      } else if (trimmedData.startsWith('{')) {
        // Single provider object
        providersData = [JSON.parse(trimmedData)];
      } else {
        throw new Error('JSON format should be either single object {} or array []');
      }

      if (!Array.isArray(providersData)) {
        providersData = [providersData];
      }

      console.log('[Bulk Import] Parsed providers data:', providersData);

      // Process each provider and fill missing fields
      const processedProviders = providersData.map(provider => {
        // Extract fields from the provided data, handling both new and old formats
        const processedProvider = {
          name: provider.name || '',
          email: provider.email || '',
          phone: provider.phone || '',
          website: provider.website || '',
          serviceCategory: provider.serviceCategory || '',
          specializations: provider.specializations || {},
          description: provider.description || '',
          location: typeof provider.location === 'string' ? provider.location : (provider.location?.city || provider.location?.town || ''),
          businessInfo: {
            registrationNumber: provider.businessInfo?.registrationNumber || '',
            taxNumber: provider.businessInfo?.taxNumber || '',
            languagesSupported: provider.businessInfo?.languagesSupported || ['mk', 'en']
          }
        };

        return processedProvider;
      });

      console.log('[Bulk Import] Processed providers:', processedProviders);

      // Get CSRF token
      const csrfUrl = buildApiUrl('/csrf-token');
      console.log('[Bulk Import] Fetching CSRF token from:', csrfUrl);
      const csrfResponse = await fetch(csrfUrl, {
        method: 'GET',
        credentials: 'include'
      });

      if (!csrfResponse.ok) {
        throw new Error('Неуспешно земање на CSRF токен');
      }

      const { csrfToken } = await csrfResponse.json();

      // Send bulk create request
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Add delay between requests to avoid rate limiting
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      for (let i = 0; i < processedProviders.length; i++) {
        try {
          const url = buildApiUrl('/marketplace/providers');
          console.log(`[Bulk Import] Creating provider ${i + 1}/${processedProviders.length}:`, processedProviders[i]);

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
              Authorization: `Bearer ${token}`
            },
            credentials: 'include',
            body: JSON.stringify(processedProviders[i])
          });

          // Add 100ms delay between requests to stay within rate limits
          if (i < processedProviders.length - 1) {
            await delay(100);
          }

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
            const errorData = await response.json();
            errors.push(`Провајдер ${i + 1}: ${errorData.message || 'Непозната грешка'}`);
          }
        } catch (err) {
          errorCount++;
          errors.push(`Провајдер ${i + 1}: ${err.message}`);
        }
      }

      // Show results
      if (successCount > 0 && errorCount === 0) {
        setSuccess(`Успешно се додадени ${successCount} провајдери.`);
      } else if (successCount > 0 && errorCount > 0) {
        setSuccess(`Додадени ${successCount} провајдери. ${errorCount} грешки.`);
        if (errors.length > 0) {
          setError(errors.slice(0, 3).join('; ') + (errors.length > 3 ? '...' : ''));
        }
      } else {
        setError(`Неуспешно додавање. Грешки: ${errors.slice(0, 3).join('; ')}`);
      }

      if (successCount > 0) {
        setBulkJsonData('');
        setShowBulkImport(false);
        fetchProviders();
      }

      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);

    } catch (err) {
      console.error('[Bulk Import] JSON parsing error:', err);
      setError(`Грешка при парсирање на JSON: ${err.message}`);
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? '#22c55e' : '#ef4444';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Активен' : 'Неактивен';
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
          <div style={{ display: 'flex', gap: '1rem' }}>
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
            <button
              className={styles.addButton}
              style={{ background: 'var(--color-info, #3B82F6)' }}
              onClick={() => {
                setShowBulkImport(true);
                setBulkJsonData('');
              }}
            >
              📋 Bulk Import
            </button>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        {/* Filters */}
        <div className={styles.filters}>
          <select
            value={filters.active}
            onChange={(e) => setFilters({ ...filters, active: e.target.value })}
          >
            <option value="">Сите статуси</option>
            <option value="true">Активни</option>
            <option value="false">Неактивни</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">Сите категории</option>
            {serviceCategories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
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
                  <label>Категорија на услуга *</label>
                  <select
                    className={styles.formSelect}
                    value={formData.serviceCategory}
                    onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value })}
                    required
                  >
                    <option value="">Избери категорија</option>
                    {serviceCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
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
                    <select
                      value={formData.location}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: e.target.value
                      })}
                      required
                    >
                      <option value="">Изберете град</option>
                      {macedonianTowns.map(town => (
                        <option key={town} value={town}>{town}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    {/* Region removed - using town dropdown instead */}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.servesRemote}
                      onChange={(e) => setFormData({
                        ...formData,
                        servesRemote: e.target.checked
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

        {/* Bulk Import Modal */}
        {showBulkImport && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>Bulk Import на провајдери</h2>
                <button
                  className={styles.closeButton}
                  onClick={() => {
                    setShowBulkImport(false);
                    setBulkJsonData('');
                  }}
                >
                  ×
                </button>
              </div>
              <div className={styles.form}>
                {/* Instructions Section */}
                <div style={{
                  background: 'var(--color-neutral-50, #FAFAFA)',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  border: '1px solid var(--color-border, #E5E5E5)'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-dark, #262626)', fontSize: '1rem' }}>
                    📝 Инструкции за употреба:
                  </h4>
                  <ol style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.2rem', color: 'var(--color-text-primary, #404040)', lineHeight: '1.6' }}>
                    <li><strong>За еден провајдер:</strong> Внесете JSON објект <code>{`{ ... }`}</code></li>
                    <li><strong>За повеќе провајдери:</strong> Внесете низа од JSON објекти <code>{`[{ ... }, { ... }]`}</code></li>
                    <li><strong>Задолжителни полиња:</strong> <code>name</code> и <code>email</code></li>
                    <li><strong>Категории:</strong> legal, accounting, financial, consulting, technical, marketing, design, other</li>
                    <li><strong>Градови:</strong> Скопје, Битола, Куманово, Прилеп, Тетово, Велес, Штип, Охрид, Гостивар, Струмица</li>
                  </ol>
                </div>

                {/* Example Section */}
                <div style={{
                  background: 'var(--color-info-bg, #eff6ff)',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  border: '1px solid var(--color-info-border, #bfdbfe)'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-info-dark, #1e40af)', fontSize: '1rem' }}>
                    💡 Пример за копирање:
                  </h4>
                  <pre style={{
                    background: 'var(--color-surface, #ffffff)',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    overflow: 'auto',
                    border: '1px solid var(--color-border, #E5E5E5)',
                    margin: '0',
                    lineHeight: '1.4'
                  }}>
{`[
  {
    "name": "Правна канцеларија Македонија",
    "email": "info@pravna.mk",
    "phone": "02/123-456",
    "website": "https://pravna.mk",
    "serviceCategory": "legal",
    "description": "Правни услуги за компании",
    "location": "Скопје"
  },
  {
    "name": "Сметководствени услуги",
    "email": "contact@accounting.mk",
    "serviceCategory": "accounting",
    "location": { "city": "Битола" }
  }
]`}
                  </pre>
                </div>

                <div className={styles.formGroup}>
                  <label>JSON податоци за провајдери</label>
                  <textarea
                    value={bulkJsonData}
                    onChange={handleBulkJsonChange}
                    rows={12}
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      width: '100%',
                      padding: '1rem',
                      border: `1px solid ${jsonValidation.isValid ? 'var(--color-border, #E5E5E5)' : 'var(--color-danger, #ef4444)'}`,
                      borderRadius: 'var(--border-radius-md, 8px)',
                      resize: 'vertical',
                      backgroundColor: jsonValidation.isValid ? 'var(--color-surface, #ffffff)' : 'var(--color-error-bg, #fef2f2)'
                    }}
                    placeholder={`Пример за еден провајдер:
{
  "name": "Име на компанијата",
  "email": "email@example.com",
  "phone": "070123456",
  "website": "https://example.com",
  "serviceCategory": "legal",
  "description": "Опис на услугите",
  "location": "Скопје"
}

Или за повеќе провајдери во низа: [{ ... }, { ... }]`}
                  />

                  {/* JSON Validation Feedback */}
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    {bulkJsonData.trim() && !jsonValidation.isValid && (
                      <div style={{ color: 'var(--color-danger, #ef4444)', fontWeight: '500' }}>
                        ❌ {jsonValidation.message}
                      </div>
                    )}
                    {bulkJsonData.trim() && jsonValidation.isValid && jsonValidation.count > 0 && (
                      <div style={{ color: 'var(--color-success, #22c55e)', fontWeight: '500' }}>
                        ✅ Валиден JSON формат - {jsonValidation.count} провајдер{jsonValidation.count !== 1 ? 'и' : ''}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.submitButton}
                    onClick={handleBulkImport}
                    disabled={!(String(bulkJsonData || '')).trim() || !jsonValidation.isValid}
                    style={{
                      opacity: (!(String(bulkJsonData || '')).trim() || !jsonValidation.isValid) ? 0.6 : 1,
                      cursor: (!(String(bulkJsonData || '')).trim() || !jsonValidation.isValid) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    🚀 Import провајдери
                  </button>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => {
                      setShowBulkImport(false);
                      setBulkJsonData('');
                    }}
                  >
                    Откажи
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Providers Table */}
        <div className={styles.providersTableContainer}>
          {providers.length === 0 ? (
            <div className={styles.noProviders}>
              Нема пронајдени провајдери.
            </div>
          ) : (
            <table className={styles.providersTable}>
              <thead>
                <tr>
                  <th>Име</th>
                  <th>Email</th>
                  <th>Телефон</th>
                  <th>Град</th>
                  <th>Категорија</th>
                  <th>Опис</th>
                  <th>Статус</th>
                  <th>Акции</th>
                </tr>
              </thead>
              <tbody>
                {providers.map(provider => (
                  <tr key={provider._id} className={styles.providerRow}>
                    <td className={styles.providerName}>{provider.name}</td>
                    <td>{provider.email}</td>
                    <td>{provider.phone || 'Не е внесен'}</td>
                    <td>{typeof provider.location === 'string' ? provider.location : (provider.location?.city || provider.location?.town || 'Не е внесено')}</td>
                    <td>{serviceCategories.find(cat => cat.value === provider.serviceCategory)?.label || provider.serviceCategory}</td>
                    <td className={styles.providerDescription}>
                      {provider.description || 'Нема опис'}
                    </td>
                    <td>
                      <span
                        className={styles.statusBadge}
                        style={{ backgroundColor: getStatusColor(provider.isActive) }}
                      >
                        {getStatusText(provider.isActive)}
                      </span>
                    </td>
                    <td className={styles.providerActions}>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleEdit(provider)}
                        title="Ажурирај"
                      >
                        ✎
                      </button>
                      {provider.isActive ? (
                        <button
                          className={styles.actionButton}
                          onClick={() => handleStatusChange(provider._id, false)}
                          title="Деактивирај"
                        >
                          ⏸
                        </button>
                      ) : (
                        <button
                          className={styles.actionButton}
                          onClick={() => handleStatusChange(provider._id, true)}
                          title="Активирај"
                        >
                          ▶
                        </button>
                      )}
                      <button
                        className={styles.actionButton}
                        onClick={() => handleDelete(provider._id)}
                        title="Избриши"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ProfileRequired>
  );
};

export default ManageServiceProviders;