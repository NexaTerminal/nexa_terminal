import React, { useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import BaseDocumentPage from '../../../components/documents/BaseDocumentPage';
import FormField from '../../../components/forms/FormField';
import marketingPerformanceReportConfig from '../../../config/marketingDocuments/marketingPerformanceReport';
import styles from '../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Custom Preview Component for Marketing Performance Report
 * Shows live calculations and metrics
 */
const MarketingPreview = ({ formData }) => {
  // Data extraction
  const companyName = formData.companyName || '[Компанија]';
  const industry = formData.industry || '-';
  const companySize = formData.companySize || '-';
  const marketingTeamSize = formData.marketingTeamSize || '-';
  const reportPeriodType = formData.reportPeriodType || '-';
  const marketingChannels = formData.marketingChannels || [];
  const primaryChannel = formData.primaryChannel || '';
  const totalBudget = parseFloat(formData.totalBudget) || 0;
  const actualSpent = parseFloat(formData.actualSpent) || 0;
  const executionType = formData.executionType || '-';
  const totalLeads = parseInt(formData.totalLeads) || 0;
  const totalSales = parseInt(formData.totalSales) || 0;
  const estimatedRevenue = parseFloat(formData.estimatedRevenue) || 0;
  const websiteTrafficChange = formData.websiteTrafficChange || '-';
  const socialMediaEngagement = formData.socialMediaEngagement || '-';
  const mainGoal = formData.mainGoal || '-';
  const goalAchievement = formData.goalAchievement || '-';
  const overallRating = formData.overallRating || '-';
  const nextPeriodFocus = formData.nextPeriodFocus || '-';
  const challenges = formData.challenges || [];
  const recommendedActions = formData.recommendedActions || [];

  // Automated calculations
  const budgetUtilization = totalBudget > 0 ? ((actualSpent / totalBudget) * 100).toFixed(1) : 0;
  const costPerLead = totalLeads > 0 ? Math.round(actualSpent / totalLeads) : 0;
  const costPerSale = totalSales > 0 ? Math.round(actualSpent / totalSales) : 0;
  const conversionRate = totalLeads > 0 ? ((totalSales / totalLeads) * 100).toFixed(1) : 0;
  const roi = actualSpent > 0 && estimatedRevenue > 0
    ? (((estimatedRevenue - actualSpent) / actualSpent) * 100).toFixed(1)
    : null;

  const ratingLabels = { '5': 'Одлично', '4': 'Многу добро', '3': 'Добро', '2': 'Задоволително', '1': 'Незадоволително' };

  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewHeader}>
        <h3 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '14px' }}>МАРКЕТИНГ ПЕРФОРМАНС ИЗВЕШТАЈ</h3>
        <p style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '11px', marginBottom: '15px', color: '#666' }}>
          {reportPeriodType !== '-' ? `${reportPeriodType} извештај` : 'Преглед'}
        </p>
      </div>

      {/* Company Info */}
      <div className={styles.previewSection} style={{ marginBottom: '12px' }}>
        <h4 style={{ fontSize: '12px', marginBottom: '6px', color: '#374151' }}>Компанија</h4>
        <p style={{ fontSize: '11px', margin: '2px 0' }}><strong>{companyName}</strong></p>
        <p style={{ fontSize: '10px', margin: '2px 0', color: '#666' }}>{industry} | {companySize} вработени</p>
        <p style={{ fontSize: '10px', margin: '2px 0', color: '#666' }}>Тим: {marketingTeamSize === '0' ? 'Без посветен тим' : marketingTeamSize}</p>
      </div>

      {/* Budget Metrics */}
      <div className={styles.previewSection} style={{ marginBottom: '12px', background: '#f8f9fa', padding: '10px', borderRadius: '6px' }}>
        <h4 style={{ fontSize: '12px', marginBottom: '8px', color: '#374151' }}>Буџет и искористеност</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
          <span>Планирано:</span>
          <strong>{totalBudget.toLocaleString()} МКД</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
          <span>Потрошено:</span>
          <strong>{actualSpent.toLocaleString()} МКД</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: parseFloat(budgetUtilization) > 100 ? '#dc2626' : '#059669' }}>
          <span>Искористеност:</span>
          <strong>{budgetUtilization}%</strong>
        </div>
      </div>

      {/* Channels */}
      {marketingChannels.length > 0 && (
        <div className={styles.previewSection} style={{ marginBottom: '12px' }}>
          <h4 style={{ fontSize: '12px', marginBottom: '6px', color: '#374151' }}>Канали ({marketingChannels.length})</h4>
          <p style={{ fontSize: '10px', color: '#666' }}>{marketingChannels.join(', ')}</p>
          {primaryChannel && <p style={{ fontSize: '10px', marginTop: '4px' }}><strong>Примарен:</strong> {primaryChannel}</p>}
        </div>
      )}

      {/* KPIs */}
      <div className={styles.previewSection} style={{ marginBottom: '12px', background: '#f0f9ff', padding: '10px', borderRadius: '6px' }}>
        <h4 style={{ fontSize: '12px', marginBottom: '8px', color: '#374151' }}>Клучни метрики (автоматски)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px' }}>
          <div><span style={{ color: '#666' }}>Leads:</span> <strong>{totalLeads}</strong></div>
          <div><span style={{ color: '#666' }}>Продажби:</span> <strong>{totalSales}</strong></div>
          <div><span style={{ color: '#666' }}>Конверзија:</span> <strong>{conversionRate}%</strong></div>
          <div><span style={{ color: '#666' }}>CPL:</span> <strong>{costPerLead} МКД</strong></div>
          <div><span style={{ color: '#666' }}>CPA:</span> <strong>{costPerSale} МКД</strong></div>
          {roi && <div><span style={{ color: '#666' }}>ROI:</span> <strong style={{ color: parseFloat(roi) >= 0 ? '#059669' : '#dc2626' }}>{roi}%</strong></div>}
        </div>
      </div>

      {/* Digital Performance */}
      <div className={styles.previewSection} style={{ marginBottom: '12px' }}>
        <h4 style={{ fontSize: '12px', marginBottom: '6px', color: '#374151' }}>Дигитални перформанси</h4>
        <p style={{ fontSize: '10px', margin: '2px 0' }}>Веб сообраќај: <strong>{websiteTrafficChange}</strong></p>
        <p style={{ fontSize: '10px', margin: '2px 0' }}>Engagement: <strong>{socialMediaEngagement}</strong></p>
      </div>

      {/* Goals */}
      <div className={styles.previewSection} style={{ marginBottom: '12px' }}>
        <h4 style={{ fontSize: '12px', marginBottom: '6px', color: '#374151' }}>Цели и оценка</h4>
        <p style={{ fontSize: '10px', margin: '2px 0' }}>Цел: <strong>{mainGoal}</strong></p>
        <p style={{ fontSize: '10px', margin: '2px 0' }}>Остварување: <strong>{goalAchievement}</strong></p>
        <p style={{ fontSize: '11px', margin: '6px 0', textAlign: 'center' }}>
          <strong style={{ fontSize: '14px' }}>{overallRating}/5</strong>
          <span style={{ color: '#666', marginLeft: '4px' }}>{ratingLabels[overallRating] || ''}</span>
        </p>
      </div>

      {/* Next Period */}
      {nextPeriodFocus !== '-' && (
        <div className={styles.previewSection} style={{ marginBottom: '12px', background: '#fef3c7', padding: '8px', borderRadius: '6px' }}>
          <p style={{ fontSize: '10px', margin: 0 }}><strong>Фокус:</strong> {nextPeriodFocus}</p>
        </div>
      )}

      {/* Challenges & Actions */}
      {(challenges.length > 0 || recommendedActions.length > 0) && (
        <div className={styles.previewSection} style={{ fontSize: '10px' }}>
          {challenges.length > 0 && !challenges.includes('Нема значајни предизвици') && (
            <>
              <p style={{ margin: '4px 0', color: '#dc2626' }}><strong>Предизвици:</strong> {challenges.length}</p>
            </>
          )}
          {recommendedActions.length > 0 && (
            <p style={{ margin: '4px 0', color: '#059669' }}><strong>Планирани акции:</strong> {recommendedActions.length}</p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Marketing Performance Report Page
 * Multi-step form for generating marketing performance reports
 */
const MarketingPerformanceReportPage = () => {
  const { currentUser } = useAuth();
  const { fields } = marketingPerformanceReportConfig;

  // Create config with auto-populated company name from logged-in user
  const configWithUserData = useMemo(() => {
    return {
      ...marketingPerformanceReportConfig,
      initialFormData: {
        ...marketingPerformanceReportConfig.initialFormData,
        companyName: currentUser?.companyInfo?.companyName || ''
      }
    };
  }, [currentUser]);

  // Get fields for current step
  const getStepFields = (stepNumber) => {
    return Object.values(fields).filter(field => field.step === stepNumber);
  };

  // Check if a conditional field should be visible
  const shouldShowField = (field, formData) => {
    if (!field.conditional) return true;
    const { field: condField, value } = field.conditional;
    return formData[condField] === value;
  };

  // Custom step content renderer
  const renderStepContent = ({ currentStep, currentStepData, formData, errors, handleInputChange, isGenerating }) => {
    const stepFields = getStepFields(currentStep);

    return (
      <div className={styles['form-section']}>
        <h3>{currentStepData.title}</h3>
        <p className={styles['section-description']}>{currentStepData.description}</p>

        {stepFields.map(field => {
          // Check conditional visibility
          if (!shouldShowField(field, formData)) return null;

          // Handle checkbox-group type specially
          if (field.type === 'checkbox-group') {
            return (
              <div key={field.name} className={styles['field-group']}>
                <label className={styles['field-label']}>
                  {field.label}
                  {field.required && <span className={styles['required-mark']}>*</span>}
                </label>
                {field.helpText && (
                  <p className={styles['help-text']}>{field.helpText}</p>
                )}
                <div className={styles['checkbox-group-container']}>
                  {field.options.map(option => (
                    <label key={option.value} className={styles['checkbox-item']}>
                      <input
                        type="checkbox"
                        checked={(formData[field.name] || []).includes(option.value)}
                        onChange={(e) => {
                          const currentValues = formData[field.name] || [];
                          let newValues;
                          if (e.target.checked) {
                            newValues = [...currentValues, option.value];
                          } else {
                            newValues = currentValues.filter(v => v !== option.value);
                          }
                          handleInputChange(field.name, newValues);
                        }}
                        disabled={isGenerating}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors[field.name] && (
                  <span className={styles['error-message']}>{errors[field.name]}</span>
                )}
              </div>
            );
          }

          // Handle single checkbox type
          if (field.type === 'checkbox') {
            return (
              <div key={field.name} className={styles['field-group']}>
                <label className={styles['checkbox-single']}>
                  <input
                    type="checkbox"
                    checked={formData[field.name] || false}
                    onChange={(e) => {
                      handleInputChange(field.name, e.target.checked);
                    }}
                    disabled={isGenerating}
                  />
                  <span>{field.label}</span>
                </label>
              </div>
            );
          }

          // Use FormField for standard field types
          return (
            <FormField
              key={field.name}
              field={field}
              value={formData[field.name]}
              formData={formData}
              onChange={handleInputChange}
              error={errors[field.name]}
              disabled={isGenerating}
            />
          );
        })}
      </div>
    );
  };

  // Custom preview renderer
  const renderCustomPreview = ({ formData }) => {
    return <MarketingPreview formData={formData} />;
  };

  return (
    <BaseDocumentPage
      config={configWithUserData}
      renderStepContent={renderStepContent}
      customPreviewComponent={renderCustomPreview}
      title="Маркетинг перформанс извештај"
      description="Пополнете ги податоците за генерирање на извештај за маркетинг перформанси"
    />
  );
};

export default MarketingPerformanceReportPage;
