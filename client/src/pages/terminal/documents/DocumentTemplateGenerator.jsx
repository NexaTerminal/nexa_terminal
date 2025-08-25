import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/terminal/Sidebar';
import ProfileReminderBanner from '../../../components/terminal/ProfileReminderBanner';
import DocumentStepForm from '../../../components/terminal/documents/DocumentStepForm';
import documentCategoriesData from '../../../data/documentCategories.json';
import styles from '../../../styles/terminal/documents/DocumentGeneration.module.css';

const DocumentTemplateGenerator = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { categoryId, templateId } = useParams();
  
  const [template, setTemplate] = useState(null);
  const [category, setCategory] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Find the specified category and template
    const foundCategory = documentCategoriesData.find(cat => cat.id === categoryId);
    if (foundCategory) {
      setCategory(foundCategory);
      const foundTemplate = foundCategory.templates.find(temp => temp.id === templateId);
      if (foundTemplate) {
        setTemplate(foundTemplate);
      } else {
        // Template not found in category
        setNotification({
          type: 'error',
          message: 'Избраниот шаблон не постои или е отстранет.'
        });
      }
    } else {
      // Category not found
      setNotification({
        type: 'error',
        message: 'Избраната категорија не постои или е отстранета.'
      });
    }
  }, [categoryId, templateId]);

  const handleSuccess = (message) => {
    setNotification({
      type: 'success',
      message
    });
    // Optionally redirect after success
    // setTimeout(() => navigate('/terminal/documents'), 3000);
  };

  const handleError = (message) => {
    setNotification({
      type: 'error',
      message
    });
  };

  const clearNotification = () => {
    setNotification(null);
  };

  return (
    <div className={styles.pageContainer}>
      <Header />
      <div className={styles.dashboardLayout}>
        <Sidebar />
        <main className={styles.dashboardMain}>
          {!currentUser?.profileComplete && <ProfileReminderBanner />}
          
          <div className={styles.documentContainer}>
            {notification && (
              <div className={notification.type === 'error' ? styles.errorNotification : styles.successNotification}>
                <p>{notification.message}</p>
                <button onClick={clearNotification} className={styles.closeButton}>×</button>
              </div>
            )}

            <div className={styles.documentHeader}>
              <h1>{template?.name || 'Шаблон за документ'}</h1>
              <p>{template?.description || 'Креирање на документ'}</p>
            </div>

            {template && category ? (
              <DocumentStepForm 
                template={template} 
                categoryColor={category.color}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            ) : !notification ? (
              <div className={styles.loadingContainer}>
                <p>Вчитување на шаблонот...</p>
              </div>
            ) : (
              <div className={styles.errorContainer}>
                <button 
                  onClick={() => navigate('/terminal/documents')}
                  className={styles.backButton}
                >
                  Назад кон сите документи
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocumentTemplateGenerator;
