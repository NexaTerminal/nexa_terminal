import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/terminal/DocumentGen.module.css';
import Header from '../../components/common/Header';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from "../../components/terminal/Sidebar";
import ProfileReminderBanner from '../../components/terminal/ProfileReminderBanner';
import documentCategoriesData from '../../data/documentCategories.json';

const DocumentGen = () => {
  const { currentUser, token } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStep, setCurrentStep] = useState('categories');
  const [selectedCategory, setSelectedCategory] = useState(null);
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

  // Filter categories and templates based on search term
  const filteredCategories = searchTerm 
    ? documentCategoriesData.map(category => ({
        ...category,
        templates: category.templates.filter(template => 
          template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(category => category.templates.length > 0)
    : documentCategoriesData;

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
    setSelectedTemplate(null);
    setFormData({});
    setGeneratedDocument(null);
    setSearchTerm(''); // Reset search term
  };

  const renderCategories = () => {
    const filteredCategories = documentCategoriesData.filter(category => 
      category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className={styles['categories-container']}>
        <div className={styles['document-header']}>
          <h1>Генератор на документи</h1>
          <p>Изберете категорија за да започнете</p>
        </div>
        <div className={styles['search-bar-container']}>
          <input 
            type="text"
            placeholder="Пребарај категории..."
            className={styles['search-input']}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className={styles['categories-grid']}>
          {filteredCategories.map((category) => (
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
                {category.templates.length} шаблони
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTemplates = () => {
    const category = documentCategories[selectedCategory];
    if (!category) return null; // Should not happen if flow is correct

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

    const filteredTemplates = category.templates.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return (
      <div className={styles['templates-container']}>
        <div className={styles['document-header']}>
          <button 
            className={styles['back-button']} 
            onClick={() => { setCurrentStep('categories'); setSearchTerm(''); /* Clear search on back */ }}
          >
            ← Назад
          </button>
          <h1>{category.title}</h1>
          <p>Изберете шаблон за документ</p>
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
              className={styles['template-card']}
              onClick={() => selectTemplate(template)}
            >
              <h3 className={styles['template-name']}>{template.name}</h3>
              {template.description && (
                <p className={styles['template-description']}>{template.description}</p>
              )}
              {template.fields && template.fields.length > 0 ? (
                <div className={styles['template-fields']}>
                  <strong>Потребни полиња:</strong>
                  <ul>
                    {template.fields.map((field, index) => {
                      // Handle both old format (string) and new format (object)
                      const fieldName = typeof field === 'string' ? field : field.name;
                      const fieldLabel = typeof field === 'string' ? (fieldLabels[field] || field) : (field.label || field.name);
                      
                      return (
                        <li key={index}>{fieldLabel}</li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <div className={styles['template-info']}>
                  <p>Ова е специјализиран шаблон со сопствен формулар.</p>
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
          <ProfileReminderBanner />
          {renderCurrentStep()}
        </main>
      </div>
    </div>
  );
};

export default DocumentGen;