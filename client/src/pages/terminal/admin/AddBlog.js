import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useAuth } from '../../../contexts/AuthContext';
import styles from '../../../styles/terminal/admin/AddBlog.module.css';
import Header from '../../../components/common/Header';
import Footer from '../../../components/common/Footer';
import Sidebar from '../../../components/terminal/Sidebar';
import ProfileRequired from '../../../components/common/ProfileRequired';
import { getToolsGroupedByCategory } from '../../../config/promotedTools';

// Available blog images
const BLOG_IMAGES = [
  'marketing-1.jpg',
  'marketing-2.jpg',
  'marketing-3.jpg',
  'marketing-4.jpg',
  'marketing-5.jpg',
  'marketing-6.jpg',
  'marketing-7.jpg',
  'marketing-8.jpg',
  'marketing-9.jpg',
  'marketing-10.jpg',
  'business.jpg',
  'business1.jpg',
  'business2.jpg',
  'business3.jpg',
  'business4.jpg',
  'business5.jpg',
  'business6.jpg',
  'business7.jpg',
  'business8.jpg',
  'business, marketing, managment1.jpg',
  'business, marketing, managment2.jpg',
  'business, marketing, managment3.jpg',
  'business, marketing, managment4.jpg',
  'business, marketing, managment5.jpg',
  'business, marketing, managment6.jpg',
  'business, marketing, managment7.jpg',
  'business, marketing, managment8.jpg',
  'business, marketing, managment9.jpg',
];

const AddBlog = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isTerminal = true;
  const [formData, setFormData] = useState({
    title: '',
    content: '',
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

  const quillModules = useMemo(() => ({
    toolbar: [
      [{ header: [2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ]
  }), []);

  const quillFormats = [
    'header', 'bold', 'italic', 'underline',
    'list', 'blockquote', 'code-block',
    'link', 'image'
  ];

  const handleContentChange = (value) => {
    setFormData(prev => ({ ...prev, content: value }));
  };

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
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Handle image selection from picker
  const handleImageSelect = (imageName) => {
    setFormData(prev => ({ ...prev, featuredImage: `/images/blog/${imageName}` }));
    setShowImagePicker(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate content (ReactQuill doesn't support required attribute)
    const strippedContent = formData.content.replace(/<[^>]*>/g, '').trim();
    if (!strippedContent) {
      setError('Содржината е задолжителна.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Decode HTML entities (e.g. &nbsp; &amp;) from stripped content
      const textarea = document.createElement('textarea');
      textarea.innerHTML = strippedContent;
      const decodedContent = textarea.value;

      // Prepare blog data
      const excerptFallback = decodedContent.substring(0, 200) + (decodedContent.length > 200 ? '...' : '');
      const blogData = {
        title: formData.title,
        content: formData.content,
        excerpt: excerptFallback,
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
    { value: 'legal', label: 'Усогласеност' },
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
                  <div className={styles.editorWrapper}>
                    <ReactQuill
                      theme="snow"
                      value={formData.content}
                      onChange={handleContentChange}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="Внесете содржина на објавата..."
                    />
                  </div>
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
                  <label htmlFor="featuredImage">Featured Image</label>
                  <div className={styles.imagePickerContainer}>
                    <input
                      type="text"
                      id="featuredImage"
                      name="featuredImage"
                      value={formData.featuredImage}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="/images/blog/marketing-1.jpg"
                    />
                    <button
                      type="button"
                      className={styles.imagePickerButton}
                      onClick={() => setShowImagePicker(!showImagePicker)}
                    >
                      {showImagePicker ? 'Затвори' : 'Избери слика'}
                    </button>
                  </div>
                  {formData.featuredImage && (
                    <div className={styles.imagePreview}>
                      <img src={formData.featuredImage} alt="Preview" />
                    </div>
                  )}
                  {showImagePicker && (
                    <div className={styles.imagePickerGrid}>
                      {BLOG_IMAGES.map((img) => (
                        <div
                          key={img}
                          className={`${styles.imagePickerItem} ${formData.featuredImage === `/images/blog/${img}` ? styles.imagePickerItemSelected : ''}`}
                          onClick={() => handleImageSelect(img)}
                        >
                          <img src={`/images/blog/${img}`} alt={img} />
                          <span className={styles.imagePickerName}>{img}</span>
                        </div>
                      ))}
                    </div>
                  )}
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