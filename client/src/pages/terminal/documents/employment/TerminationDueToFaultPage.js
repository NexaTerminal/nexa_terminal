import React from 'react';
import BaseDocumentPage from '../../../../components/documents/BaseDocumentPage';
import FormField from '../../../../components/forms/FormField';
import terminationDueToFaultConfig, { ALL_ARTICLE_CASES, ARTICLE_81_CASES, ARTICLE_82_CASES } from '../../../../config/documents/terminationDueToFault';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Termination Due to Fault by Employee Page
 * Simplified legal document generation based on Articles 81 and 82 of Macedonia Labor Law
 * Only requires article selection and optional factual situation description
 * All inputs are optional - allows generating empty document for manual completion
 */

const TerminationDueToFaultPage = () => {
  // Simplified step content renderer - single step with all fields
  const renderStepContent = ({ currentStepData, formData, errors, handleInputChange, isGenerating }) => {
    const { fields } = terminationDueToFaultConfig;
    
    // Get selected article case details for display
    const selectedArticleCase = formData.articleCase ? 
      ALL_ARTICLE_CASES.find(article => article.value === formData.articleCase) : null;

    // All fields are shown on single step
    const allFields = Object.values(fields);

    return (
      <div className={styles['form-section']}>
        <h3>{currentStepData.title}</h3>
        <p className={styles['section-description']}>{currentStepData.description}</p>
        
        {/* Legal guidance */}
        {currentStepData.legalGuidance && (
          <div className={styles['legal-guidance']}>
            <div className={styles['guidance-header']}>
              <strong>⚖️ Правна насока</strong>
            </div>
            <p className={styles['guidance-text']}>{currentStepData.legalGuidance}</p>
          </div>
        )}
        
        {/* Show article selection info */}
        {selectedArticleCase && (
          <div className={styles['selected-article-info']}>
            <div className={styles['article-header']}>
              <strong>📋 Избран член и случај:</strong>
            </div>
            <div className={styles['article-details']}>
              <h4>{selectedArticleCase.shortLabel || selectedArticleCase.label}</h4>
              <p><strong>Опис:</strong> {selectedArticleCase.description}</p>
              <p><strong>Отказен рок:</strong> {selectedArticleCase.noticeRequired ? 
                `${selectedArticleCase.noticePeriod} дена` : 'Без отказен рок (итно)'}</p>
              <div className={styles['document-preview-note']}>
                <p><strong>📄 Во документот ќе се генерира:</strong></p>
                <p style={{fontStyle: 'italic', marginTop: '5px'}}>
                  "Согласно член {selectedArticleCase.shortLabel?.split(',')[0]?.split(' ')[1]} став 1 точка {selectedArticleCase.shortLabel?.split(',')[1]?.split(' ')[2]} од ЗРО, [компанија], со седиште на [адреса], застапувана од [управител], на [датум] донесе следнава одлука:"
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Show article comparison guide */}
        <div className={styles['article-guide']}>
          <div className={styles['guide-header']}>
            <strong>📚 Водич за членови 81 и 82</strong>
          </div>
          <div className={styles['articles-comparison']}>
            <div className={styles['article-section']}>
              <h4>Член 81 - СО отказен рок (30 дена)</h4>
              <p><strong>За:</strong> Стандардни повреди на работните обврски</p>
              <ul className={styles['cases-list']}>
                <li>Недисциплина и неисполнување на обврски</li>
                <li>Несовесно извршување на работите</li>
                <li>Неспоштување на работното време</li>
                <li>Неизвестување за отсуство</li>
                <li>Несовесно постапување со средствата за работа</li>
              </ul>
            </div>
            <div className={styles['article-section']}>
              <h4>Член 82 - БЕЗ отказен рок (итно)</h4>
              <p><strong>За:</strong> Сериозни повреди кои бараат итен престанок</p>
              <ul className={styles['cases-list']}>
                <li>Неоправдано отсуство (3 последователни или 5 дена во година)</li>
                <li>Злоупотреба на боледување</li>
                <li>Алкохол и наркотици на работното место</li>
                <li>Кражба или намерно штетење</li>
                <li>Одавање деловна тајна</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Form fields */}
        {allFields.map(field => (
          <FormField
            key={field.name}
            field={field}
            value={formData[field.name]}
            formData={formData}
            onChange={handleInputChange}
            error={errors[field.name]}
            disabled={isGenerating}
          />
        ))}

        {/* Simple tips for factual situation */}
        <div className={styles['help-section']}>
          <div className={styles['legal-tips']}>
            <h4>💡 Совети за попишување на фактичка ситуација</h4>
            <ul className={styles['tips-list']}>
              <li><strong>Конкретни факти:</strong> Опишете конкретни настани, датуми и околности</li>
              <li><strong>Објективност:</strong> Избегнувајте емотивен јазик, фокусирајте се на факти</li>
              <li><strong>Докази:</strong> Споменете ги документи, сведоци или други докази што ги имате</li>
              <li><strong>Последици:</strong> Опишете како повредата влијае на работата или организацијата</li>
            </ul>
          </div>
          
          <div className={styles['legal-note']}>
            <p><strong>⚖️ Правна напомена:</strong> Сите полиња се опциски. Можете да генерирате празен документ и да го пополните рачно, или да внесете основни информации.</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <BaseDocumentPage
      config={terminationDueToFaultConfig}
      renderStepContent={renderStepContent}
      title="Одлука за Престанок Поради Вина на Работникот"
      description="Упростена генерација на одлука за престанок врз основа на членови 81 и 82 од ЗРО. Сите полиња се опциски - можете да генерирате празен документ за рачно пополнување."
    />
  );
};

export default TerminationDueToFaultPage;