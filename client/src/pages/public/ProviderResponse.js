import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../../styles/public/ProviderResponse.module.css';

const ProviderResponse = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState(null);
  const [responseType, setResponseType] = useState('');
  const [formData, setFormData] = useState({
    // Accept fields
    budgetAccepted: '',
    priceDetails: '',
    timelineAcceptable: '',
    timelineComment: '',
    relevantExperience: '',
    experienceDetails: '',
    approachComment: '',

    // Decline fields
    declineReason: '',
    declineComment: '',

    // Unsubscribe fields
    unsubscribeReason: '',
    unsubscribeComment: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/provider-response/validate/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Agent': navigator.userAgent,
          'X-Client-IP': 'auto'
        }
      });

      if (!response.ok) {
        throw new Error('Неважечки или истечен токен');
      }

      const data = await response.json();
      setTokenData(data);
      setLoading(false);

    } catch (error) {
      console.error('Token validation error:', error);
      setErrors({ token: error.message });
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!responseType) {
      newErrors.responseType = 'Изберете тип на одговор';
    }

    if (responseType === 'accept') {
      if (!formData.budgetAccepted) {
        newErrors.budgetAccepted = 'Одговорете дали го прифаќате предложениот буџет';
      }
      if (!formData.timelineAcceptable) {
        newErrors.timelineAcceptable = 'Одговорете дали можете да го исполните рокот';
      }
      if (!formData.relevantExperience) {
        newErrors.relevantExperience = 'Одговорете дали имате релевантно искуство';
      }
      if (!formData.approachComment || formData.approachComment.length < 100) {
        newErrors.approachComment = 'Опишете го вашиот пристап (минимум 100 карактери)';
      }
      if (formData.approachComment && formData.approachComment.length > 2000) {
        newErrors.approachComment = 'Описот не смее да биде подолг од 2000 карактери';
      }
    }

    if (responseType === 'decline') {
      if (!formData.declineReason) {
        newErrors.declineReason = 'Изберете причина за одбивање';
      }
    }

    if (responseType === 'unsubscribe') {
      if (!formData.unsubscribeReason) {
        newErrors.unsubscribeReason = 'Изберете причина за отпишување';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/provider-response/submit/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Agent': navigator.userAgent,
          'X-Client-IP': 'auto'
        },
        body: JSON.stringify({
          responseType,
          ...formData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Грешка при праќање на одговорот');
      }

      const data = await response.json();
      setResponseMessage(data.message);
      setSubmitted(true);

    } catch (error) {
      console.error('Submit error:', error);
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const renderAcceptForm = () => (
    <div className={styles.responseSection}>
      <h3>Прифаќање на понудата</h3>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          Дали го прифаќате предложениот буџет од {tokenData?.request?.budgetRange}? *
        </label>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="budgetAccepted"
              value="да"
              checked={formData.budgetAccepted === 'да'}
              onChange={handleInputChange}
            />
            Да, го прифаќам буџетот
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="budgetAccepted"
              value="потребна_дискусија"
              checked={formData.budgetAccepted === 'потребна_дискусија'}
              onChange={handleInputChange}
            />
            Потребна е дискусија за цената
          </label>
        </div>
        {errors.budgetAccepted && <span className={styles.errorText}>{errors.budgetAccepted}</span>}
      </div>

      {formData.budgetAccepted === 'потребна_дискусија' && (
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Детали за цената:</label>
          <textarea
            className={styles.formTextarea}
            name="priceDetails"
            value={formData.priceDetails}
            onChange={handleInputChange}
            placeholder="Објаснете ги вашите размислувања за цената..."
            rows="3"
          />
        </div>
      )}

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          Дали можете да го исполните предложениот рок ({tokenData?.request?.timeline})? *
        </label>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="timelineAcceptable"
              value="да"
              checked={formData.timelineAcceptable === 'да'}
              onChange={handleInputChange}
            />
            Да, можам да го исполнам рокот
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="timelineAcceptable"
              value="потребно_прилагодување"
              checked={formData.timelineAcceptable === 'потребно_прилагодување'}
              onChange={handleInputChange}
            />
            Потребно е прилагодување на рокот
          </label>
        </div>
        {errors.timelineAcceptable && <span className={styles.errorText}>{errors.timelineAcceptable}</span>}
      </div>

      {formData.timelineAcceptable === 'потребно_прилагодување' && (
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Коментар за рокот:</label>
          <textarea
            className={styles.formTextarea}
            name="timelineComment"
            value={formData.timelineComment}
            onChange={handleInputChange}
            placeholder="Објаснете какво прилагодување е потребно..."
            rows="3"
          />
        </div>
      )}

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          Дали имате релевантно искуство за овој тип на проект? *
        </label>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="relevantExperience"
              value="да"
              checked={formData.relevantExperience === 'да'}
              onChange={handleInputChange}
            />
            Да, имам релевантно искуство
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="relevantExperience"
              value="делумно"
              checked={formData.relevantExperience === 'делумно'}
              onChange={handleInputChange}
            />
            Делумно релевантно искуство
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="relevantExperience"
              value="не"
              checked={formData.relevantExperience === 'не'}
              onChange={handleInputChange}
            />
            Немам директно искуство, но можам да се справам
          </label>
        </div>
        {errors.relevantExperience && <span className={styles.errorText}>{errors.relevantExperience}</span>}
      </div>

      {(formData.relevantExperience === 'да' || formData.relevantExperience === 'делумно') && (
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Детали за вашето искуство:</label>
          <textarea
            className={styles.formTextarea}
            name="experienceDetails"
            value={formData.experienceDetails}
            onChange={handleInputChange}
            placeholder="Опишете го вашето релевантно искуство..."
            rows="4"
          />
        </div>
      )}

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          Како би се приближиле кон решавањето на овој проект? *
          <span className={styles.charCount}>
            ({formData.approachComment.length}/2000 карактери, минимум 100)
          </span>
        </label>
        <textarea
          className={styles.formTextarea}
          name="approachComment"
          value={formData.approachComment}
          onChange={handleInputChange}
          placeholder="Детално опишете го вашиот пристап, методологијата, чекорите што би ги преземеле, и како би го решиле проблемот..."
          rows="8"
          required
        />
        {errors.approachComment && <span className={styles.errorText}>{errors.approachComment}</span>}
      </div>
    </div>
  );

  const renderDeclineForm = () => (
    <div className={styles.responseSection}>
      <h3>Одбивање на понудата</h3>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Причина за одбивање: *</label>
        <select
          className={styles.formSelect}
          name="declineReason"
          value={formData.declineReason}
          onChange={handleInputChange}
          required
        >
          <option value="">Изберете причина</option>
          <option value="недоволен_буџет">Недоволен буџет</option>
          <option value="краток_рок">Премногу краток рок</option>
          <option value="недостасува_искуство">Недостасува потребното искуство</option>
          <option value="зафатен_сум">Моментално сум зафатен</option>
          <option value="не_е_во_мојата_област">Не е во мојата област на експертиза</option>
          <option value="друго">Друго</option>
        </select>
        {errors.declineReason && <span className={styles.errorText}>{errors.declineReason}</span>}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Дополнителен коментар (опционално):</label>
        <textarea
          className={styles.formTextarea}
          name="declineComment"
          value={formData.declineComment}
          onChange={handleInputChange}
          placeholder="Ако сакате, додајте дополнителни детали..."
          rows="4"
        />
      </div>
    </div>
  );

  const renderUnsubscribeForm = () => (
    <div className={styles.responseSection}>
      <h3>Отпишување од понатамошни известувања</h3>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Причина за отпишување: *</label>
        <select
          className={styles.formSelect}
          name="unsubscribeReason"
          value={formData.unsubscribeReason}
          onChange={handleInputChange}
          required
        >
          <option value="">Изберете причина</option>
          <option value="премногу_често">Премногу чести email-и</option>
          <option value="не_е_релевантно">Понудите не се релевантни за мене</option>
          <option value="смена_на_професија">Повеќе не работам во оваа област</option>
          <option value="користам_други_канали">Користам други канали за наоѓање работа</option>
          <option value="друго">Друго</option>
        </select>
        {errors.unsubscribeReason && <span className={styles.errorText}>{errors.unsubscribeReason}</span>}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Дополнителен коментар (опционално):</label>
        <textarea
          className={styles.formTextarea}
          name="unsubscribeComment"
          value={formData.unsubscribeComment}
          onChange={handleInputChange}
          placeholder="Ако сакате, кажете ни како можеме да ги подобриме нашите услуги..."
          rows="4"
        />
      </div>

      <div className={styles.warningBox}>
        <p><strong>Напомена:</strong> Доколку се отпишете, нема да добивате понатамошни известувања за понуди што би можеле да ве интересираат.</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          <p>Се вчитува...</p>
        </div>
      </div>
    );
  }

  if (errors.token) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2>Грешка</h2>
          <p>{errors.token}</p>
          <p>Можно е линкот да е истечен или неважечки. Контактирајте ни доколку мислите дека ова е грешка.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>✓</div>
          <h2>Успешно</h2>
          <p>{responseMessage}</p>
          <div className={styles.contactInfo}>
            <p>Доколку имате прашања, можете да не контактирате на:</p>
            <p>Email: info@nexa.mk</p>
            <p>Телефон: +389 XX XXX XXX</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <div className={styles.header}>
          <h1>Одговор на понуда за услуга</h1>
          <div className={styles.requestInfo}>
            <h3>Детали за проектот:</h3>
            <p><strong>Тип на услуга:</strong> {tokenData?.request?.serviceType}</p>
            <p><strong>Буџет:</strong> {tokenData?.request?.budgetRange}</p>
            <p><strong>Рок:</strong> {tokenData?.request?.timeline}</p>
            <p><strong>Опис:</strong> {tokenData?.request?.projectDescription}</p>
            {tokenData?.request?.serviceSpecificFields && (
              <div className={styles.additionalInfo}>
                <strong>Дополнителни информации:</strong>
                <pre>{JSON.stringify(tokenData.request.serviceSpecificFields, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.responseForm}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Изберете го вашиот одговор: *</label>
            <div className={styles.responseTypeButtons}>
              <button
                type="button"
                className={`${styles.responseButton} ${styles.acceptButton} ${responseType === 'accept' ? styles.active : ''}`}
                onClick={() => setResponseType('accept')}
              >
                <span className={styles.buttonIcon}>✓</span>
                Прифаќам
              </button>
              <button
                type="button"
                className={`${styles.responseButton} ${styles.declineButton} ${responseType === 'decline' ? styles.active : ''}`}
                onClick={() => setResponseType('decline')}
              >
                <span className={styles.buttonIcon}>✗</span>
                Одбивам
              </button>
              <button
                type="button"
                className={`${styles.responseButton} ${styles.unsubscribeButton} ${responseType === 'unsubscribe' ? styles.active : ''}`}
                onClick={() => setResponseType('unsubscribe')}
              >
                <span className={styles.buttonIcon}>🚫</span>
                Отпиши ме
              </button>
            </div>
            {errors.responseType && <span className={styles.errorText}>{errors.responseType}</span>}
          </div>

          {responseType === 'accept' && renderAcceptForm()}
          {responseType === 'decline' && renderDeclineForm()}
          {responseType === 'unsubscribe' && renderUnsubscribeForm()}

          {responseType && (
            <div className={styles.formActions}>
              {errors.submit && (
                <div className={styles.errorMessage}>
                  {errors.submit}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={styles.submitButton}
              >
                {submitting ? 'Се праќа...' : 'Испрати одговор'}
              </button>
            </div>
          )}
        </form>

        <div className={styles.footer}>
          <p>Овој одговор е поврзан со вашата email адреса: <strong>{tokenData?.provider?.email}</strong></p>
          <p>Доколку имате прашања, контактирајте не на info@nexa.mk</p>
        </div>
      </div>
    </div>
  );
};

export default ProviderResponse;