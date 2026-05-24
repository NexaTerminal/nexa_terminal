import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/terminal/DocumentGen.module.css';
import Header from '../../components/common/Header';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from "../../components/terminal/Sidebar";
import CompanyInfoPrompt from '../../components/terminal/CompanyInfoPrompt';
import documentCategoriesData from '../../data/documentCategories.json';

const DocumentGen = () => {
  const { currentUser, token } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStep, setCurrentStep] = useState('categories');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [generatedDocument, setGeneratedDocument] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);


  // Convert documentCategoriesData array to object for backward compatibility
  const documentCategories = documentCategoriesData.reduce((acc, category) => {
    acc[category.id] = category;
    return acc;
  }, {});

  // Get all documents across all categories for search (handles subcategories)
  const getAllDocuments = () => {
    const allDocuments = [];
    documentCategoriesData.forEach(category => {
      // Handle categories with subcategories
      if (category.subcategories) {
        category.subcategories.forEach(subcategory => {
          subcategory.templates.forEach(template => {
            allDocuments.push({
              ...template,
              categoryId: category.id,
              categoryTitle: category.title,
              categoryIcon: category.icon,
              categoryColor: category.color,
              subcategoryId: subcategory.id,
              subcategoryTitle: subcategory.title,
              subcategoryIcon: subcategory.icon,
              subcategoryColor: subcategory.color
            });
          });
        });
      } else if (category.templates) {
        // Handle categories without subcategories (flat templates)
        category.templates.forEach(template => {
          allDocuments.push({
            ...template,
            categoryId: category.id,
            categoryTitle: category.title,
            categoryIcon: category.icon,
            categoryColor: category.color
          });
        });
      }
    });
    return allDocuments;
  };

  // Filter documents globally by search term
  const getFilteredDocuments = () => {
    if (!searchTerm) return [];

    const allDocuments = getAllDocuments();
    return allDocuments.filter(document =>
      document.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (document.description && document.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      document.categoryTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  useEffect(() => {
    fetchDocuments();
  }, [token]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/documents`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      // Silently handle document fetch errors
    } finally {
      setLoading(false);
    }
  };

  const selectCategory = (categoryKey) => {
    setSelectedCategory(categoryKey);
    const category = documentCategories[categoryKey];
    // If category has subcategories, show them first
    if (category && category.subcategories) {
      setCurrentStep('subcategories');
    } else {
      setCurrentStep('templates');
    }
  };

  const selectSubcategory = (subcategoryId) => {
    setSelectedSubcategory(subcategoryId);
    setCurrentStep('templates');
  };

  const selectTemplate = (template) => {
    // If template has a specific route, navigate to it
    if (template.route) {
      navigate(template.route);
      return;
    }
    
    // Use the form system for both old and new formats
    setSelectedTemplate(template);
    setCurrentStep('form');
    
    // Initialize form data with empty values for each field
    const initialFormData = {};
    if (template.fields && template.fields.length > 0) {
      template.fields.forEach(field => {
        // Handle both old format (string) and new format (object with name property)
        const fieldName = typeof field === 'string' ? field : field.name;
        initialFormData[fieldName] = '';
      });
    }
    setFormData(initialFormData);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateDocument = async () => {
    const template = selectedTemplate;
    
    // Check if this template uses API-based generation
    if (template.apiEndpoint) {
      try {
        setLoading(true);
        
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}${template.apiEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: currentUser._id,
            formData: formData
          })
        });

        if (response.ok) {
          // Handle file download
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          
          // Get filename from response headers
          const contentDisposition = response.headers.get('Content-Disposition');
          let filename = `${template.name}.docx`;
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename\*?=['"]?([^'";]+)['"]?/);
            if (filenameMatch) {
              filename = decodeURIComponent(filenameMatch[1]);
            }
          }
          
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          // Reset the process after successful download
          resetProcess();
          return;
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Настана грешка при генерирање на документот');
        }
      } catch (error) {
        console.error('Error generating document:', error);
        alert(`Грешка при генерирање: ${error.message}`);
        return;
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback to simple text generation for templates without API endpoints
      const category = documentCategories[selectedCategory];
      
      const fieldLabels = {
        employeeName: 'Име на вработен',
        position: 'Позиција',
        salary: 'Плата',
        startDate: 'Датум на започнување',
        workingHours: 'Работни часови',
        terminationDate: 'Датум на отказ',
        reason: 'Причина',
        finalWorkingDay: 'Последен работен ден',
        jobTitle: 'Наслов на работа',
        department: 'Оддел',
        responsibilities: 'Одговорности',
        requirements: 'Барања',
        reviewPeriod: 'Период на ревизија',
        goals: 'Цели',
        achievements: 'Достигнувања',
        incident: 'Инцидент',
        actionTaken: 'Преземена акција',
        date: 'Датум',
        partyName: 'Име на страна',
        disclosingParty: 'Страна што открива',
        purpose: 'Цел',
        duration: 'Времетраење',
        clientName: 'Име на клиент',
        serviceDescription: 'Опис на услуга',
        timeline: 'Временска рамка',
        payment: 'Плаќање'
      };
      
      let documentContent = `${template.name}\n\n`;
      
      // Add form data to document
      if (template.fields && template.fields.length > 0) {
        template.fields.forEach(field => {
          // Handle both old format (string) and new format (object)
          const fieldName = typeof field === 'string' ? field : field.name;
          const fieldLabel = typeof field === 'string' ? (fieldLabels[field] || field) : (field.label || field.name);
          
          documentContent += `${fieldLabel}: ${formData[fieldName]}\n`;
        });
      } else {
        documentContent += 'Нема дополнителни податоци за внесување.\n';
      }
      
      setGeneratedDocument(documentContent);
      setCurrentStep('preview');
    }
  };

  const resetProcess = () => {
    setCurrentStep('categories');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedTemplate(null);
    setFormData({});
    setGeneratedDocument(null);
    setSearchTerm(''); // Reset search term
  };

  const renderCategories = () => {
    const filteredDocuments = getFilteredDocuments();
    const showSearchResults = searchTerm && filteredDocuments.length > 0;
    const showCategories = !searchTerm;

    return (
      <div className={styles['categories-container']}>
        <div className={styles['document-header']}>
          <h1>Автоматизирани документи</h1>
          <p>{showSearchResults ? 'Резултати од пребарување' : 'Во нашата база не се задржуваат било какви информации или податоци за документите кои ќе ги генерирате'}</p>
        </div>
        <div className={styles['search-bar-container']}>
          <input
            type="text"
            placeholder="Пребарај документи..."
            className={styles['search-input']}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {showSearchResults && (
          <div className={styles['search-results']}>
            <div className={styles['search-results-header']}>
              <h2>Најдени {filteredDocuments.length} документи</h2>
            </div>
            <div className={styles['templates-grid']}>
              {filteredDocuments.map((document) => (
                <div
                  key={`${document.categoryId}-${document.id}`}
                  className={`${styles['template-card']} ${document.comingSoon ? styles['coming-soon'] : ''}`}
                  onClick={() => !document.comingSoon && selectTemplate(document)}
                  style={{
                    borderLeft: `4px solid ${document.categoryColor}`,
                    cursor: document.comingSoon ? 'not-allowed' : 'pointer'
                  }}
                >
                  {document.comingSoon && (
                    <div className={styles['coming-soon-badge']}>Наскоро</div>
                  )}
                  <div className={styles['template-header']}>
                    <div className={styles['template-icon']}>
                      {document.icon || '📄'}
                    </div>
                    <div className={styles['category-badge']} style={{ backgroundColor: document.categoryColor }}>
                      {document.categoryIcon} {document.categoryTitle}
                    </div>
                  </div>
                  <h3 className={styles['template-name']}>{document.name}</h3>
                  {document.description && (
                    <p className={styles['template-description']}>{document.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {showCategories && (
          <div className={styles['categories-grid']}>
            {documentCategoriesData.map((category) => {
              // Calculate template count - handle both subcategories and direct templates
              const templateCount = category.subcategories
                ? category.subcategories.reduce((sum, sub) => sum + sub.templates.length, 0)
                : (category.templates ? category.templates.length : 0);

              return (
                <div
                  key={category.id}
                  className={styles['category-card']}
                  onClick={() => selectCategory(category.id)}
                  style={{ borderColor: category.color }}
                >
                  <div className={styles['category-icon']} style={{ color: category.color }}>
                    {category.icon}
                  </div>
                  <h3 className={styles['category-title']}>{category.title}</h3>
                  <p className={styles['category-description']}>{category.description}</p>
                  <div className={styles['template-count']}>
                    {templateCount} шаблони
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {searchTerm && filteredDocuments.length === 0 && (
          <div className={styles['no-results']}>
            <h3>Нема резултати</h3>
            <p>Не се најдени документи што одговараат на вашето пребарување "{searchTerm}"</p>
          </div>
        )}
      </div>
    );
  };

  const renderSubcategories = () => {
    const category = documentCategories[selectedCategory];
    if (!category || !category.subcategories) return null;

    // Get all templates from all subcategories for search
    const allCategoryTemplates = category.subcategories.flatMap(sub =>
      sub.templates.map(template => ({
        ...template,
        subcategoryId: sub.id,
        subcategoryTitle: sub.title,
        subcategoryIcon: sub.icon,
        subcategoryColor: sub.color
      }))
    );

    // Filter templates by search term
    const filteredTemplates = searchTerm
      ? allCategoryTemplates.filter(template =>
          template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : [];

    const showSearchResults = searchTerm && filteredTemplates.length > 0;

    return (
      <div className={styles['subcategories-container']}>
        <div className={styles['document-header']}>
          <button
            className={styles['back-button']}
            onClick={() => { setCurrentStep('categories'); setSelectedCategory(null); setSearchTerm(''); }}
          >
            ← Назад
          </button>
          <h1>{category.title}</h1>
          <p>{showSearchResults ? 'Резултати од пребарување' : 'Пребарајте документ или изберете поткатегорија'}</p>
        </div>

        <div className={styles['search-bar-container']}>
          <input
            type="text"
            placeholder="Пребарај документи во работни односи..."
            className={styles['search-input']}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {showSearchResults && (
          <div className={styles['templates-grid']}>
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className={`${styles['template-card']} ${template.comingSoon ? styles['coming-soon'] : ''}`}
                onClick={() => !template.comingSoon && selectTemplate(template)}
                style={{
                  borderLeft: `4px solid ${template.subcategoryColor}`,
                  cursor: template.comingSoon ? 'not-allowed' : 'pointer'
                }}
              >
                {template.comingSoon && (
                  <div className={styles['coming-soon-badge']}>Наскоро</div>
                )}
                <div className={styles['template-header']}>
                  <div className={styles['template-icon']}>
                    {template.icon || '📄'}
                  </div>
                  <div className={styles['category-badge']} style={{ backgroundColor: template.subcategoryColor }}>
                    {template.subcategoryIcon} {template.subcategoryTitle}
                  </div>
                </div>
                <h3 className={styles['template-name']}>{template.name}</h3>
                {template.description && (
                  <p className={styles['template-description']}>{template.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {searchTerm && filteredTemplates.length === 0 && (
          <div className={styles['no-results']}>
            <h3>Нема резултати</h3>
            <p>Не се најдени документи што одговараат на "{searchTerm}"</p>
          </div>
        )}

        {!searchTerm && (
          <div className={styles['subcategories-grid']}>
            {category.subcategories.map((subcategory) => (
              <div
                key={subcategory.id}
                className={styles['subcategory-card']}
                onClick={() => selectSubcategory(subcategory.id)}
                style={{ borderColor: subcategory.color }}
              >
                <div className={styles['subcategory-header']}>
                  <div className={styles['subcategory-icon']} style={{ color: subcategory.color }}>
                    {subcategory.icon}
                  </div>
                  <div className={styles['template-count']}>
                    {subcategory.templates.length} документи
                  </div>
                </div>
                <h3 className={styles['subcategory-title']}>{subcategory.title}</h3>
                <p className={styles['subcategory-description']}>{subcategory.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTemplates = () => {
    const category = documentCategories[selectedCategory];
    if (!category) return null; // Should not happen if flow is correct

    // Get templates - either from subcategory or directly from category
    let templates = [];
    let subcategory = null;
    let backStep = 'categories';
    let backAction = () => { setCurrentStep('categories'); setSelectedCategory(null); setSearchTerm(''); };

    if (category.subcategories && selectedSubcategory) {
      // Category has subcategories and one is selected
      subcategory = category.subcategories.find(s => s.id === selectedSubcategory);
      templates = subcategory ? subcategory.templates : [];
      backStep = 'subcategories';
      backAction = () => { setCurrentStep('subcategories'); setSelectedSubcategory(null); setSearchTerm(''); };
    } else if (category.templates) {
      // Category has direct templates (no subcategories)
      templates = category.templates;
    }

    const fieldLabels = {
      employeeName: 'Име на вработен',
      position: 'Позиција',
      salary: 'Плата',
      startDate: 'Датум на започнување',
      workingHours: 'Работни часови',
      terminationDate: 'Датум на отказ',
      reason: 'Причина',
      finalWorkingDay: 'Последен работен ден',
      jobTitle: 'Наслов на работа',
      department: 'Оддел',
      responsibilities: 'Одговорности',
      requirements: 'Барања',
      reviewPeriod: 'Период на ревизија',
      goals: 'Цели',
      achievements: 'Достигнувања',
      incident: 'Инцидент',
      actionTaken: 'Преземена акција',
      date: 'Датум',
      partyName: 'Име на страна',
      disclosingParty: 'Страна што открива',
      purpose: 'Цел',
      duration: 'Времетраење',
      clientName: 'Име на клиент',
      serviceDescription: 'Опис на услуга',
      timeline: 'Временска рамка',
      payment: 'Плаќање'
    };

    const filteredTemplates = templates.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Determine title to show
    const displayTitle = subcategory ? subcategory.title : category.title;

    return (
      <div className={styles['templates-container']}>
        <div className={styles['document-header']}>
          <button
            className={styles['back-button']}
            onClick={backAction}
          >
            ← Назад
          </button>
          <h1>{displayTitle}</h1>
          <p>Не задржуваме било какви податоци кои ќе ги користите</p>
        </div>
        <div className={styles['search-bar-container']}>
          <input 
            type="text"
            placeholder="Пребарај шаблони..."
            className={styles['search-input']}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className={styles['templates-grid']}>
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={`${styles['template-card']} ${template.comingSoon ? styles['coming-soon'] : ''}`}
              onClick={() => !template.comingSoon && selectTemplate(template)}
              style={{ cursor: template.comingSoon ? 'not-allowed' : 'pointer' }}
            >
              {template.comingSoon && (
                <div className={styles['coming-soon-badge']}>Наскоро</div>
              )}
              <div className={styles['template-icon']}>
                {template.icon || '📄'}
              </div>
              <h3 className={styles['template-name']}>{template.name}</h3>
              {template.description && (
                <p className={styles['template-description']}>{template.description}</p>
              )}
              {template.fields && template.fields.length > 0 && !template.comingSoon && (
                <div className={styles['template-fields']}>
                  <strong>Потребни полиња:</strong>
                  <ul>
                    {template.fields.slice(0, 4).map((field, index) => {
                      // Handle both old format (string) and new format (object)
                      const fieldName = typeof field === 'string' ? field : field.name;
                      const fieldLabel = typeof field === 'string' ? (fieldLabels[field] || field) : (field.label || field.name);

                      return (
                        <li key={index}>{fieldLabel}</li>
                      );
                    })}
                    {template.fields.length > 4 && (
                      <li>+{template.fields.length - 4} повеќе</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderForm = () => {
    const fieldLabels = {
      employeeName: 'Име на вработен',
      position: 'Позиција',
      salary: 'Плата',
      startDate: 'Датум на започнување',
      workingHours: 'Работни часови',
      terminationDate: 'Датум на отказ',
      reason: 'Причина',
      finalWorkingDay: 'Последен работен ден',
      jobTitle: 'Наслов на работа',
      department: 'Оддел',
      responsibilities: 'Одговорности',
      requirements: 'Барања',
      reviewPeriod: 'Период на ревизија',
      goals: 'Цели',
      achievements: 'Достигнувања',
      incident: 'Инцидент',
      actionTaken: 'Преземена акција',
      date: 'Датум',
      partyName: 'Име на страна',
      disclosingParty: 'Страна што открива',
      purpose: 'Цел',
      duration: 'Времетраење',
      clientName: 'Име на клиент',
      serviceDescription: 'Опис на услуга',
      timeline: 'Временска рамка',
      payment: 'Плаќање'
    };

    return (
      <div className={styles['form-container']}>
        <div className={styles['document-header']}>
          <button 
            className={styles['back-button']} 
            onClick={() => setCurrentStep('templates')}
          >
            ← Назад
          </button>
          <h1>{selectedTemplate.name}</h1>
          <p>Пополнете ги информациите за вашиот документ</p>
        </div>
        
        <form className={styles['document-form']} onSubmit={(e) => { e.preventDefault(); generateDocument(); }}>
          {selectedTemplate.fields && selectedTemplate.fields.length > 0 ? (
            selectedTemplate.fields.map(field => {
              // Handle both old format (string) and new format (object)
              const fieldName = typeof field === 'string' ? field : field.name;
              const fieldLabel = typeof field === 'string' ? (fieldLabels[field] || field) : (field.label || field.name);
              const fieldType = typeof field === 'string' ? 'text' : (field.type || 'text');
              const fieldPlaceholder = typeof field === 'string' ? `Внесете ${fieldLabel?.toLowerCase() || fieldName}` : (field.placeholder || `Внесете ${fieldLabel?.toLowerCase() || fieldName}`);
              const isRequired = typeof field === 'string' ? true : (field.required !== false);

              return (
                <div key={fieldName} className={styles['form-group']}>
                  <label className={styles['form-label']}>
                    {fieldLabel}:
                    {isRequired && <span className={styles['required']}>*</span>}
                  </label>
                  {fieldType === 'textarea' ? (
                    <textarea
                      className={styles['form-textarea']}
                      value={formData[fieldName] || ''}
                      onChange={(e) => handleFormChange(fieldName, e.target.value)}
                      placeholder={fieldPlaceholder}
                      rows={4}
                      required={isRequired}
                    />
                  ) : fieldType === 'date' ? (
                    <input
                      type="date"
                      className={styles['form-input']}
                      value={formData[fieldName] || ''}
                      onChange={(e) => handleFormChange(fieldName, e.target.value)}
                      required={isRequired}
                    />
                  ) : fieldType === 'number' ? (
                    <input
                      type="number"
                      className={styles['form-input']}
                      value={formData[fieldName] || ''}
                      onChange={(e) => handleFormChange(fieldName, e.target.value)}
                      placeholder={fieldPlaceholder}
                      required={isRequired}
                    />
                  ) : (
                    <input
                      type="text"
                      className={styles['form-input']}
                      value={formData[fieldName] || ''}
                      onChange={(e) => handleFormChange(fieldName, e.target.value)}
                      placeholder={fieldPlaceholder}
                      required={isRequired}
                    />
                  )}
                </div>
              );
            })
          ) : (
            <div className={styles['no-fields-message']}>
              <p>Овој шаблон нема дополнителни полиња за пополнување.</p>
            </div>
          )}
          
          <div className={styles['form-actions']}>
            <button type="submit" className={styles['generate-button']}>
              Генерирај документ
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderPreview = () => (
    <div className={styles['preview-container']}>
      <div className={styles['document-header']}>
        <button 
          className={styles['back-button']} 
          onClick={() => setCurrentStep('form')}
        >
          ← Уреди
        </button>
        <h1>Преглед на документ</h1>
        <p>Прегледајте го вашиот генериран документ</p>
      </div>
      
      <div className={styles['document-preview']}>
        <pre className={styles['document-content']}>
          {generatedDocument}
        </pre>
      </div>
      
      <div className={styles['preview-actions']}>
        <button 
          className={styles['download-button']}
          onClick={() => {
            const element = document.createElement('a');
            const file = new Blob([generatedDocument], { type: 'text/plain' });
            element.href = URL.createObjectURL(file);
            element.download = `${selectedTemplate.name}.txt`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
          }}
        >
          Преземи документ
        </button>
        <button 
          className={styles['new-document-button']}
          onClick={resetProcess}
        >
          Нов документ
        </button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'categories':
        return renderCategories();
      case 'subcategories':
        return renderSubcategories();
      case 'templates':
        return renderTemplates();
      case 'form':
        return renderForm();
      case 'preview':
        return renderPreview();
      default:
        return renderCategories();
    }
  };

  return (
    <div>
      <Header isTerminal={true} />

      <div className={styles["dashboard-layout"]}>
        <Sidebar />

        <main className={styles["dashboard-main"]}>
          <CompanyInfoPrompt />
          {renderCurrentStep()}
        </main>
      </div>
    </div>
  );
};

export default DocumentGen;