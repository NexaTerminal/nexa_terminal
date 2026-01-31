import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import styles from '../../../styles/terminal/admin/AddBlog.module.css';
import Header from '../../../components/common/Header';
import Footer from '../../../components/common/Footer';
import Sidebar from '../../../components/terminal/Sidebar';
import ProfileRequired from '../../../components/common/ProfileRequired';
import { getToolsGroupedByCategory } from '../../../config/promotedTools';

const AddBlog = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isTerminal = true;
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'legal',
    language: 'mk',
    featuredImage: '',
    status: 'published',
    tags: '',
    promotedTool: 'legal_health_check',
    // SEO fields
    metaTitle: '',
    metaDescription: '',
    focusKeyword: ''
  });

  // Get promoted tools grouped by category for the dropdown
  const promotedToolsGrouped = useMemo(() => getToolsGroupedByCategory(), []);

  // Set category from URL parameter
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && ['legal', 'entrepreneurship', 'investments', 'marketing'].includes(categoryParam)) {
      setFormData(prev => ({ ...prev, category: categoryParam }));
    }
  }, [searchParams]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare blog data
      const blogData = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt || formData.content.substring(0, 200) + '...',
        category: formData.category,
        language: formData.language,
        featuredImage: formData.featuredImage,
        status: formData.status,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        promotedTool: formData.promotedTool,
        // SEO fields
        metaTitle: formData.metaTitle || formData.title,
        metaDescription: formData.metaDescription,
        focusKeyword: formData.focusKeyword
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/blogs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(blogData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Грешка при додавање на објавата.');
      }

      const result = await response.json();
      setSuccess('Објавата беше успешно додадена!');
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        category: 'legal',
        language: 'mk',
        featuredImage: '',
        status: 'published',
        tags: '',
        promotedTool: 'legal_health_check',
        metaTitle: '',
        metaDescription: '',
        focusKeyword: ''
      });

      setTimeout(() => {
        navigate('/terminal');
      }, 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'legal', label: 'Правни прашања' },
    { value: 'entrepreneurship', label: 'Претприемништво' },
    { value: 'investments', label: 'Инвестиции' },
    { value: 'marketing', label: 'Маркетинг' }
  ];

  const languages = [
    { value: 'mk', label: 'Македонски' },
    { value: 'en', label: 'English' }
  ];

  const statuses = [
    { value: 'published', label: 'Објавено' },
    { value: 'draft', label: 'Нацрт' }
  ];

  return (
    <ProfileRequired>
      <div>
        <Header isTerminal={isTerminal} />
        
        <div className={styles["dashboard-layout"]}>
          <Sidebar />
          
          <main className={styles["dashboard-main"]}>
            <div className={styles.container}>
              <h1>Додади нова објава</h1>

              {error && <div className={styles.error}>{error}</div>}
              {success && <div className={styles.success}>{success}</div>}

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="title">Наслов*</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className={styles.input}
                    placeholder="Внесете наслов на објавата"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="content">Содржина*</label>
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                    className={styles.textarea}
                    rows={8}
                    placeholder="Внесете содржина на објавата. Користете празни редови (два пати Enter) помеѓу параграфите за да се форматираат правилно."
                  />
                  <small className={styles.helpText}>
                    💡 Совет: Користете празни редови помеѓу параграфите. Секој параграф ќе биде автоматски форматиран со соодветно растојание.
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="excerpt">Excerpt</label>
                  <textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    className={styles.textarea}
                    rows={3}
                    placeholder="Краток опис на објавата (опционално)"
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="category">Категорија*</label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className={styles.select}
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="language">Јазик*</label>
                    <select
                      id="language"
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      required
                      className={styles.select}
                    >
                      {languages.map(lang => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="tags">Tags (comma separated)</label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="featuredImage">Featured Image URL</label>
                  <input
                    type="url"
                    id="featuredImage"
                    name="featuredImage"
                    value={formData.featuredImage}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    {statuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="promotedTool">Промовирај алатка</label>
                  <select
                    id="promotedTool"
                    name="promotedTool"
                    value={formData.promotedTool}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    {Object.entries(promotedToolsGrouped).map(([groupName, tools]) => (
                      tools.length > 0 && (
                        <optgroup key={groupName} label={groupName}>
                          {tools.map(tool => (
                            <option key={tool.id} value={tool.id}>
                              {tool.icon} {tool.name}
                            </option>
                          ))}
                        </optgroup>
                      )
                    ))}
                  </select>
                  <small className={styles.helpText}>
                    Изберете која алатка ќе се прикаже на крајот од статијата
                  </small>
                </div>

                {/* SEO Section */}
                <div className={styles.formGroup}>
                  <h3 style={{ marginBottom: '1rem', color: '#666', fontSize: '1rem' }}>SEO Поставки</h3>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="metaTitle">Meta Title (SEO)</label>
                  <input
                    type="text"
                    id="metaTitle"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="SEO наслов (ако е различен од главниот наслов)"
                    maxLength={60}
                  />
                  <small className={styles.helpText}>
                    Препорачано: до 60 карактери. Ако е празно, ќе се користи главниот наслов.
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="metaDescription">Meta Description (SEO)</label>
                  <textarea
                    id="metaDescription"
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleInputChange}
                    className={styles.textarea}
                    rows={3}
                    placeholder="Краток опис за пребарувачи (Google, Bing...)"
                    maxLength={160}
                  />
                  <small className={styles.helpText}>
                    Препорачано: до 155 карактери. Ако е празно, ќе се генерира автоматски од содржината.
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="focusKeyword">Focus Keyword (SEO)</label>
                  <input
                    type="text"
                    id="focusKeyword"
                    name="focusKeyword"
                    value={formData.focusKeyword}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Главен клучен збор за оптимизација"
                  />
                  <small className={styles.helpText}>
                    Примарниот клучен збор за кој сакате да рангирате во пребарувачите.
                  </small>
                </div>

                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={loading}
                  >
                    {loading ? 'Се додава...' : 'Додади објава'}
                  </button>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => navigate('/terminal')}
                  >
                    Откажи
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
        
        <Footer />
      </div>
    </ProfileRequired>
  );
};

export default AddBlog;