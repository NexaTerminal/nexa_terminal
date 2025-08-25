import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import styles from '../../../styles/terminal/admin/AddBlog.module.css';
import Header from '../../../components/common/Header';
import Footer from '../../../components/common/Footer';
import Sidebar from '../../../components/terminal/Sidebar';
import ProfileRequired from '../../../components/common/ProfileRequired';

const AddBlog = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const isTerminal = true;
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'general',
    language: 'mk',
    featuredImage: '',
    status: 'published',
    tags: ''
  });
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
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
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
        throw new Error(errorText || 'Грешка при додавање на блог постот.');
      }

      const result = await response.json();
      setSuccess('Blog created successfully!');
      setFormData({
        title: '',
        content: '',
        category: '',
        tags: '',
        language: 'mk'
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
    { value: 'general', label: 'Општо' },
    { value: 'business', label: 'Бизнис' },
    { value: 'technology', label: 'Технологија' },
    { value: 'economy', label: 'Економија' },
    { value: 'legal', label: 'Правни прашања' },
    { value: 'finance', label: 'Финансии' }
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
              <h1>Додади нов блог пост</h1>

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
                    placeholder="Внесете наслов на блог постот"
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
                    placeholder="Внесете содржина на блог постот"
                  />
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
                    placeholder="Краток опис на блог постот (опционално)"
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

                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={loading}
                  >
                    {loading ? 'Се додава...' : 'Додади блог пост'}
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