// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import CategoryList from '../components/DocumentGenerator/CategoryList';
// import GenerateModal from '../components/DocumentGenerator/GenerateModal';
// import documentCategoriesData from '../data/documentCategories.json';
// import styles from '../styles/pages/DocumentGeneratorPage.module.css';
// import { useTranslation } from 'react-i18next';

// const DocumentGeneratorPage = () => {
//   const { t, i18n } = useTranslation();
//   const navigate = useNavigate();
//   const [categories, setCategories] = useState([]);
//   const [selectedTemplate, setSelectedTemplate] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');

//   useEffect(() => {
//     // Simulate fetching or directly use imported data
//     // Translate category and template names/descriptions if i18n keys are used in JSON
//     const translateData = (data) => {
//       return data.map(category => ({
//         ...category,
//         name: t(category.name), // Assuming category.name is a key like 'category.employment.name'
//         templates: category.templates.map(template => ({
//           ...template,
//           name: t(template.name), // Assuming template.name is a key like 'template.employmentContract.name'
//           description: t(template.description) // Assuming template.description is a key
//         }))
//       }));
//     };

//     // If your documentCategories.json contains i18n keys, use translateData
//     // For now, assuming direct strings as per previous setup
//     setCategories(documentCategoriesData);
//   }, [t, i18n.language]); // Re-process if language changes

//   const handleSelectTemplate = (template, categoryColor) => {
//     if (template.route) {
//       navigate(template.route);
//     } else if (template.apiEndpoint && template.fields) {
//       setSelectedTemplate({ ...template, categoryColor });
//       setIsModalOpen(true);
//     } else {
//       console.warn('Template configuration is incomplete:', template);
//       // Optionally, show an error to the user
//     }
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     setSelectedTemplate(null);
//   };

//   const filteredCategories = categories.map(category => ({
//     ...category,
//     templates: category.templates.filter(template => 
//       template.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
//       (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
//     )
//   })).filter(category => category.templates.length > 0);

//   return (
//     <div className={styles.pageContainer}>
//       <header className={styles.pageHeader}>
//         <h1>{t('documentGeneratorPage.title', 'Генератор на Правни Документи')}</h1>
//         <p className={styles.pageDescription}>
//           {t('documentGeneratorPage.description', 'Изберете категорија и документ за да започнете со генерирање.')}
//         </p>
//         <div className={styles.searchContainer}>
//           <input 
//             type="text"
//             placeholder={t('documentGeneratorPage.searchPlaceholder', 'Пребарај документи...')}
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className={styles.searchInput}
//           />
//         </div>
//       </header>
      
//       <CategoryList 
//         categories={filteredCategories} 
//         onSelectTemplate={handleSelectTemplate} 
//       />

//       {selectedTemplate && (
//         <GenerateModal
//           isOpen={isModalOpen}
//           onClose={closeModal}
//           template={selectedTemplate}
//           categoryColor={selectedTemplate.categoryColor}
//         />
//       )}
//     </div>
//   );
// };

// export default DocumentGeneratorPage;
