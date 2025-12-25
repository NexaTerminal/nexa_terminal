import React, { useState } from 'react';
import { useAuth } from "../../../../contexts/AuthContext";
import Header from "../../../../components/common/Header";
import Sidebar from "../../../../components/terminal/Sidebar";
import ProfileReminderBanner from "../../../../components/terminal/ProfileReminderBanner";
import FormField, { TermsField } from '../../../../components/forms/FormField';
import organizationActConfig from '../../../../config/documents/organizationAct';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

/**
 * Organization Act Page
 * Uses the BaseDocumentPage architecture for consistency with other document pages
 * Implements comprehensive multi-step form for organization act generation
 */

const OrganizationActPage = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    documentDate: '',
    positions: []
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerateDocument = async () => {
    setIsGenerating(true);
    try {
      // Ensure positions is always an array when sending to server
      const positionsArray = Array.isArray(formData.positions) 
        ? formData.positions 
        : Object.values(formData.positions || {});
      
      const formDataToSend = {
        ...formData,
        positions: positionsArray
      };

      const response = await fetch('/api/auto-documents/organization-act', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ formData: formDataToSend })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Akt-za-sistematizacija-${new Date().toISOString().split('T')[0]}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        console.error('Error generating document:', error);
        alert('Грешка при генерирањето на документот. Ве молиме обидете се повторно.');
      }
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Грешка при генерирањето на документот. Ве молиме обидете се повторно.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Header isTerminal={true} />
      <div className={styles.dashboardLayout}>
        <Sidebar />
        <main className={styles.dashboardMain}>
          {!currentUser?.profileComplete && <ProfileReminderBanner />}
          
          {/* Full-Width Organogram Section */}
          <div className={styles['organogram-page']}>
            {/* Interactive Organogram */}
            <div className={styles['organogram-container']}>
              <InteractiveOrgTreeBuilder
                positions={formData.positions || []}
                onChange={handleInputChange}
                isGenerating={isGenerating}
              />
            </div>

            {/* Minimal Date Section and Generate Button */}
            <div className={styles['bottom-controls']}>
              <div className={styles['minimal-date-section']}>
                <FormField
                  field={organizationActConfig.fields.documentDate}
                  value={formData.documentDate}
                  formData={formData}
                  onChange={handleInputChange}
                  disabled={isGenerating}
                />
              </div>

              {/* Terms and Conditions */}
              <TermsField
                value={acceptTerms}
                onChange={(name, value) => setAcceptTerms(value)}
                disabled={isGenerating}
              />

              <button
                className={styles['generate-btn']}
                onClick={handleGenerateDocument}
                disabled={isGenerating || !formData.documentDate || formData.positions.length === 0 || !acceptTerms}
              >
                {isGenerating ? '⏳ Генерирање...' : '📄 Генерирај документ'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

/**
 * Organization Analytics Component - Phase 3
 * Advanced validation, analytics, and enterprise recommendations
 */
const OrganizationAnalytics = ({ positions }) => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [selectedExport, setSelectedExport] = useState('pdf');

  // Calculate organizational metrics
  const calculateMetrics = () => {
    if (!positions || positions.length === 0) return null;

    const hierarchyMap = {};
    const rootPositions = [];
    let maxDepth = 0;
    let totalEmployees = 0;

    // Build hierarchy map
    positions.forEach(pos => {
      hierarchyMap[pos.id] = { ...pos, children: [], level: 0 };
      const empCount = parseInt(pos.numberOfEmployees?.match(/\d+/)?.[0] || '0');
      totalEmployees += empCount;
    });

    // Calculate levels and build tree
    positions.forEach(pos => {
      if (pos.parentId && hierarchyMap[pos.parentId]) {
        hierarchyMap[pos.parentId].children.push(hierarchyMap[pos.id]);
        hierarchyMap[pos.id].level = hierarchyMap[pos.parentId].level + 1;
        maxDepth = Math.max(maxDepth, hierarchyMap[pos.id].level);
      } else {
        rootPositions.push(hierarchyMap[pos.id]);
      }
    });

    // Calculate span of control
    const spanOfControl = positions.map(pos => {
      const directReports = positions.filter(p => p.parentId === pos.id).length;
      return { positionName: pos.positionName, span: directReports };
    }).filter(item => item.span > 0);

    const avgSpan = spanOfControl.length > 0 
      ? spanOfControl.reduce((sum, item) => sum + item.span, 0) / spanOfControl.length 
      : 0;

    return {
      totalPositions: positions.length,
      totalEmployees,
      hierarchyDepth: maxDepth + 1,
      spanOfControl: avgSpan,
      rootPositions: rootPositions.length,
      managerPositions: spanOfControl.length,
      leafPositions: positions.filter(pos => !positions.some(p => p.parentId === pos.id)).length
    };
  };

  // Analyze organizational issues
  const analyzeIssues = () => {
    const metrics = calculateMetrics();
    if (!metrics) return [];

    const issues = [];

    // Span of control analysis
    if (metrics.spanOfControl > 8) {
      issues.push({
        type: 'warning',
        title: 'Широк опсег на контрола',
        description: `Просечниот менаџер има ${metrics.spanOfControl.toFixed(1)} директни подредени. Препорачува се 3-7.`,
        recommendation: 'Разгледајте додавање средни менаџерски позиции.'
      });
    } else if (metrics.spanOfControl < 2 && metrics.managerPositions > 1) {
      issues.push({
        type: 'info',
        title: 'Тесен опсег на контрола',
        description: `Просечниот менаџер има ${metrics.spanOfControl.toFixed(1)} директни подредени.`,
        recommendation: 'Можеби можете да консолидирате некои менаџерски позиции.'
      });
    }

    // Hierarchy depth analysis
    if (metrics.hierarchyDepth > 6) {
      issues.push({
        type: 'error',
        title: 'Премногу длабока хиерархија',
        description: `Организацијата има ${metrics.hierarchyDepth} нивоа. Препорачува се максимум 5-6.`,
        recommendation: 'Разгледајте рамнување на организационата структура.'
      });
    }

    // Multiple root analysis
    if (metrics.rootPositions > 3) {
      issues.push({
        type: 'warning',
        title: 'Многу врвни позиции',
        description: `Имате ${metrics.rootPositions} позиции на врвот без надредени.`,
        recommendation: 'Разгледајте номинирање главна извршна позиција.'
      });
    }

    // Empty positions analysis
    const incompletePositions = positions.filter(pos => !pos.positionName || !pos.numberOfEmployees).length;
    if (incompletePositions > 0) {
      issues.push({
        type: 'warning',
        title: 'Недополнети позиции',
        description: `${incompletePositions} позиции немаат комплетни информации.`,
        recommendation: 'Дополнете ги сите задолжителни полиња.'
      });
    }

    return issues;
  };

  // Generate recommendations
  const generateRecommendations = () => {
    const metrics = calculateMetrics();
    const issues = analyzeIssues();
    if (!metrics) return [];

    const recommendations = [];

    // Based on company size
    if (metrics.totalEmployees < 10) {
      recommendations.push({
        priority: 'low',
        title: 'Мала организација - оптимизирај за флексибилност',
        description: 'Со помалку од 10 вработени, фокусирајте се на јасни одговорности наместо строга хиерархија.',
        actions: ['Намалете нивоа', 'Зголемете автономија']
      });
    } else if (metrics.totalEmployees > 100) {
      recommendations.push({
        priority: 'high',
        title: 'Голема организација - потребна е стандардизација',
        description: 'Со над 100 вработени, важно е да имате јасни процеси и комуникациски канали.',
        actions: ['Стандардизирај процеси', 'Дефинирај улоги']
      });
    }

    // Critical issues first
    if (issues.some(issue => issue.type === 'error')) {
      recommendations.unshift({
        priority: 'high',
        title: 'Критични проблеми во структурата',
        description: 'Детектирани се критични проблеми што можат да влијаат на ефикасноста.',
        actions: ['Отстрани критични проблеми', 'Ревизија на структура']
      });
    }

    return recommendations;
  };

  const metrics = calculateMetrics();
  const issues = analyzeIssues();
  const recommendations = generateRecommendations();

  // Handle export functionality
  const handleExport = () => {
    const exportData = {
      positions,
      metrics,
      issues,
      recommendations,
      exportedAt: new Date().toISOString()
    };

    switch (selectedExport) {
      case 'json':
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'organizational-analysis.json';
        a.click();
        break;
      case 'csv':
        const csvData = positions.map(pos => ({
          'Position': pos.positionName || '',
          'Employees': pos.numberOfEmployees || '',
          'Parent': positions.find(p => p.id === pos.parentId)?.positionName || '',
          'Education': pos.educationRequirements || '',
          'Experience': pos.experienceRequirements || ''
        }));
        // Convert to CSV string and download
        break;
      default:
        // PDF export not implemented yet
    }
  };

  if (!positions || positions.length === 0) {
    return (
      <div className={styles['analytics-panel']}>
        <h3 className={styles['analytics-title']}>📊 Организациона аналитика</h3>
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
          Додајте позиции за да видите аналитика и препораки
        </p>
      </div>
    );
  }

  return (
    <div className={styles['analytics-panel']}>
      <div className={styles['analytics-header']}>
        <h3 className={styles['analytics-title']}>📊 Организациона аналитика</h3>
      </div>

      {/* Tabs */}
      <div className={styles['analytics-tabs']}>
        <button 
          className={`${styles['analytics-tab']} ${activeTab === 'analytics' ? styles.active : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Метрики
        </button>
        <button 
          className={`${styles['analytics-tab']} ${activeTab === 'issues' ? styles.active : ''}`}
          onClick={() => setActiveTab('issues')}
        >
          Проблеми ({issues.length})
        </button>
        <button 
          className={`${styles['analytics-tab']} ${activeTab === 'recommendations' ? styles.active : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          Препораки
        </button>
        <button 
          className={`${styles['analytics-tab']} ${activeTab === 'export' ? styles.active : ''}`}
          onClick={() => setActiveTab('export')}
        >
          Извоз
        </button>
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className={styles['metrics-grid']}>
          <div className={styles['metric-card']}>
            <div className={styles['metric-value']}>{metrics?.totalPositions || 0}</div>
            <div className={styles['metric-label']}>Вкупно позиции</div>
          </div>
          <div className={styles['metric-card']}>
            <div className={styles['metric-value']}>{metrics?.totalEmployees || 0}</div>
            <div className={styles['metric-label']}>Вкупно вработени</div>
          </div>
          <div className={styles['metric-card']}>
            <div className={styles['metric-value']}>{metrics?.hierarchyDepth || 0}</div>
            <div className={styles['metric-label']}>Длабочина на хиерархија</div>
            <div className={`${styles['metric-trend']} ${metrics?.hierarchyDepth > 5 ? styles.negative : styles.positive}`}>
              {metrics?.hierarchyDepth > 5 ? '⚠️ Премногу длабоко' : '✅ Оптимално'}
            </div>
          </div>
          <div className={styles['metric-card']}>
            <div className={styles['metric-value']}>{metrics?.spanOfControl.toFixed(1) || '0.0'}</div>
            <div className={styles['metric-label']}>Просечен опсег на контрола</div>
            <div className={`${styles['metric-trend']} ${
              metrics?.spanOfControl > 8 ? styles.negative : 
              metrics?.spanOfControl < 2 ? styles.neutral : 
              styles.positive
            }`}>
              {metrics?.spanOfControl > 8 ? '📈 Преширок' : 
               metrics?.spanOfControl < 2 ? '📉 Претесен' : 
               '✅ Добар'}
            </div>
          </div>
        </div>
      )}

      {/* Issues Tab */}
      {activeTab === 'issues' && (
        <div className={styles['validation-issues']}>
          {issues.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#16a34a' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h4>Нема детектирани проблеми</h4>
              <p>Вашата организациона структура изгледа добро!</p>
            </div>
          ) : (
            issues.map((issue, index) => (
              <div key={index} className={styles['issue-item']}>
                <div className={`${styles['issue-icon']} ${styles[issue.type]}`}>
                  {issue.type === 'error' ? '!' : issue.type === 'warning' ? '⚠' : 'i'}
                </div>
                <div className={styles['issue-content']}>
                  <h4 className={styles['issue-title']}>{issue.title}</h4>
                  <p className={styles['issue-description']}>{issue.description}</p>
                  <p className={styles['issue-recommendation']}>💡 {issue.recommendation}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className={styles['recommendations']}>
          {recommendations.map((rec, index) => (
            <div key={index} className={`${styles['recommendation-card']} ${styles[`${rec.priority}-priority`]}`}>
              <div className={styles['recommendation-header']}>
                <h4 className={styles['recommendation-title']}>{rec.title}</h4>
                <span className={`${styles['recommendation-priority']} ${styles[rec.priority]}`}>
                  {rec.priority === 'high' ? 'Висок' : rec.priority === 'medium' ? 'Среден' : 'Низок'}
                </span>
              </div>
              <p className={styles['recommendation-description']}>{rec.description}</p>
              <div className={styles['recommendation-actions']}>
                {rec.actions?.map((action, idx) => (
                  <button key={idx} className={`${styles['recommendation-btn']} ${styles.secondary}`}>
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className={styles['export-panel']}>
          <div className={styles['export-options']}>
            <div 
              className={`${styles['export-option']} ${selectedExport === 'pdf' ? styles.selected : ''}`}
              onClick={() => setSelectedExport('pdf')}
            >
              <div className={styles['export-icon']}>📄</div>
              <div className={styles['export-title']}>PDF Извештај</div>
              <div className={styles['export-description']}>
                Комплетен извештај со аналитика, препораки и организациона шема
              </div>
            </div>
            <div 
              className={`${styles['export-option']} ${selectedExport === 'json' ? styles.selected : ''}`}
              onClick={() => setSelectedExport('json')}
            >
              <div className={styles['export-icon']}>📊</div>
              <div className={styles['export-title']}>JSON Податоци</div>
              <div className={styles['export-description']}>
                Структурирани податоци за интеграција со HR системи
              </div>
            </div>
            <div 
              className={`${styles['export-option']} ${selectedExport === 'csv' ? styles.selected : ''}`}
              onClick={() => setSelectedExport('csv')}
            >
              <div className={styles['export-icon']}>📋</div>
              <div className={styles['export-title']}>CSV Табела</div>
              <div className={styles['export-description']}>
                Табеларни податоци за анализа во Excel или Google Sheets
              </div>
            </div>
          </div>
          <div className={styles['export-actions']}>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
              Експортирај ги податоците во избраниот формат
            </div>
            <button className={styles['export-btn']} onClick={handleExport}>
              📤 Експортирај {selectedExport.toUpperCase()}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Live Tree Visualization Component - Phase 2
 * Interactive drag-and-drop organizational hierarchy builder
 */
const LiveTreeVisualization = ({ positions, onChange }) => {
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [isDropTargetChild, setIsDropTargetChild] = useState(false);
  const [treeZoom, setTreeZoom] = useState(1);
  const [treePan, setTreePan] = useState({ x: 0, y: 0 });
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());

  // Build hierarchy tree structure
  const buildHierarchyTree = () => {
    const hierarchyMap = {};
    const rootNodes = [];
    
    // Initialize all positions
    positions.forEach(position => {
      hierarchyMap[position.id] = {
        ...position,
        children: [],
        level: 0
      };
    });
    
    // Build parent-child relationships
    positions.forEach(position => {
      if (position.parentId && hierarchyMap[position.parentId]) {
        hierarchyMap[position.parentId].children.push(hierarchyMap[position.id]);
        hierarchyMap[position.id].level = hierarchyMap[position.parentId].level + 1;
      } else {
        rootNodes.push(hierarchyMap[position.id]);
      }
    });
    
    return { hierarchyMap, rootNodes };
  };

  const { hierarchyMap, rootNodes } = buildHierarchyTree();

  if (!positions || positions.length === 0) {
    return (
      <div className={styles['org-chart-empty']}>
        <div className={styles['org-chart-empty-icon']}>🏢</div>
        <h5>Организациона структура</h5>
        <p>Додајте позиции за да видите организациона шема во реално време</p>
      </div>
    );
  }

  // Drag and drop handlers
  const handleDragStart = (e, position) => {
    setDraggedNodeId(position.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', position.id);
  };

  const handleDragOver = (e, position) => {
    e.preventDefault();
    if (draggedNodeId && draggedNodeId !== position.id) {
      setDropTargetId(position.id);
      // Check if making this a child relationship
      const makeChild = e.ctrlKey || e.metaKey;
      setIsDropTargetChild(makeChild);
      e.dataTransfer.dropEffect = makeChild ? 'link' : 'move';
    }
  };

  const handleDrop = (e, targetPosition) => {
    e.preventDefault();
    if (draggedNodeId && draggedNodeId !== targetPosition.id) {
      const makeChild = e.ctrlKey || e.metaKey;
      updateHierarchy(draggedNodeId, makeChild ? targetPosition.id : null);
    }
    // Reset drag state
    setDraggedNodeId(null);
    setDropTargetId(null);
    setIsDropTargetChild(false);
  };

  const handleDragEnd = () => {
    setDraggedNodeId(null);
    setDropTargetId(null);
    setIsDropTargetChild(false);
  };

  // Update position hierarchy
  const updateHierarchy = (positionId, newParentId) => {
    const updatedPositions = positions.map(pos => {
      if (pos.id === positionId) {
        return { ...pos, parentId: newParentId };
      }
      return pos;
    });
    onChange('positions', updatedPositions);
  };

  // Node click handler
  const handleNodeClick = (position) => {
    if (!draggedNodeId) {
      setEditingNodeId(position.id);
      // Scroll to the corresponding card in the left panel
      const cardElement = document.querySelector(`[data-position-id="${position.id}"]`);
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Tree controls
  const handleZoomIn = () => setTreeZoom(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setTreeZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleResetView = () => {
    setTreeZoom(1);
    setTreePan({ x: 0, y: 0 });
  };

  // Toggle node collapse
  const toggleNodeCollapse = (nodeId) => {
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Render tree node recursively
  const renderTreeNode = (node, level = 0, siblingIndex = 0) => {
    const isComplete = node.positionName && node.numberOfEmployees;
    const isEditing = editingNodeId === node.id;
    const isDragging = draggedNodeId === node.id;
    const isDropTarget = dropTargetId === node.id;
    const isCollapsed = collapsedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    
    const xPosition = level * 180 + 20;
    const yPosition = siblingIndex * 100 + level * 20 + 20;

    return (
      <React.Fragment key={node.id}>
        <div
          className={`${
            styles['tree-node']
          } ${
            styles.draggable
          } ${
            isComplete ? styles.complete : ''
          } ${
            isEditing ? styles.editing : ''
          } ${
            isDragging ? styles.dragging : ''
          } ${
            isDropTarget ? (isDropTargetChild ? styles['drop-target-child'] : styles['drop-target']) : ''
          }`}
          style={{
            top: `${yPosition}px`,
            left: `${xPosition}px`,
            transform: `scale(${treeZoom}) translate(${treePan.x}px, ${treePan.y}px)`
          }}
          draggable
          onDragStart={(e) => handleDragStart(e, node)}
          onDragOver={(e) => handleDragOver(e, node)}
          onDrop={(e) => handleDrop(e, node)}
          onDragEnd={handleDragEnd}
          onClick={() => handleNodeClick(node)}
        >
          {/* Hierarchy indicator */}
          {level > 0 && (
            <div className={`${styles['hierarchy-indicator']} ${styles.child}`}>
              {level}
            </div>
          )}
          
          {/* Node content */}
          <div className={styles['tree-node-title']}>
            {node.positionName || '[Позиција]'}
          </div>
          <div className={styles['tree-node-subtitle']}>
            {node.numberOfEmployees || '[Број]'} вработени
          </div>
          
          {/* Collapse/expand toggle */}
          {hasChildren && (
            <div
              className={`${
                styles['tree-node-toggle']
              } ${
                styles['has-children']
              } ${
                isCollapsed ? styles.collapsed : styles.expanded
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeCollapse(node.id);
              }}
            />
          )}
        </div>
        
        {/* Connection lines */}
        {level > 0 && (
          <>
            <div
              className={`${styles['hierarchy-connection']} ${styles.horizontal}`}
              style={{
                top: `${yPosition + 25}px`,
                left: `${xPosition - 60}px`,
                width: '50px'
              }}
            />
            <div
              className={`${styles['hierarchy-connection']} ${styles.vertical}`}
              style={{
                top: `${yPosition - 25}px`,
                left: `${xPosition - 60}px`,
                height: '50px'
              }}
            />
          </>
        )}
        
        {/* Render children */}
        {hasChildren && !isCollapsed && (
          <div className={styles['tree-node-children']}>
            {node.children.map((child, index) => 
              renderTreeNode(child, level + 1, index)
            )}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <div>
      {/* Tree controls */}
      <div className={styles['tree-controls']}>
        <button 
          className={styles['tree-control-btn']} 
          onClick={handleZoomOut}
          title="Намали"
        >
          🔍−
        </button>
        <button 
          className={styles['tree-control-btn']} 
          onClick={handleZoomIn}
          title="Зголеми"
        >
          🔍+
        </button>
        <button 
          className={styles['tree-control-btn']} 
          onClick={handleResetView}
          title="Ресетирај поглед"
        >
          🎯
        </button>
        <div style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.5rem' }}>
          💡 Држи Ctrl/Cmd + влечи за хиерархија
        </div>
      </div>
      
      {/* Tree canvas */}
      <div className={styles['tree-canvas']}>
        <div className={styles['tree-viewport']}>
          <div className={styles['tree-container']} style={{ position: 'relative', minHeight: '400px' }}>
            {rootNodes.map((node, index) => renderTreeNode(node, 0, index))}
            
            {/* Drop zones for root level */}
            {draggedNodeId && (
              <div
                className={`${styles['drop-zone']} ${dropTargetId === 'root' ? styles.highlight : ''}`}
                style={{
                  position: 'absolute',
                  top: `${rootNodes.length * 100 + 40}px`,
                  left: '20px',
                  width: '200px'
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropTargetId('root');
                  setIsDropTargetChild(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedNodeId) {
                    updateHierarchy(draggedNodeId, null);
                  }
                  setDraggedNodeId(null);
                  setDropTargetId(null);
                }}
              >
                📋 Додај како главна позиција
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Interactive Org Tree Builder - NEW ENHANCED VERSION
 * Hierarchical tree structure with +/- buttons, modal editing, and drag-and-drop
 * Matches the exact requirements from organizationAct.md
 */
const InteractiveOrgTreeBuilder = ({ positions, onChange, isGenerating }) => {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  // Add root-level position - fixed
  const addNewRootPosition = () => {
    const newPosition = {
      id: Date.now(),
      positionName: '',
      numberOfEmployees: '',
      educationRequirements: '',
      experienceRequirements: '',
      responsibilities: [],
      parentId: null,
      level: 0
    };
    
    const updatedPositions = [...positions, newPosition];
    onChange('positions', updatedPositions);
    
    // Open modal for immediate editing
    setEditingNodeId(newPosition.id);
    setShowModal(true);
  };

  // Initialize with root position if empty - use useEffect to avoid setState during render
  const [hasInitialized, setHasInitialized] = useState(false);
  
  React.useEffect(() => {
    if (!hasInitialized && (!positions || positions.length === 0)) {
      const rootPosition = {
        id: Date.now(),
        positionName: '',
        numberOfEmployees: '',
        educationRequirements: '',
        experienceRequirements: '',
        responsibilities: [],
        parentId: null,
        level: 0
      };
      onChange('positions', [rootPosition]);
      setHasInitialized(true);
    }
  }, [positions, onChange, hasInitialized]);

  if (!positions || positions.length === 0) {
    return (
      <div className={styles['org-tree-builder']}>
        <div className={styles['tree-header']}>
          <h3 className={styles['tree-title']}>🏢 Интерактивна организациона структура</h3>
          <div className={styles['tree-actions']}>
            <button
              className={styles['add-root-btn']}
              onClick={addNewRootPosition}
              disabled={isGenerating}
            >
              ➕ Додај главна позиција
            </button>
          </div>
        </div>
        <div className={styles['empty-tree']}>
          <p>Кликнете "Додај главна позиција" за да започнете со изградбата на вашата организација</p>
        </div>
      </div>
    );
  }

  // Build hierarchical tree structure
  const buildHierarchyTree = () => {
    const positionMap = {};
    const rootNodes = [];
    
    // Initialize all positions
    positions.forEach(position => {
      positionMap[position.id] = {
        ...position,
        children: [],
        level: 0
      };
    });
    
    // Build parent-child relationships and calculate levels
    positions.forEach(position => {
      if (position.parentId && positionMap[position.parentId]) {
        positionMap[position.parentId].children.push(positionMap[position.id]);
        positionMap[position.id].level = positionMap[position.parentId].level + 1;
      } else {
        rootNodes.push(positionMap[position.id]);
      }
    });
    
    return { positionMap, rootNodes };
  };

  // Add new position as child
  const addChildPosition = (parentId) => {
    const newPosition = {
      id: Date.now(),
      positionName: '',
      numberOfEmployees: '',
      educationRequirements: '',
      experienceRequirements: '',
      responsibilities: [],
      parentId: parentId,
      level: 0
    };
    
    const updatedPositions = [...positions, newPosition];
    onChange('positions', updatedPositions);
    
    // Auto-expand parent node
    setExpandedNodes(prev => new Set([...prev, parentId]));
    
    // Open modal for immediate editing
    setEditingNodeId(newPosition.id);
    setShowModal(true);
  };

  // Delete position and all its children
  const deletePosition = (positionId) => {
    const getAllChildren = (id) => {
      const children = positions.filter(p => p.parentId === id);
      let allChildren = [...children];
      children.forEach(child => {
        allChildren = [...allChildren, ...getAllChildren(child.id)];
      });
      return allChildren;
    };

    const toDelete = [positionId, ...getAllChildren(positionId).map(p => p.id)];
    const updatedPositions = positions.filter(p => !toDelete.includes(p.id));
    onChange('positions', updatedPositions);
    
    // Clean up UI state
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      toDelete.forEach(id => newSet.delete(id));
      return newSet;
    });
    
    if (selectedNodeId && toDelete.includes(selectedNodeId)) {
      setSelectedNodeId(null);
    }
  };

  // Toggle node expansion
  const toggleNodeExpansion = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Open position edit modal
  const editPosition = (position) => {
    setEditingNodeId(position.id);
    setShowModal(true);
  };

  // Save edited position
  const savePosition = (updatedData) => {
    const updatedPositions = positions.map(pos => 
      pos.id === editingNodeId ? { ...pos, ...updatedData } : pos
    );
    onChange('positions', updatedPositions);
    setShowModal(false);
    setEditingNodeId(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e, nodeId) => {
    setDraggedNodeId(nodeId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', nodeId);
  };

  const handleDragOver = (e, nodeId) => {
    e.preventDefault();
    if (draggedNodeId && draggedNodeId !== nodeId) {
      setDropTargetId(nodeId);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e, targetNodeId) => {
    e.preventDefault();
    if (draggedNodeId && draggedNodeId !== targetNodeId) {
      // Prevent dropping parent onto its own child
      const isChildOfDragged = (potentialChild, parent) => {
        const children = positions.filter(p => p.parentId === parent);
        if (children.some(child => child.id === potentialChild)) return true;
        return children.some(child => isChildOfDragged(potentialChild, child.id));
      };

      if (!isChildOfDragged(targetNodeId, draggedNodeId)) {
        const updatedPositions = positions.map(pos => 
          pos.id === draggedNodeId ? { ...pos, parentId: targetNodeId } : pos
        );
        onChange('positions', updatedPositions);
        
        // Auto-expand target node
        setExpandedNodes(prev => new Set([...prev, targetNodeId]));
      }
    }
    setDraggedNodeId(null);
    setDropTargetId(null);
  };

  const handleDragEnd = () => {
    setDraggedNodeId(null);
    setDropTargetId(null);
  };

  const { rootNodes } = buildHierarchyTree();

  // Render tree node recursively
  const renderTreeNode = (node) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;
    const isDragging = draggedNodeId === node.id;
    const isDropTarget = dropTargetId === node.id;
    const isComplete = node.positionName && node.numberOfEmployees;
    
    return (
      <div key={node.id} className={styles['tree-node-container']}>
        {/* Node */}
        <div
          className={`${styles['tree-node']} ${
            isComplete ? styles['complete'] : styles['incomplete']
          } ${
            isSelected ? styles['selected'] : ''
          } ${
            isDragging ? styles['dragging'] : ''
          } ${
            isDropTarget ? styles['drop-target'] : ''
          }`}
          draggable={!isGenerating}
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragOver={(e) => handleDragOver(e, node.id)}
          onDrop={(e) => handleDrop(e, node.id)}
          onDragEnd={handleDragEnd}
          onClick={() => setSelectedNodeId(node.id)}
          onDoubleClick={() => editPosition(node)}
          style={{
            marginLeft: `${node.level * 20}px`
          }}
        >
          {/* Expansion toggle */}
          <div className={styles['node-expand']}>
            {hasChildren ? (
              <button
                className={`${styles['expand-btn']} ${isExpanded ? styles['expanded'] : styles['collapsed']}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeExpansion(node.id);
                }}
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? '−' : '+'}
              </button>
            ) : (
              <div className={styles['expand-spacer']} />
            )}
          </div>

          {/* Node content */}
          <div className={styles['node-content']}>
            <div className={styles['node-avatar']}>
              {isComplete ? '👤' : '⭕'}
            </div>
            
            <div className={styles['node-info']}>
              <div className={styles['node-title']}>
                {node.positionName || 'Нова позиција'}
              </div>
              <div className={styles['node-subtitle']}>
                {node.numberOfEmployees ? `${node.numberOfEmployees} вработени` : 'Кликни за уредување'}
              </div>
            </div>
          </div>

          {/* Node actions */}
          <div className={styles['node-actions']}>
            <button
              className={styles['action-btn']}
              onClick={(e) => {
                e.stopPropagation();
                addChildPosition(node.id);
              }}
              title="Add child position"
              disabled={isGenerating}
            >
              +
            </button>
            <button
              className={styles['action-btn']}
              onClick={(e) => {
                e.stopPropagation();
                editPosition(node);
              }}
              title="Edit position"
              disabled={isGenerating}
            >
              ✏️
            </button>
            <button
              className={`${styles['action-btn']} ${styles['delete-btn']}`}
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Delete this position and all its children?')) {
                  deletePosition(node.id);
                }
              }}
              title="Delete position"
              disabled={isGenerating}
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className={styles['tree-children']}>
            {node.children.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles['org-tree-builder']}>
      {/* Header */}
      <div className={styles['tree-header']}>
        <h3 className={styles['tree-title']}>🏢 Интерактивна организациона структура</h3>
        <div className={styles['tree-stats']}>
          <span>{positions.length} позиции</span>
          <span>•</span>
          <span>{positions.filter(p => p.positionName && p.numberOfEmployees).length} завршени</span>
        </div>
        <div className={styles['tree-actions']}>
          <button
            className={styles['add-root-btn']}
            onClick={addNewRootPosition}
            disabled={isGenerating}
          >
            ➕ Додај главна позиција
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className={styles['tree-instructions']}>
        <div className={styles['instruction-item']}>
          <span className={styles['instruction-icon']}>🖱️</span>
          <span>Кликни + за додавање подредени позиции</span>
        </div>
        <div className={styles['instruction-item']}>
          <span className={styles['instruction-icon']}>✏️</span>
          <span>Двоклик или користи копче за уредување</span>
        </div>
        <div className={styles['instruction-item']}>
          <span className={styles['instruction-icon']}>🔄</span>
          <span>Повлечи и спушти за реорганизирање</span>
        </div>
      </div>

      {/* Tree View */}
      <div className={styles['tree-container']}>
        {rootNodes.length > 0 ? (
          rootNodes.map(node => renderTreeNode(node))
        ) : (
          <div className={styles['empty-tree']}>
            <p>Кликнете "Додај главна позиција" за да започнете со изградбата на вашата организација</p>
          </div>
        )}
      </div>

      {/* Drop zones */}
      {draggedNodeId && (
        <div
          className={styles['root-drop-zone']}
          onDragOver={(e) => {
            e.preventDefault();
            setDropTargetId('root');
          }}
          onDrop={(e) => {
            e.preventDefault();
            const updatedPositions = positions.map(pos => 
              pos.id === draggedNodeId ? { ...pos, parentId: null } : pos
            );
            onChange('positions', updatedPositions);
            setDraggedNodeId(null);
            setDropTargetId(null);
          }}
        >
          📋 Спуштете овде за главна позиција
        </div>
      )}

      {/* Position Edit Modal */}
      {showModal && editingNodeId && (
        <EnhancedPositionModal
          position={positions.find(p => p.id === editingNodeId)}
          onSave={savePosition}
          onClose={() => {
            setShowModal(false);
            setEditingNodeId(null);
          }}
        />
      )}
    </div>
  );
};

/**
 * Interactive Organizational Chart Builder - Excel SmartArt Style
 * Full-screen interactive chart where users build their organization visually
 */
const InteractiveOrgChartBuilder = ({ positions, onChange, isGenerating }) => {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, scale: 1 });

  // Initialize with one empty position if none exist
  if (!positions || positions.length === 0) {
    const initialPosition = {
      id: Date.now(),
      positionName: '',
      numberOfEmployees: '',
      educationRequirements: '',
      experienceRequirements: '',
      responsibilities: '',
      parentId: null
    };
    onChange('positions', [initialPosition]);
    return null; // Will re-render with the new position
  }

  // Add new position
  const addPosition = (parentId = null) => {
    const newPosition = {
      id: Date.now(),
      positionName: '',
      numberOfEmployees: '',
      educationRequirements: '',
      experienceRequirements: '',
      responsibilities: '',
      parentId
    };
    onChange('positions', [...positions, newPosition]);
  };

  // Delete position
  const deletePosition = (positionId) => {
    // Also delete all children
    const getAllChildren = (id) => {
      const children = positions.filter(p => p.parentId === id);
      let allChildren = [...children];
      children.forEach(child => {
        allChildren = [...allChildren, ...getAllChildren(child.id)];
      });
      return allChildren;
    };

    const toDelete = [positionId, ...getAllChildren(positionId).map(p => p.id)];
    const updatedPositions = positions.filter(p => !toDelete.includes(p.id));
    onChange('positions', updatedPositions);
    
    if (selectedNodeId && toDelete.includes(selectedNodeId)) {
      setSelectedNodeId(null);
    }
  };

  // Open edit modal
  const editPosition = (position) => {
    setEditingNodeId(position.id);
    setShowModal(true);
  };

  // Save edited position
  const savePosition = (updatedData) => {
    const updatedPositions = positions.map(pos => 
      pos.id === editingNodeId ? { ...pos, ...updatedData } : pos
    );
    onChange('positions', updatedPositions);
    setShowModal(false);
    setEditingNodeId(null);
  };

  // Build hierarchy for rendering
  const buildHierarchy = () => {
    const positionMap = {};
    const rootNodes = [];

    // Create map
    positions.forEach(pos => {
      positionMap[pos.id] = { ...pos, children: [] };
    });

    // Build tree
    positions.forEach(pos => {
      if (pos.parentId && positionMap[pos.parentId]) {
        positionMap[pos.parentId].children.push(positionMap[pos.id]);
      } else {
        rootNodes.push(positionMap[pos.id]);
      }
    });

    return { positionMap, rootNodes };
  };

  // Calculate position layout
  const calculateLayout = (nodes, startX = 50, startY = 50, levelHeight = 120) => {
    const layout = {};
    
    const calculateNodeLayout = (node, x, y, level = 0) => {
      layout[node.id] = { x, y, level };
      
      if (node.children && node.children.length > 0) {
        const childSpacing = Math.max(200, 300 / node.children.length);
        const totalWidth = (node.children.length - 1) * childSpacing;
        let childX = x - totalWidth / 2;
        
        node.children.forEach((child, index) => {
          calculateNodeLayout(child, childX, y + levelHeight, level + 1);
          childX += childSpacing;
        });
      }
    };

    // Layout root nodes horizontally
    const rootSpacing = 400;
    let rootX = startX;
    
    nodes.forEach((rootNode, index) => {
      calculateNodeLayout(rootNode, rootX, startY);
      rootX += rootSpacing;
    });

    return layout;
  };

  const { rootNodes } = buildHierarchy();
  const layout = calculateLayout(rootNodes);

  // Handle drag operations
  const handleDragStart = (e, nodeId) => {
    setDraggedNodeId(nodeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, nodeId) => {
    e.preventDefault();
    if (draggedNodeId && draggedNodeId !== nodeId) {
      setHoveredNodeId(nodeId);
    }
  };

  const handleDrop = (e, targetNodeId) => {
    e.preventDefault();
    if (draggedNodeId && draggedNodeId !== targetNodeId) {
      // Update hierarchy
      const updatedPositions = positions.map(pos => 
        pos.id === draggedNodeId ? { ...pos, parentId: targetNodeId } : pos
      );
      onChange('positions', updatedPositions);
    }
    setDraggedNodeId(null);
    setHoveredNodeId(null);
  };

  // Render connection lines
  const renderConnections = () => {
    const lines = [];
    
    positions.forEach(pos => {
      if (pos.parentId && layout[pos.id] && layout[pos.parentId]) {
        const parentLayout = layout[pos.parentId];
        const childLayout = layout[pos.id];
        
        lines.push(
          <svg
            key={`connection-${pos.id}`}
            className={styles['connection-line']}
            style={{
              position: 'absolute',
              left: Math.min(parentLayout.x, childLayout.x) + 75,
              top: Math.min(parentLayout.y, childLayout.y) + 40,
              width: Math.abs(childLayout.x - parentLayout.x) + 150,
              height: Math.abs(childLayout.y - parentLayout.y) + 80,
              pointerEvents: 'none',
              zIndex: 1
            }}
          >
            <line
              x1={parentLayout.x < childLayout.x ? 75 : Math.abs(childLayout.x - parentLayout.x) + 75}
              y1={parentLayout.y < childLayout.y ? 40 : Math.abs(childLayout.y - parentLayout.y) + 40}
              x2={parentLayout.x < childLayout.x ? Math.abs(childLayout.x - parentLayout.x) + 75 : 75}
              y2={parentLayout.y < childLayout.y ? Math.abs(childLayout.y - parentLayout.y) + 40 : 40}
              stroke="#cbd5e1"
              strokeWidth="2"
            />
          </svg>
        );
      }
    });
    
    return lines;
  };

  // Render org chart nodes
  const renderNodes = () => {
    return positions.map(position => {
      const pos = layout[position.id];
      if (!pos) return null;

      const isComplete = position.positionName && position.numberOfEmployees;
      const isSelected = selectedNodeId === position.id;
      const isHovered = hoveredNodeId === position.id;
      const isDragged = draggedNodeId === position.id;

      return (
        <div
          key={position.id}
          className={`${styles['org-node']} ${isComplete ? styles.complete : ''} ${isSelected ? styles.selected : ''} ${isHovered ? styles.hovered : ''} ${isDragged ? styles.dragged : ''}`}
          style={{
            position: 'absolute',
            left: pos.x * canvasTransform.scale + canvasTransform.x,
            top: pos.y * canvasTransform.scale + canvasTransform.y,
            transform: `scale(${canvasTransform.scale})`,
            zIndex: isDragged ? 1000 : isSelected ? 100 : 10
          }}
          draggable
          onDragStart={(e) => handleDragStart(e, position.id)}
          onDragOver={(e) => handleDragOver(e, position.id)}
          onDrop={(e) => handleDrop(e, position.id)}
          onClick={() => setSelectedNodeId(position.id)}
          onDoubleClick={() => editPosition(position)}
        >
          {/* Node Header */}
          <div className={styles['node-header']}>
            <div className={styles['node-avatar']}>
              {isComplete ? '👤' : '➕'}
            </div>
            <div className={styles['node-actions']}>
              <button 
                className={styles['node-action']}
                onClick={(e) => {
                  e.stopPropagation();
                  addPosition(position.id);
                }}
                title="Додај подредена позиција"
              >
                ➕
              </button>
              <button 
                className={styles['node-action']}
                onClick={(e) => {
                  e.stopPropagation();
                  deletePosition(position.id);
                }}
                title="Избриши позиција"
              >
                ❌
              </button>
            </div>
          </div>

          {/* Node Content */}
          <div className={styles['node-content']}>
            <h4 className={styles['node-title']}>
              {position.positionName || 'Нова позиција'}
            </h4>
            <p className={styles['node-subtitle']}>
              {position.numberOfEmployees ? `${position.numberOfEmployees} вработени` : 'Кликнете за уредување'}
            </p>
          </div>

          {/* Completion indicator */}
          <div className={styles['node-status']}>
            {isComplete ? '✅' : '⏳'}
          </div>
        </div>
      );
    });
  };

  return (
    <div className={styles['interactive-org-builder']}>
      {/* Toolbar */}
      <div className={styles['org-toolbar']}>
        <div className={styles['toolbar-left']}>
          <h2>🏢 Организациона структура</h2>
          <div className={styles['org-stats']}>
            <span>{positions.length} позиции</span>
            <span>•</span>
            <span>{positions.filter(p => p.positionName && p.numberOfEmployees).length} завршени</span>
          </div>
        </div>
        <div className={styles['toolbar-right']}>
          <button 
            className={styles['toolbar-btn']}
            onClick={() => addPosition()}
          >
            ➕ Додај позиција
          </button>
          <button 
            className={styles['toolbar-btn']}
            onClick={() => setCanvasTransform({ x: 0, y: 0, scale: 1 })}
          >
            🎯 Ресетирај поглед
          </button>
        </div>
      </div>

      {/* Interactive Canvas */}
      <div className={styles['org-canvas']}>
        {renderConnections()}
        {renderNodes()}
        
        {/* Instructions */}
        {positions.length === 1 && !positions[0].positionName && (
          <div className={styles['canvas-instructions']}>
            <h3>🚀 Започнете со изградбата на вашата организација</h3>
            <ul>
              <li>📝 <strong>Двоклик</strong> на позиција за уредување</li>
              <li>➕ <strong>Кликнете ➕</strong> за додавање подредени позиции</li>
              <li>🔗 <strong>Повлечете и спуштете</strong> за реорганизација</li>
              <li>❌ <strong>Кликнете ❌</strong> за бришење позиции</li>
            </ul>
          </div>
        )}
      </div>

      {/* Edit Position Modal */}
      {showModal && editingNodeId && (
        <PositionEditModal
          position={positions.find(p => p.id === editingNodeId)}
          onSave={savePosition}
          onClose={() => {
            setShowModal(false);
            setEditingNodeId(null);
          }}
        />
      )}
    </div>
  );
};

/**
 * Modern Positions Builder Component - Redesigned with Beautiful Visual Appeal
 * Features modern card-based layout with engaging animations and professional design
 */
const ModernPositionsBuilder = ({ positions, onChange, isGenerating }) => {
  const { positionTemplate } = organizationActConfig;
  const [autoCollapsedPositions, setAutoCollapsedPositions] = useState(new Set());
  const [focusedCard, setFocusedCard] = useState(null);

  // Add new position
  const addPosition = () => {
    const newPosition = {
      id: Date.now(),
      positionName: '',
      numberOfEmployees: '',
      educationRequirements: '',
      experienceRequirements: '',
      responsibilities: ''
    };

    const updatedPositions = [...positions, newPosition];
    onChange('positions', updatedPositions);
    
    // Focus on the new card
    setFocusedCard(newPosition.id);
    setTimeout(() => setFocusedCard(null), 2000);
  };

  // Update position field with auto-collapse when complete
  const updatePosition = (id, field, value) => {
    const updatedPositions = positions.map(pos =>
      pos.id === id ? { ...pos, [field]: value } : pos
    );
    onChange('positions', updatedPositions);

    // Auto-collapse if position has required fields
    const updatedPosition = updatedPositions.find(pos => pos.id === id);
    if (updatedPosition && updatedPosition.positionName && updatedPosition.numberOfEmployees) {
      setTimeout(() => {
        setAutoCollapsedPositions(prev => new Set([...prev, id]));
      }, 1500);
    }
  };

  // Remove position
  const removePosition = (id) => {
    const updatedPositions = positions.filter(pos => pos.id !== id);
    onChange('positions', updatedPositions);
    setAutoCollapsedPositions(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  // Toggle position collapse/expand
  const togglePosition = (id) => {
    setAutoCollapsedPositions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Calculate completion percentage for progress indicators
  const getCompletionPercentage = (position) => {
    const requiredFields = ['positionName', 'numberOfEmployees'];
    const optionalFields = ['educationRequirements', 'experienceRequirements', 'responsibilities'];
    
    const requiredComplete = requiredFields.filter(field => position[field]).length;
    const optionalComplete = optionalFields.filter(field => position[field]).length;
    
    return Math.round(((requiredComplete * 2 + optionalComplete) / (requiredFields.length * 2 + optionalFields.length)) * 100);
  };

  return (
    <div className={styles['modern-positions-builder']}>
      {/* Header with Add Button */}
      <div className={styles['modern-builder-header']}>
        <div className={styles['builder-stats']}>
          <span className={styles['stat-item']}>
            <span className={styles['stat-number']}>{positions.length}</span>
            <span className={styles['stat-label']}>позиции</span>
          </span>
          <span className={styles['stat-item']}>
            <span className={styles['stat-number']}>
              {positions.filter(p => p.positionName && p.numberOfEmployees).length}
            </span>
            <span className={styles['stat-label']}>готови</span>
          </span>
        </div>
        <button 
          type="button" 
          onClick={addPosition} 
          className={styles['modern-add-button']}
          disabled={isGenerating}
        >
          <span className={styles['add-button-icon']}>✨</span>
          Додај нова позиција
        </button>
      </div>

      {/* Empty State */}
      {positions.length === 0 && (
        <div className={styles['modern-empty-state']}>
          <div className={styles['empty-state-icon']}>💼</div>
          <h4 className={styles['empty-state-title']}>Започнете да градите</h4>
          <p className={styles['empty-state-description']}>
            Додајте ја првата работна позиција и изградете ја вашата организациона структура
          </p>
          <div className={styles['empty-state-features']}>
            <div className={styles['feature-item']}>⚡ Брзо додавање</div>
            <div className={styles['feature-item']}>📊 Автоматска хиерархија</div>
            <div className={styles['feature-item']}>🎯 Интелигентни препораки</div>
          </div>
        </div>
      )}

      {/* Position Cards Grid */}
      <div className={styles['modern-cards-grid']}>
        {positions.map((position, index) => {
          const isCollapsed = autoCollapsedPositions.has(position.id);
          const isFocused = focusedCard === position.id;
          const completionPercentage = getCompletionPercentage(position);
          const isComplete = position.positionName && position.numberOfEmployees;
          
          return (
            <div 
              key={position.id} 
              className={`${
                styles['modern-position-card']
              } ${
                isFocused ? styles['card-focused'] : ''
              } ${
                isComplete ? styles['card-complete'] : ''
              }`}
              data-position-id={position.id}
            >
              {/* Card Header */}
              <div className={styles['modern-card-header']}>
                <div className={styles['card-avatar']}>
                  <div className={styles['position-avatar']}>
                    {isComplete ? '✅' : '👤'}
                  </div>
                  <div className={styles['position-number']}>#{index + 1}</div>
                </div>
                
                <div className={styles['card-title-section']}>
                  <h4 className={styles['modern-card-title']}>
                    {position.positionName || 'Нова позиција'}
                  </h4>
                  <p className={styles['modern-card-subtitle']}>
                    {position.numberOfEmployees ? `${position.numberOfEmployees} вработени` : 'Конфигурирај позиција'}
                  </p>
                </div>

                <div className={styles['card-actions']}>
                  <div className={styles['completion-indicator']}>
                    <div 
                      className={styles['completion-circle']} 
                      style={{
                        background: `conic-gradient(#10b981 0deg ${completionPercentage * 3.6}deg, #f3f4f6 ${completionPercentage * 3.6}deg 360deg)`
                      }}
                    >
                      <span className={styles['completion-text']}>{completionPercentage}%</span>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => togglePosition(position.id)}
                    className={styles['modern-toggle-button']}
                    title={isCollapsed ? "Прошири" : "Сврти"}
                  >
                    {isCollapsed ? '📂' : '📁'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => removePosition(position.id)}
                    className={styles['modern-delete-button']}
                    disabled={isGenerating}
                    title="Отстрани позиција"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className={styles['card-progress-container']}>
                <div className={styles['card-progress-bar']}>
                  <div 
                    className={styles['card-progress-fill']}
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Collapsible Content */}
              {!isCollapsed && (
                <div className={styles['modern-card-content']}>
                  <div className={styles['modern-form-grid']}>
                    {/* Row 1: Basic Information */}
                    <div className={styles['form-row']}>
                      <div className={styles['modern-field']}>
                        <label className={styles['modern-label']}>
                          <span className={styles['label-icon']}>💼</span>
                          {positionTemplate.positionName.label}
                          <span className={styles['required-asterisk']}>*</span>
                        </label>
                        <input
                          type="text"
                          value={position.positionName || ''}
                          onChange={(e) => updatePosition(position.id, 'positionName', e.target.value)}
                          className={styles['modern-input']}
                          placeholder={positionTemplate.positionName.placeholder}
                          disabled={isGenerating}
                        />
                      </div>

                      <div className={styles['modern-field']}>
                        <label className={styles['modern-label']}>
                          <span className={styles['label-icon']}>👥</span>
                          {positionTemplate.numberOfEmployees.label}
                          <span className={styles['required-asterisk']}>*</span>
                        </label>
                        <input
                          type="text"
                          value={position.numberOfEmployees || ''}
                          onChange={(e) => updatePosition(position.id, 'numberOfEmployees', e.target.value)}
                          className={styles['modern-input']}
                          placeholder={positionTemplate.numberOfEmployees.placeholder}
                          disabled={isGenerating}
                        />
                      </div>
                    </div>

                    {/* Expandable Details Section */}
                    <div className={styles['details-section']}>
                      <h5 className={styles['details-header']}>📋 Детални барања</h5>
                      
                      <div className={styles['modern-field']}>
                        <label className={styles['modern-label']}>
                          <span className={styles['label-icon']}>🎓</span>
                          {positionTemplate.educationRequirements.label}
                        </label>
                        <textarea
                          value={position.educationRequirements || ''}
                          onChange={(e) => updatePosition(position.id, 'educationRequirements', e.target.value)}
                          className={styles['modern-textarea']}
                          placeholder={positionTemplate.educationRequirements.placeholder}
                          rows={3}
                          disabled={isGenerating}
                        />
                      </div>

                      <div className={styles['modern-field']}>
                        <label className={styles['modern-label']}>
                          <span className={styles['label-icon']}>⭐</span>
                          {positionTemplate.experienceRequirements.label}
                        </label>
                        <textarea
                          value={position.experienceRequirements || ''}
                          onChange={(e) => updatePosition(position.id, 'experienceRequirements', e.target.value)}
                          className={styles['modern-textarea']}
                          placeholder={positionTemplate.experienceRequirements.placeholder}
                          rows={2}
                          disabled={isGenerating}
                        />
                      </div>

                      <div className={styles['modern-field']}>
                        <label className={styles['modern-label']}>
                          <span className={styles['label-icon']}>📝</span>
                          {positionTemplate.responsibilities.label}
                        </label>
                        <textarea
                          value={position.responsibilities || ''}
                          onChange={(e) => updatePosition(position.id, 'responsibilities', e.target.value)}
                          className={styles['modern-textarea']}
                          placeholder={positionTemplate.responsibilities.placeholder}
                          rows={4}
                          disabled={isGenerating}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className={styles['modern-card-footer']}>
                    <div className={styles['footer-status']}>
                      {isComplete ? (
                        <span className={styles['status-complete']}>✨ Позицијата е готова</span>
                      ) : (
                        <span className={styles['status-incomplete']}>⏳ Дополнете ги задолжителните полиња</span>
                      )}
                    </div>
                    <button 
                      className={styles['quick-collapse-btn']} 
                      onClick={() => togglePosition(position.id)}
                    >
                      Сврти картичка
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Enhanced Positions Manager Component - Phase 2
 * Implements compact cards with auto-collapse and real-time updates
 */
const PositionsManager = ({ positions, onChange, isGenerating }) => {
  const { positionTemplate } = organizationActConfig;
  const [editingPosition, setEditingPosition] = useState(null);
  const [autoCollapsedPositions, setAutoCollapsedPositions] = useState(new Set());

  // Add new position
  const addPosition = () => {
    const newPosition = {
      id: Date.now(),
      positionName: '',
      numberOfEmployees: '',
      educationRequirements: '',
      experienceRequirements: '',
      responsibilities: ''
    };

    const updatedPositions = [...positions, newPosition];
    onChange('positions', updatedPositions);
  };

  // Update position field
  const updatePosition = (id, field, value) => {
    const updatedPositions = positions.map(pos =>
      pos.id === id ? { ...pos, [field]: value } : pos
    );
    onChange('positions', updatedPositions);
  };

  // Remove position
  const removePosition = (id) => {
    const updatedPositions = positions.filter(pos => pos.id !== id);
    onChange('positions', updatedPositions);
    // Also remove from collapsed state
    setAutoCollapsedPositions(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  // Toggle position collapse/expand
  const togglePosition = (id) => {
    setAutoCollapsedPositions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className={styles['positions-section']}>
      <div className={styles['section-header']}>
        <h4>Работни позиции</h4>
        <button 
          type="button" 
          onClick={addPosition} 
          className={styles['add-button']}
          disabled={isGenerating}
        >
          + Додај позиција
        </button>
      </div>

      {positions.length === 0 && (
        <div className={styles['empty-state']}>
          <p>Немате додадено работни позиции. Кликнете на "Додај позиција" за да започнете.</p>
        </div>
      )}

      {positions.map((position, index) => {
        const isCollapsed = autoCollapsedPositions.has(position.id);
        const hasContent = position.positionName || position.numberOfEmployees;
        
        return (
          <div key={position.id} className={styles['position-card']}>
            <div 
              className={styles['position-header']} 
              onClick={() => hasContent && togglePosition(position.id)}
              style={{ cursor: hasContent ? 'pointer' : 'default' }}
            >
              <div className={styles['position-title']}>
                <h5>Позиција #{index + 1}</h5>
                {hasContent && (
                  <span className={styles['position-summary']}>
                    {position.positionName} {position.numberOfEmployees && `(${position.numberOfEmployees})`}
                  </span>
                )}
              </div>
              <div className={styles['position-header-actions']}>
                {hasContent && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePosition(position.id);
                    }}
                    className={styles['collapse-button']}
                    title={isCollapsed ? "Прошири" : "Сврти"}
                  >
                    {isCollapsed ? '▼' : '▲'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePosition(position.id);
                  }}
                  className={styles['remove-button']}
                  disabled={isGenerating}
                  title="Отстрани позиција"
                >
                  ×
                </button>
              </div>
            </div>
            
            {!isCollapsed && (
              <div className={styles['position-fields']}>
                <div className={styles['field-row']}>
                  <div className={styles.field}>
                    <label>{positionTemplate.positionName.label} *</label>
                    <input
                      type="text"
                      value={position.positionName || ''}
                      onChange={(e) => updatePosition(position.id, 'positionName', e.target.value)}
                      className={styles.input}
                      placeholder={positionTemplate.positionName.placeholder}
                      disabled={isGenerating}
                    />
                  </div>

                  <div className={styles.field}>
                    <label>{positionTemplate.numberOfEmployees.label} *</label>
                    <input
                      type="text"
                      value={position.numberOfEmployees || ''}
                      onChange={(e) => updatePosition(position.id, 'numberOfEmployees', e.target.value)}
                      className={styles.input}
                      placeholder={positionTemplate.numberOfEmployees.placeholder}
                      disabled={isGenerating}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label>{positionTemplate.educationRequirements.label}</label>
                  <textarea
                    value={position.educationRequirements || ''}
                    onChange={(e) => updatePosition(position.id, 'educationRequirements', e.target.value)}
                    className={styles.textarea}
                    placeholder={positionTemplate.educationRequirements.placeholder}
                    rows={positionTemplate.educationRequirements.rows}
                    disabled={isGenerating}
                  />
                </div>

                <div className={styles.field}>
                  <label>{positionTemplate.experienceRequirements.label}</label>
                  <textarea
                    value={position.experienceRequirements || ''}
                    onChange={(e) => updatePosition(position.id, 'experienceRequirements', e.target.value)}
                    className={styles.textarea}
                    placeholder={positionTemplate.experienceRequirements.placeholder}
                    rows={positionTemplate.experienceRequirements.rows}
                    disabled={isGenerating}
                  />
                </div>

                <div className={styles.field}>
                  <label>{positionTemplate.responsibilities.label}</label>
                  <textarea
                    value={position.responsibilities || ''}
                    onChange={(e) => updatePosition(position.id, 'responsibilities', e.target.value)}
                    className={styles.textarea}
                    placeholder={positionTemplate.responsibilities.placeholder}
                    rows={positionTemplate.responsibilities.rows}
                    disabled={isGenerating}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Enhanced Position Modal - Modern, comprehensive position editing
 * Features auto-save, validation, and intelligent suggestions
 */
const EnhancedPositionModal = ({ position, onSave, onClose }) => {
  const { positionTemplate } = organizationActConfig;
  const [formData, setFormData] = useState({
    positionName: position.positionName || '',
    numberOfEmployees: position.numberOfEmployees || '',
    educationRequirements: position.educationRequirements || '',
    experienceRequirements: position.experienceRequirements || '',
    responsibilities: position.responsibilities || ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Position suggestions based on common roles
  const positionSuggestions = [
    'Главен извршен директор',
    'Технички директор',
    'Оперативен директор',
    'Финансиски директор',
    'Менаџер за човечки ресурси',
    'ИТ менаџер',
    'Маркетинг менаџер',
    'Менаџер за продажба',
    'Програмер',
    'Виши програмер',
    'Помлад програмер',
    'Бизнис аналитичар',
    'Проектен менаџер',
    'Административен работник',
    'Сметководител',
    'Корисничка поддршка'
  ];

  // Real-time validation
  const validateField = (fieldName, value) => {
    const errors = { ...validationErrors };
    
    switch (fieldName) {
      case 'positionName':
        if (!value.trim()) {
          errors.positionName = 'Position name is required';
        } else if (value.trim().length < 2) {
          errors.positionName = 'Position name must be at least 2 characters';
        } else {
          delete errors.positionName;
        }
        break;
      
      case 'numberOfEmployees':
        if (!value.trim()) {
          errors.numberOfEmployees = 'Number of employees is required';
        } else if (!/^\d+/.test(value.trim())) {
          errors.numberOfEmployees = 'Must start with a number';
        } else {
          delete errors.numberOfEmployees;
        }
        break;
        
      default:
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleSave = async () => {
    // Validate all required fields
    const isValid = validateField('positionName', formData.positionName) && 
                   validateField('numberOfEmployees', formData.numberOfEmployees);
    
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate save delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      onSave(formData);
    } catch (error) {
      console.error('Error saving position:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  const fillSuggestion = (suggestion) => {
    handleChange('positionName', suggestion);
    setShowSuggestions(false);
  };

  const getCompletionPercentage = () => {
    const fields = ['positionName', 'numberOfEmployees', 'educationRequirements', 'experienceRequirements', 'responsibilities'];
    const completed = fields.filter(field => {
      const value = formData[field];
      if (!value) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    }).length;
    return Math.round((completed / fields.length) * 100);
  };

  return (
    <div className={styles['modal-overlay']} onClick={onClose}>
      <div 
        className={styles['enhanced-position-modal']} 
        onClick={(e) => e.stopPropagation()} 
        onKeyDown={handleKeyDown}
      >
        {/* Modal Header */}
        <div className={styles['enhanced-modal-header']}>
          <div className={styles['modal-title-section']}>
            <h2 className={styles['modal-title']}>✏️ Уредување на позиција</h2>
            <div className={styles['completion-badge']}>
              <div className={styles['completion-circle']}>
                <span>{getCompletionPercentage()}%</span>
              </div>
              <span>Завршено</span>
            </div>
          </div>
          <button className={styles['enhanced-close-btn']} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles['enhanced-modal-body']}>
          {/* Essential Information */}
          <div className={styles['modal-section']}>
            <h3 className={styles['section-title']}>
              <span className={styles['section-icon']}>📋</span>
              Основни информации
            </h3>
            
            <div className={styles['form-row']}>
              <div className={styles['form-group']}>
                <label className={styles['enhanced-label']}>
                  💼 Наслов на позиција *
                </label>
                <div className={styles['input-with-suggestions']}>
                  <input
                    type="text"
                    value={formData.positionName}
                    onChange={(e) => handleChange('positionName', e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Enter position title..."
                    className={`${styles['enhanced-input']} ${
                      validationErrors.positionName ? styles['input-error'] : ''
                    }`}
                    autoFocus
                  />
                  
                  {/* Suggestions dropdown */}
                  {showSuggestions && (
                    <div className={styles['suggestions-dropdown']}>
                      {positionSuggestions
                        .filter(suggestion => 
                          suggestion.toLowerCase().includes(formData.positionName.toLowerCase()) ||
                          formData.positionName === ''
                        )
                        .slice(0, 8)
                        .map((suggestion, index) => (
                          <button
                            key={index}
                            className={styles['suggestion-item']}
                            onMouseDown={() => fillSuggestion(suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>
                {validationErrors.positionName && (
                  <span className={styles['error-message']}>{validationErrors.positionName}</span>
                )}
              </div>

              <div className={styles['form-group']}>
                <label className={styles['enhanced-label']}>
                  👥 Number of Employees *
                </label>
                <input
                  type="text"
                  value={formData.numberOfEmployees}
                  onChange={(e) => handleChange('numberOfEmployees', e.target.value)}
                  placeholder="e.g., 1 (еден), 3 (три)"
                  className={`${styles['enhanced-input']} ${
                    validationErrors.numberOfEmployees ? styles['input-error'] : ''
                  }`}
                />
                {validationErrors.numberOfEmployees && (
                  <span className={styles['error-message']}>{validationErrors.numberOfEmployees}</span>
                )}
              </div>
            </div>
          </div>

          {/* Requirements & Qualifications */}
          <div className={styles['modal-section']}>
            <h3 className={styles['section-title']}>
              <span className={styles['section-icon']}>🎯</span>
              Requirements & Qualifications
            </h3>
            
            <div className={styles['form-group']}>
              <label className={styles['enhanced-label']}>
                🎓 Education Requirements
              </label>
              <textarea
                value={formData.educationRequirements}
                onChange={(e) => handleChange('educationRequirements', e.target.value)}
                placeholder="e.g., Bachelor's degree in relevant field, specific certifications..."
                className={styles['enhanced-textarea']}
                rows={3}
              />
            </div>

            <div className={styles['form-group']}>
              <label className={styles['enhanced-label']}>
                ⭐ Experience Requirements
              </label>
              <textarea
                value={formData.experienceRequirements}
                onChange={(e) => handleChange('experienceRequirements', e.target.value)}
                placeholder="e.g., 3+ years of experience in similar role, specific skills..."
                className={styles['enhanced-textarea']}
                rows={2}
              />
            </div>
          </div>

          {/* Job Responsibilities */}
          <div className={styles['modal-section']}>
            <h3 className={styles['section-title']}>
              <span className={styles['section-icon']}>📝</span>
              Job Responsibilities
            </h3>
            
            <div className={styles['form-group']}>
              <label className={styles['enhanced-label']}>
                📋 Main Responsibilities
              </label>
              <textarea
                value={formData.responsibilities}
                onChange={(e) => handleChange('responsibilities', e.target.value)}
                placeholder="Describe the main duties and responsibilities for this position..."
                className={styles['enhanced-textarea']}
                rows={5}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={styles['enhanced-modal-footer']}>
          <div className={styles['footer-left']}>
            <div className={styles['keyboard-shortcuts']}>
              <span className={styles['shortcut']}>
                <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to save
              </span>
              <span className={styles['shortcut']}>
                <kbd>Esc</kbd> to cancel
              </span>
            </div>
          </div>
          
          <div className={styles['footer-actions']}>
            <button 
              className={styles['cancel-btn']} 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              className={`${styles['save-btn']} ${isSubmitting ? styles['saving'] : ''}`}
              onClick={handleSave}
              disabled={isSubmitting || Object.keys(validationErrors).length > 0}
            >
              {isSubmitting ? (
                <>
                  <span className={styles['spinner']} />
                  Saving...
                </>
              ) : (
                <>💾 Save Position</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Position Edit Modal - Excel-like editing experience
 */
const PositionEditModal = ({ position, onSave, onClose }) => {
  const { positionTemplate } = organizationActConfig;
  const [formData, setFormData] = useState({
    positionName: position.positionName || '',
    numberOfEmployees: position.numberOfEmployees || '',
    educationRequirements: position.educationRequirements || '',
    experienceRequirements: position.experienceRequirements || '',
    responsibilities: position.responsibilities || ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <div className={styles['modal-overlay']} onClick={onClose}>
      <div className={styles['position-edit-modal']} onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        {/* Modal Header */}
        <div className={styles['modal-header']}>
          <h3>✏️ Уредување на позиција</h3>
          <button className={styles['close-button']} onClick={onClose}>×</button>
        </div>

        {/* Modal Body */}
        <div className={styles['modal-body']}>
          <div className={styles['modal-form']}>
            {/* Essential Fields */}
            <div className={styles['form-section']}>
              <h4>📋 Основни информации</h4>
              <div className={styles['form-grid']}>
                <div className={styles['form-field']}>
                  <label>
                    💼 {positionTemplate.positionName.label} *
                  </label>
                  <input
                    type="text"
                    value={formData.positionName}
                    onChange={(e) => handleChange('positionName', e.target.value)}
                    placeholder={positionTemplate.positionName.placeholder}
                    className={styles['modal-input']}
                    autoFocus
                  />
                </div>
                <div className={styles['form-field']}>
                  <label>
                    👥 {positionTemplate.numberOfEmployees.label} *
                  </label>
                  <input
                    type="text"
                    value={formData.numberOfEmployees}
                    onChange={(e) => handleChange('numberOfEmployees', e.target.value)}
                    placeholder={positionTemplate.numberOfEmployees.placeholder}
                    className={styles['modal-input']}
                  />
                </div>
              </div>
            </div>

            {/* Detailed Requirements */}
            <div className={styles['form-section']}>
              <h4>🎯 Детални барања</h4>
              <div className={styles['form-field']}>
                <label>
                  🎓 {positionTemplate.educationRequirements.label}
                </label>
                <textarea
                  value={formData.educationRequirements}
                  onChange={(e) => handleChange('educationRequirements', e.target.value)}
                  placeholder={positionTemplate.educationRequirements.placeholder}
                  className={styles['modal-textarea']}
                  rows={3}
                />
              </div>
              <div className={styles['form-field']}>
                <label>
                  ⭐ {positionTemplate.experienceRequirements.label}
                </label>
                <textarea
                  value={formData.experienceRequirements}
                  onChange={(e) => handleChange('experienceRequirements', e.target.value)}
                  placeholder={positionTemplate.experienceRequirements.placeholder}
                  className={styles['modal-textarea']}
                  rows={2}
                />
              </div>
              <div className={styles['form-field']}>
                <label>
                  📝 {positionTemplate.responsibilities.label}
                </label>
                <textarea
                  value={formData.responsibilities}
                  onChange={(e) => handleChange('responsibilities', e.target.value)}
                  placeholder={positionTemplate.responsibilities.placeholder}
                  className={styles['modal-textarea']}
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className={styles['modal-actions']}>
          <div className={styles['modal-shortcut-hint']}>
            💡 Ctrl+Enter за зачувување • Esc за откажување
          </div>
          <div className={styles['modal-buttons']}>
            <button className={styles['cancel-btn']} onClick={onClose}>
              Откажи
            </button>
            <button className={styles['save-btn']} onClick={handleSave}>
              💾 Зачувај
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationActPage;