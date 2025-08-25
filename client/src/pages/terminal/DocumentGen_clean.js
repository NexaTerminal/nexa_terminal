// import React, { useState, useEffect } from 'react';
// import styles from '../../styles/terminal/DocumentGen.module.css';
// import Header from '../../components/common/Header';
// import { useAuth } from '../../contexts/AuthContext';
// import Sidebar from "../../components/terminal/Sidebar";
// import ProfileRequired from '../../components/common/ProfileRequired';

// const DocumentGen = () => {
//   const { token } = useAuth();
//   const [documents, setDocuments] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentStep, setCurrentStep] = useState('categories'); // 'categories', 'templates', 'form', 'preview'
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [selectedTemplate, setSelectedTemplate] = useState(null);
//   const [formData, setFormData] = useState({});
//   const [generatedDocument, setGeneratedDocument] = useState(null);
//   const [error, setError] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');

//   // Document categories with their templates - Hardcoded Macedonian
//   const documentCategories = {
//     labourLaw: {
//       title: 'Работно право',
//       icon: '👥',
//       color: 'var(--color-primary)',
//       description: 'Обрасци поврзани со работни односи.',
//       templates: [
//         { id: 'employment_contract', name: 'Договор за вработување', fields: ['employeeName', 'position', 'salary', 'startDate', 'workingHours'] },
//         { id: 'termination_letter', name: 'Изјава за отказ', fields: ['employeeName', 'terminationDate', 'reason', 'finalWorkingDay'] },
//         { id: 'job_description', name: 'Опис на работно место', fields: ['jobTitle', 'department', 'responsibilities', 'requirements'] },
//         { id: 'performance_review', name: 'Оценување на успешност', fields: ['employeeName', 'reviewPeriod', 'goals', 'achievements'] },
//         { id: 'disciplinary_action', name: 'Дисциплинска мерка', fields: ['employeeName', 'incident', 'actionTaken', 'date'] }
//       ]
//     },
//     corporateLaw: {
//       title: 'Корпоративно право',
//       icon: '🏢',
//       color: 'var(--color-success)',
//       description: 'Документи за основање, управување и усогласеност на компании.',
//       templates: [
//         { id: 'board_resolution', name: 'Одлука на одбор', fields: ['resolutionTitle', 'meetingDate', 'boardMembers', 'decision'] },
//         { id: 'shareholders_agreement', name: 'Договор на содружници', fields: ['companyName', 'shareholders', 'shareDistribution', 'governanceRules'] },
//         { id: 'articles_incorporation', name: 'Акт за основање', fields: ['companyName', 'businessPurpose', 'registeredAddress', 'authorizedShares'] },
//         { id: 'corporate_bylaws', name: 'Статут на компанија', fields: ['companyName', 'boardStructure', 'meetingRules', 'votingProcedures'] },
//         { id: 'compliance_policy', name: 'Политика за усогласеност', fields: ['policyTitle', 'applicableArea', 'requirements', 'consequences'] }
//       ]
//     },
//     contracts: {
//       title: 'Договори',
//       icon: '📋',
//       color: 'var(--color-error)',
//       description: 'Различни видови договори за деловни потреби.',
//       templates: [
//         { id: 'nda', name: 'Договор за доверливост (NDA)', fields: ['partyName', 'disclosingParty', 'purpose', 'duration'] },
//         { id: 'service_agreement', name: 'Договор за услуги', fields: ['clientName', 'serviceDescription', 'timeline', 'payment'] },
//         { id: 'vendor_contract', name: 'Договор со добавувач', fields: ['vendorName', 'services', 'deliverables', 'terms'] },
//         { id: 'partnership_agreement', name: 'Договор за партнерство', fields: ['partnerNames', 'businessPurpose', 'responsibilities', 'profitSharing'] },
//         { id: 'licensing_agreement', name: 'Договор за лиценцирање', fields: ['licensor', 'licensee', 'licensedProperty', 'royalties'] }
//       ]
//     },
//     dataProtection: {
//       title: 'Заштита на податоци',
//       icon: '🔒',
//       color: 'var(--color-primary-dark)',
//       description: 'Обрасци за GDPR и заштита на лични податоци.',
//       templates: [
//         { id: 'privacy_policy', name: 'Политика за приватност', fields: ['companyName', 'dataTypes', 'processingPurpose', 'retentionPeriod'] },
//         { id: 'consent_form', name: 'Формулар за согласност', fields: ['dataSubject', 'dataTypes', 'purposes', 'rights'] },
//         { id: 'data_breach_notice', name: 'Известување за повреда на податоци', fields: ['incidentDate', 'affectedData', 'impact', 'measures'] },
//         { id: 'dpia_template', name: 'Образец за DPIA', fields: ['processingActivity', 'risks', 'safeguards', 'conclusion'] },
//         { id: 'data_retention_policy', name: 'Политика за задржување на податоци', fields: ['dataCategories', 'retentionPeriods', 'disposalMethods', 'responsibilities'] }
//       ]
//     },
//     workSafety: {
//       title: 'Безбедност при работа',
//       icon: '⚠️',
//       color: 'var(--color-warning)',
//       description: 'Документи поврзани со безбедност и здравје при работа.',
//       templates: [
//         { id: 'safety_policy', name: 'Политика за безбедност', fields: ['policyScope', 'safetyRules', 'responsibilities', 'procedures'] },
//         { id: 'incident_report', name: 'Извештај за инцидент', fields: ['incidentDate', 'location', 'description', 'witnesses'] },
//         { id: 'risk_assessment', name: 'Проценка на ризик', fields: ['activityDescription', 'hazards', 'riskLevel', 'controlMeasures'] },
//         { id: 'safety_training', name: 'Обука за безбедност', fields: ['employeeName', 'trainingType', 'date', 'trainer'] },
//         { id: 'emergency_procedure', name: 'Процедура за итни случаи', fields: ['emergencyType', 'steps', 'contacts', 'equipment'] }
//       ]
//     },
//     otherTemplates: {
//       title: 'Останати обрасци',
//       icon: '📄',
//       color: 'var(--color-text-secondary)',
//       description: 'Разни корисни обрасци за секојдневна употреба.',
//       templates: [
//         { id: 'meeting_minutes', name: 'Записник од состанок', fields: ['meetingDate', 'attendees', 'agenda', 'decisions'] },
//         { id: 'business_letter', name: 'Деловно писмо', fields: ['recipient', 'subject', 'content', 'sender'] },
//         { id: 'invoice_template', name: 'Образец за фактура', fields: ['clientName', 'services', 'amount', 'dueDate'] },
//         { id: 'memo', name: 'Меморандум', fields: ['recipient', 'subject', 'message', 'urgency'] },
//         { id: 'press_release', name: 'Соопштение за јавност', fields: ['headline', 'content', 'contactInfo', 'releaseDate'] }
//       ]
//     }
//   };

//   useEffect(() => {
//     fetchDocuments();
//   }, [token]);

//   const fetchDocuments = async () => {
//     try {
//       const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/documents`, {
//         headers: {
//           Authorization: `Bearer ${token}`
//         }
//       });
      
//       if (response.ok) {
//         const data = await response.json();
//         setDocuments(data);
//       }
//     } catch (error) {
//       // Silently handle document fetch errors
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({
//       ...formData,
//       [name]: value
//     });
//   };

//   const handleCategorySelect = (categoryKey) => {
//     setSelectedCategory(categoryKey);
//     setCurrentStep('templates');
//   };

//   const handleTemplateSelect = (template) => {
//     setSelectedTemplate(template);
//     setFormData({
//       documentType: template.id,
//       templateName: template.name,
//       category: selectedCategory
//     });
//     setCurrentStep('form');
//   };

//   const handleBackToCategories = () => {
//     setCurrentStep('categories');
//     setSelectedCategory(null);
//     setSelectedTemplate(null);
//     setFormData({});
//   };

//   const handleBackToTemplates = () => {
//     setCurrentStep('templates');
//     setSelectedTemplate(null);
//     setFormData({});
//   };

//   const handleBackToForm = () => {
//     setCurrentStep('form');
//     setGeneratedDocument(null);
//   };

//   const handleAdditionalFieldChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({
//       ...formData,
//       [name]: value
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setGeneratedDocument(null);
    
//     try {
//       // Get CSRF token
//       const csrfResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/csrf-token`, {
//         method: 'GET',
//         credentials: 'include'
//       });

//       if (!csrfResponse.ok) {
//         throw new Error('Failed to get CSRF token');
//       }

//       const { csrfToken } = await csrfResponse.json();

//       const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/documents/generate`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'X-CSRF-Token': csrfToken,
//           Authorization: `Bearer ${token}`
//         },
//         credentials: 'include',
//         body: JSON.stringify(formData)
//       });
      
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Неуспешно генерирање на документ');
//       }
      
//       const data = await response.json();
//       setGeneratedDocument(data.document);
//       setCurrentStep('preview');
//       fetchDocuments();
//     } catch (error) {
//       setError(error.message);
//     }
//   };

//   const handleDeleteDocument = async (id) => {
//     if (window.confirm('Дали сте сигурни дека сакате да го избришете овој документ?')) {
//       try {
//         // Get CSRF token
//         const csrfResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/csrf-token`, {
//           method: 'GET',
//           credentials: 'include'
//         });

//         if (!csrfResponse.ok) {
//           throw new Error('Failed to get CSRF token');
//         }

//         const { csrfToken } = await csrfResponse.json();

//         const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/documents/${id}`, {
//           method: 'DELETE',
//           headers: {
//             'X-CSRF-Token': csrfToken,
//             Authorization: `Bearer ${token}`
//           },
//           credentials: 'include'
//         });
        
//         if (response.ok) {
//           setDocuments(documents.filter(doc => doc._id !== id));
//         }
//       } catch (error) {
//         // Silently handle document deletion errors
//       }
//     }
//   };

//   const formatDate = (dateString) => {
//     const options = { year: 'numeric', month: 'long', day: 'numeric' };
//     return new Date(dateString).toLocaleDateString('mk-MK', options);
//   };

//   const getFieldDisplayName = (fieldName) => {
//     const fieldMap = {
//         employeeName: 'Име на вработен',
//         position: 'Позиција',
//         salary: 'Плата',
//         startDate: 'Датум на почеток',
//         workingHours: 'Работно време',
//         terminationDate: 'Датум на отказ',
//         reason: 'Причина',
//         finalWorkingDay: 'Последен работен ден',
//         jobTitle: 'Назив на работно место',
//         department: 'Оддел',
//         responsibilities: 'Одговорности',
//         requirements: 'Потребни квалификации',
//         reviewPeriod: 'Период на оценување',
//         goals: 'Цели',
//         achievements: 'Постигнувања',
//         incident: 'Инцидент',
//         actionTaken: 'Преземена мерка',
//         date: 'Датум',
//         resolutionTitle: 'Наслов на одлука',
//         meetingDate: 'Датум на состанок',
//         boardMembers: 'Членови на одбор',
//         decision: 'Одлука',
//         companyName: 'Име на компанија',
//         shareholders: 'Содружници',
//         shareDistribution: 'Распределба на удели',
//         governanceRules: 'Правила за управување',
//         businessPurpose: 'Деловна цел',
//         registeredAddress: 'Седиште',
//         authorizedShares: 'Одобрени акции',
//         boardStructure: 'Структура на одбор',
//         meetingRules: 'Правила за состаноци',
//         votingProcedures: 'Процедури за гласање',
//         policyTitle: 'Наслов на политика',
//         applicableArea: 'Применлива област',
//         consequences: 'Последици',
//         partyName: 'Име на страна',
//         disclosingParty: 'Страна која открива',
//         purpose: 'Цел',
//         duration: 'Времетраење',
//         clientName: 'Име на клиент',
//         serviceDescription: 'Опис на услуга',
//         timeline: 'Временска рамка',
//         payment: 'Плаќање',
//         vendorName: 'Име на добавувач',
//         services: 'Услуги',
//         deliverables: 'Испораки',
//         terms: 'Услови',
//         partnerNames: 'Имиња на партнери',
//         profitSharing: 'Распределба на добивка',
//         licensor: 'Давател на лиценца',
//         licensee: 'Корисник на лиценца',
//         licensedProperty: 'Лиценциран имот',
//         royalties: 'Авторски права',
//         dataTypes: 'Видови податоци',
//         processingPurpose: 'Цел на обработка',
//         retentionPeriod: 'Период на задржување',
//         dataSubject: 'Субјект на податоци',
//         purposes: 'Цели',
//         rights: 'Права',
//         incidentDate: 'Датум на инцидент',
//         affectedData: 'Засегнати податоци',
//         impact: 'Влијание',
//         measures: 'Мерки',
//         processingActivity: 'Активност на обработка',
//         risks: 'Ризици',
//         safeguards: 'Заштитни мерки',
//         conclusion: 'Заклучок',
//         dataCategories: 'Категории на податоци',
//         retentionPeriods: 'Периоди на задржување',
//         disposalMethods: 'Методи на отстранување',
//         policyScope: 'Опсег на политика',
//         safetyRules: 'Безбедносни правила',
//         procedures: 'Процедури',
//         location: 'Локација',
//         description: 'Опис',
//         witnesses: 'Сведоци',
//         activityDescription: 'Опис на активност',
//         hazards: 'Опасности',
//         riskLevel: 'Ниво на ризик',
//         controlMeasures: 'Контролни мерки',
//         trainingType: 'Тип на обука',
//         trainer: 'Обучувач',
//         emergencyType: 'Тип на итен случај',
//         steps: 'Чекори',
//         contacts: 'Контакти',
//         equipment: 'Опрема',
//         attendees: 'Присутни',
//         agenda: 'Агенда',
//         recipient: 'Примач',
//         subject: 'Предмет',
//         content: 'Содржина',
//         sender: 'Испраќач',
//         amount: 'Износ',
//         dueDate: 'Краен датум',
//         message: 'Порака',
//         urgency: 'Итност',
//         headline: 'Наслов',
//         contactInfo: 'Информации за контакт',
//         releaseDate: 'Датум на објавување'
//     };
//     return fieldMap[fieldName] || fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
//   };

//   const renderCategories = () => (
//     <div className={styles['categories-container']}>
//       <div className={styles['document-header']}>
//         <h1>Генератор на документи</h1>
//         <p>Изберете категорија за да започнете</p>
//       </div>

//       <div className={styles['search-container']}>
//         <input
//           type="text"
//           placeholder='Пребарај категории...'
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className={styles['search-input']}
//         />
//       </div>

//       <div className={styles['categories-grid']}>
//         {Object.entries(documentCategories)
//           .filter(([key, category]) => 
//             category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//             category.description.toLowerCase().includes(searchTerm.toLowerCase())
//           )
//           .map(([key, category]) => (
//             <div
//               key={key}
//               className={styles['category-card']}
//               onClick={() => handleCategorySelect(key)}
//               style={{ '--category-color': category.color }}
//             >
//               <div className={styles['category-icon']}>{category.icon}</div>
//               <h3 className={styles['category-title']}>{category.title}</h3>
//               <p className={styles['category-description']}>{category.description}</p>
//               <div className={styles['category-templates-count']}>
//                 {category.templates.length} достапни обрасци
//               </div>
//             </div>
//           ))
//         }
//       </div>
      
//       <div className={styles['document-list']}>
//         <h2>Ваши документи</h2>
      
//         {loading ? (
//           <p>Се вчитуваат документи...</p>
//         ) : documents.length === 0 ? (
//           <p>Немате зачувани документи.</p>
//         ) : (
//           documents.map((doc) => (
//             <div key={doc._id} className={styles['document-item']}>
//               <div>
//                 <div className={styles['document-item-title']}>{doc.title}</div>
//                 <div className={styles['document-item-date']}>Креиран: {formatDate(doc.createdAt)}</div>
//               </div>
//               <div className={styles['document-actions']}>
//                 <button 
//                   className={styles['action-button']}
//                   onClick={() => setGeneratedDocument(doc)}
//                 >
//                   Прегледај
//                 </button>
//                 <button 
//                   className={`${styles['action-button']} ${styles.delete}`}
//                   onClick={() => handleDeleteDocument(doc._id)}
//                 >
//                   Избриши
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );

//   const renderTemplates = () => {
//     const category = documentCategories[selectedCategory];
    
//     return (
//       <div className={styles['templates-container']}>
//         <div className={styles['breadcrumb']}>
//           <button onClick={handleBackToCategories} className={styles['breadcrumb-link']}>
//             ← Назад кон категории
//           </button>
//           <span className={styles['breadcrumb-current']}>{category.title}</span>
//         </div>

//         <div className={styles['templates-header']}>
//           <div className={styles['category-info']}>
//             <span className={styles['category-icon-large']}>{category.icon}</span>
//             <div>
//               <h1>{category.title}</h1>
//               <p>{category.description}</p>
//             </div>
//           </div>
//         </div>

//         <div className={styles['templates-grid']}>
//           {category.templates.map((template) => (
//             <div
//               key={template.id}
//               className={styles['template-card']}
//               onClick={() => handleTemplateSelect(template)}
//             >
//               <h3 className={styles['template-title']}>{template.name}</h3>
//               <div className={styles['template-fields']}>
//                 <span className={styles['fields-label']}>Потребни полиња:</span>
//                 <div className={styles['fields-list']}>
//                   {template.fields.slice(0, 3).map((field, index) => (
//                     <span key={index} className={styles['field-tag']}>
//                       {getFieldDisplayName(field)}
//                     </span>
//                   ))}
//                   {template.fields.length > 3 && (
//                     <span className={styles['field-tag-more']}>
//                       +{template.fields.length - 3} повеќе
//                     </span>
//                   )}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   const renderForm = () => {
//     const category = documentCategories[selectedCategory];
    
//     return (
//       <div className={styles['form-container']}>
//         <div className={styles['breadcrumb']}>
//           <button onClick={handleBackToCategories} className={styles['breadcrumb-link']}>
//             Назад кон категории
//           </button>
//           <span className={styles['breadcrumb-separator']}>›</span>
//           <button onClick={handleBackToTemplates} className={styles['breadcrumb-link']}>
//             {category.title}
//           </button>
//           <span className={styles['breadcrumb-separator']}>›</span>
//           <span className={styles['breadcrumb-current']}>{selectedTemplate.name}</span>
//         </div>

//         <div className={styles['form-header']}>
//           <h1>Генерирај: {selectedTemplate.name}</h1>
//           <p>Пополнете ги потребните информации.</p>
//         </div>

//         {error && <div className={styles['error-message']}>{error}</div>}

//         <form onSubmit={handleSubmit} className={styles['document-form']}>
//           {selectedTemplate.fields.map((field) => (
//             <div key={field} className={styles['form-group']}>
//               <label htmlFor={field} className={styles['form-label']}>
//                 {getFieldDisplayName(field)}
//               </label>
//               {field.toLowerCase().includes('date') ? (
//                 <input
//                   type="date"
//                   id={field}
//                   name={field}
//                   className={styles['form-input']}
//                   value={formData[field] || ''}
//                   onChange={handleInputChange}
//                   required
//                 />
//               ) : field.toLowerCase().includes('description') || field.toLowerCase().includes('responsibilities') || field.toLowerCase().includes('content') || field.toLowerCase().includes('reason') || field.toLowerCase().includes('decision') || field.toLowerCase().includes('requirements') || field.toLowerCase().includes('goals') || field.toLowerCase().includes('achievements') || field.toLowerCase().includes('incident') || field.toLowerCase().includes('message') ? (
//                 <textarea
//                   id={field}
//                   name={field}
//                   className={styles['form-textarea']}
//                   value={formData[field] || ''}
//                   onChange={handleInputChange}
//                   rows="4"
//                   required
//                 />
//               ) : (
//                 <input
//                   type="text"
//                   id={field}
//                   name={field}
//                   className={styles['form-input']}
//                   value={formData[field] || ''}
//                   onChange={handleInputChange}
//                   required
//                 />
//               )}
//             </div>
//           ))}

//           <div className={styles['form-actions']}>
//             <button
//               type="button"
//               onClick={handleBackToTemplates}
//               className={styles['button-secondary']}
//             >
//               ← Назад кон обрасци
//             </button>
//             <button type="submit" className={styles['button-primary']}>
//               Генерирај документ →
//             </button>
//           </div>
//         </form>
//       </div>
//     );
//   };

//   const renderPreview = () => (
//     <div className={styles['preview-container']}>
//       <div className={styles['breadcrumb']}>
//         <button onClick={handleBackToCategories} className={styles['breadcrumb-link']}>
//           Назад кон категории
//         </button>
//         <span className={styles['breadcrumb-separator']}>›</span>
//         <button onClick={handleBackToTemplates} className={styles['breadcrumb-link']}>
//           {documentCategories[selectedCategory].title}
//         </button>
//         <span className={styles['breadcrumb-separator']}>›</span>
//         <button onClick={handleBackToForm} className={styles['breadcrumb-link']}>
//           {selectedTemplate.name}
//         </button>
//         <span className={styles['breadcrumb-separator']}>›</span>
//         <span className={styles['breadcrumb-current']}>Преглед</span>
//       </div>

//       <div className={styles['preview-header']}>
//         <h1>Преглед на документ</h1>
//         <p>Прегледајте го генерираниот документ.</p>
//       </div>

//       <div className={styles['document-preview']}>
//         <div className={styles['preview-content']}>
//           {generatedDocument?.content || 'Содржината на документот ќе се појави овде...'}
//         </div>
//       </div>

//       <div className={styles['preview-actions']}>
//         <button
//           onClick={handleBackToForm}
//           className={styles['button-secondary']}
//         >
//           ← Уреди документ
//         </button>
//         <button className={styles['button-primary']}>
//           Преземи PDF
//         </button>
//         <button className={styles['button-primary']}>
//           Зачувај документ
//         </button>
//       </div>
//     </div>
//   );

//   const renderCurrentStep = () => {
//     switch (currentStep) {
//       case 'categories':
//         return renderCategories();
//       case 'templates':
//         return renderTemplates();
//       case 'form':
//         return renderForm();
//       case 'preview':
//         return renderPreview();
//       default:
//         return renderCategories();
//     }
//   };

//   return (
//     <ProfileRequired>
//       <div>
//         <Header isTerminal={true} />
        
//         <div className={styles["dashboard-layout"]}>
//           <Sidebar />

//           <main className={styles["dashboard-main"]}>
//             {renderCurrentStep()}
//           </main>
//         </div>
//       </div>
//     </ProfileRequired>
//   );
// };

// export default DocumentGen;
