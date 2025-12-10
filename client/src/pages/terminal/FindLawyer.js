import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import styles from '../../styles/terminal/Contact.module.css';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import ProfileReminderBanner from '../../components/terminal/ProfileReminderBanner';
import CityAutocomplete from '../../components/common/CityAutocomplete';
import { useAuth } from '../../contexts/AuthContext';

const FindLawyer = () => {
  const { token, currentUser } = useAuth();
  const location = useLocation();
  const isTerminal = location.pathname.startsWith('/terminal');

  // Enhanced form data for "Најди адвокат"
  const [formData, setFormData] = useState({
    requestCategory: 'legal', // Fixed for legal services
    serviceType: 'legal', // Fixed to legal
    budgetRange: '',
    projectDescription: '',
    projectType: 'еднократен',
    timeline: '',
    preferredLocations: [], // Changed to array for multiple selections
    serviceSpecificFields: {
      legalMatter: '',
      urgency: '',
      documentsAvailable: ''
    },
    acceptTerms: false
  });

  // Legal-specific matter types
  const legalMatterTypes = [
    { value: 'договорно-право', label: 'Договорно право' },
    { value: 'работно-право', label: 'Работно право' },
    { value: 'трговско-право', label: 'Трговско право' },
    { value: 'граѓанско-право', label: 'Граѓанско право' },
    { value: 'казнено-право', label: 'Казнено право' },
    { value: 'семејно-право', label: 'Семејно право' },
    { value: 'недвижно-право', label: 'Недвижно право' },
    { value: 'друго', label: 'Друго' }
  ];

  // Legal urgency levels
  const urgencyLevels = [
    { value: 'итно-до-3-дена', label: 'Итно (до 3 дена)' },
    { value: 'средно-итно-до-1-недела', label: 'Средно итно (до 1 недела)' },
    { value: 'стандардно-до-1-месец', label: 'Стандардно (до 1 месец)' },
    { value: 'не-е-итно', label: 'Не е итно' }
  ];

  // Document availability
  const documentAvailabilityOptions = [
    { value: 'сите-потребни-документи', label: 'Сите потребни документи' },
    { value: 'дел-од-документите', label: 'Дел од документите' },
    { value: 'нема-документи', label: 'Нема документи' },
    { value: 'не-сум-сигурен', label: 'Не сум сигурен' }
  ];

  // Macedonian cities for location filtering
  const macedonianCities = [
    'Скопје', 'Битола', 'Куманово', 'Прилеп', 'Тетово', 'Велес', 'Штип',
    'Охрид', 'Гостивар', 'Струмица', 'Радовиш', 'Кавадарци', 'Кочани',
    'Свети Николе', 'Гевгелија', 'Дебар', 'Кичево', 'Виница', 'Неготино',
    'Берово', 'Делчево', 'Пехчево', 'Македонски Брод', 'Ресен', 'Крива Паланка',
    'Богданци', 'Демир Хисар', 'Македонска Каменица', 'Валандово', 'Кратово',
    'Струга', 'Дојран', 'Пробиштип', 'Крушево', 'Демир Капија'
  ].sort();

  // Simplified state management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Budget Ranges - matching server validation schema
  const budgetRanges = [
    { value: 'до-25000', label: 'До 25.000 МКД (€500)' },
    { value: '25000-50000', label: '25.000-50.000 МКД (€500-€1.000)' },
    { value: '50000-125000', label: '50.000-125.000 МКД (€1.000-€2.500)' },
    { value: '125000-250000', label: '125.000-250.000 МКД (€2.500-€5.000)' },
    { value: '250000-625000', label: '250.000-625.000 МКД (€5.000-€12.500)' },
    { value: 'над-625000', label: 'Над 625.000 МКД (€12.500+)' }
  ];

  // Project Type Options
  const projectTypeOptions = [
    { value: 'еднократен', label: 'Еднократен проект' },
    { value: 'континуиран', label: 'Континуирана соработка' }
  ];

  // Timeline Options - matching server validation schema
  const timelineOptions = [
    { value: 'до-1-недела', label: 'До 1 недела' },
    { value: 'до-1-месец', label: 'До 1 месец' },
    { value: 'до-3-месеци', label: 'До 3 месеци' },
    { value: 'над-6-месеци', label: 'Над 6 месеци' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleLocationChange = (newLocations) => {
    setFormData({
      ...formData,
      preferredLocations: newLocations
    });
  };

  const handleServiceSpecificChange = (field, value) => {
    setFormData({
      ...formData,
      serviceSpecificFields: {
        ...formData.serviceSpecificFields,
        [field]: value
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Basic validation
    if (formData.projectDescription.trim().length < 20) {
      setError('Опишете го вашето барање во најмалку 20 карактери.');
      setLoading(false);
      return;
    }

    if (formData.preferredLocations.length === 0) {
      setError('Изберете најмалку една локација каде можете да примите услуги.');
      setLoading(false);
      return;
    }

    if (!formData.acceptTerms) {
      setError('Мора да се согласите со условите за работа за да продолжите.');
      setLoading(false);
      return;
    }

    try {
      // Get CSRF token
      const csrfResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!csrfResponse.ok) {
        throw new Error('Неуспешно земање на CSRF токен');
      }

      const { csrfToken } = await csrfResponse.json();

      // Submit offer request with user email and company info from auth context
      const requestData = {
        ...formData,
        email: currentUser.email,
        name: currentUser?.companyInfo?.companyName || ''
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/offer-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Неуспешно поднесување на барањето за правна помош');
      }

      const result = await response.json();
      setSuccess('Вашето барање за правна помош е успешно поднесено! Ќе бидете контактирани од соодветни адвокати.');

      // Reset form
      setFormData({
        requestCategory: 'legal',
        serviceType: 'legal',
        budgetRange: '',
        projectDescription: '',
        projectType: 'еднократен',
        timeline: '',
        preferredLocations: [],
        serviceSpecificFields: {
          legalMatter: '',
          urgency: '',
          documentsAvailable: ''
        },
        acceptTerms: false
      });

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header isTerminal={isTerminal} />

      <div className={styles["dashboard-layout"]}>
        <Sidebar />

        <main className={styles["dashboard-main"]}>
          <ProfileReminderBanner />

          <div className={styles['contact-container']}>
            <div className={styles['contact-header']}>
              <h1>Најди адвокат</h1>
              <p>Поднесете барање за правна помош и поврзете се со соодветни адвокати и правни експерти.</p>
            </div>

          <div className={styles['contact-form']}>
            {error && <div className={styles['error-message']}>{error}</div>}
            {success && <div className={styles['success-message']}>{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className={styles['form-grid']}>
                {/* Left Column */}
                <div className={`${styles['form-column']} ${styles['form-column-left']}`}>
                  {/* Legal Matter Type */}
                  <div className={styles['form-group']}>
                    <label htmlFor="legalMatter" className={styles['form-label']}>Тип на правна материја *</label>
                    <select
                      id="legalMatter"
                      className={styles['form-select']}
                      value={formData.serviceSpecificFields.legalMatter}
                      onChange={(e) => handleServiceSpecificChange('legalMatter', e.target.value)}
                      required
                    >
                      <option value="">Избери тип на правна материја</option>
                      {legalMatterTypes.map(matter => (
                        <option key={matter.value} value={matter.value}>
                          {matter.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Urgency */}
                  <div className={styles['form-group']}>
                    <label htmlFor="urgency" className={styles['form-label']}>Итност на случајот *</label>
                    <select
                      id="urgency"
                      className={styles['form-select']}
                      value={formData.serviceSpecificFields.urgency}
                      onChange={(e) => handleServiceSpecificChange('urgency', e.target.value)}
                      required
                    >
                      <option value="">Избери ниво на итност</option>
                      {urgencyLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Budget Range */}
                  <div className={styles['form-group']}>
                    <label htmlFor="budgetRange" className={styles['form-label']}>Буџет *</label>
                    <select
                      id="budgetRange"
                      name="budgetRange"
                      className={styles['form-select']}
                      value={formData.budgetRange}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Избери буџет</option>
                      {budgetRanges.map(budget => (
                        <option key={budget.value} value={budget.value}>
                          {budget.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Project Type - Dropdown */}
                  <div className={styles['form-group']}>
                    <label htmlFor="projectType" className={styles['form-label']}>Тип на проект *</label>
                    <select
                      id="projectType"
                      name="projectType"
                      className={styles['form-select']}
                      value={formData.projectType}
                      onChange={handleInputChange}
                      required
                    >
                      {projectTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Timeline */}
                  <div className={styles['form-group']}>
                    <label htmlFor="timeline" className={styles['form-label']}>Временски рок *</label>
                    <select
                      id="timeline"
                      name="timeline"
                      className={styles['form-select']}
                      value={formData.timeline}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Избери временски рок</option>
                      {timelineOptions.map(timeline => (
                        <option key={timeline.value} value={timeline.value}>
                          {timeline.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Documents Available */}
                  <div className={styles['form-group']}>
                    <label htmlFor="documentsAvailable" className={styles['form-label']}>Достапни документи</label>
                    <select
                      id="documentsAvailable"
                      className={styles['form-select']}
                      value={formData.serviceSpecificFields.documentsAvailable}
                      onChange={(e) => handleServiceSpecificChange('documentsAvailable', e.target.value)}
                    >
                      <option value="">Избери статус на документи</option>
                      {documentAvailabilityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Column */}
                <div className={`${styles['form-column']} ${styles['form-column-right']}`}>
                  {/* Preferred Locations - Autocomplete */}
                  <div className={styles['form-group']}>
                    <label className={styles['form-label']}>Локации каде можете да примите услуги *</label>
                    <CityAutocomplete
                      cities={macedonianCities}
                      selectedCities={formData.preferredLocations}
                      onChange={handleLocationChange}
                      placeholder="Внесете град (пр. Скопје, Прилеп...)"
                    />
                    {formData.preferredLocations.length === 0 && (
                      <small style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        Започнете да пишувате за да видите предлози
                      </small>
                    )}
                  </div>
                </div>

                {/* Full-width items */}
                {/* Project Description */}
                <div className={`${styles['form-group']} ${styles['form-full-width']}`}>
                  <label htmlFor="projectDescription" className={styles['form-label']}>Опис на правниот случај *</label>
                  <textarea
                    id="projectDescription"
                    name="projectDescription"
                    className={styles['form-textarea']}
                    value={formData.projectDescription}
                    onChange={handleInputChange}
                    placeholder="Опишете го вашиот правен случај детално. Вклучете релевантни факти, временски рамки и што сакате да постигнете..."
                    required
                    rows="4"
                  />
                </div>

                {/* Form Actions */}
                <div className={styles['form-actions']}>
                  {/* Terms and Conditions Checkbox */}
                  <div className={styles['form-group']}>
                    <div className={styles['terms-checkbox']}>
                      <label className={styles['checkbox-label']}>
                        <input
                          type="checkbox"
                          checked={formData.acceptTerms}
                          onChange={(e) => setFormData({
                            ...formData,
                            acceptTerms: e.target.checked
                          })}
                          required
                        />
                        <span className={styles['checkbox-text']}>
                          Со испраќањето на ова барање се согласувате на условите за работа и ни дозволувате да ги споделиме наведените податоци со адвокати и правни експерти, но без да го наведеме Вашиот назив или слични податоци. Доколку во податоците наведени погоре се изнесува деловна тајна или други деловни податоци, барањето ќе биде одбиено и нема да биде спроведено до адвокатите.{' '}
                          <a
                            href="/terminal/disclaimer"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles['disclaimer-link']}
                          >
                            Прочитајте повеќе за условите и GDPR правилата.
                          </a>
                        </span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={styles['submit-button']}
                    disabled={loading || !formData.acceptTerms}
                  >
                    {loading ? 'Се поднесува...' : 'Најди адвокат'}
                  </button>

                  <div className={styles['form-disclaimer']}>
                    <p>
                      <strong>Како функционира:</strong> Вашето барање ќе биде прегледано од нашиот тим и потоа
                      проследено до релевантни адвокати. Ќе добиете одговори директно од заинтересираните правни експерти.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
        </main>
        </div>
    </div>
  );
};

export default FindLawyer;